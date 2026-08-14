import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

export interface RateLimitConfig {
  actionName: string;
  windowMs: number; // Duration of sliding window in ms
  max: number; // Max actions allowed within windowMs
  minIntervalMs?: number; // Minimum cooldown between consecutive actions
  errorCode?: string;
  customMessage?: (retryAfterSeconds: number, max: number, windowSeconds: number) => string;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterSeconds: number;
  resetTime: Date;
  errorCode?: string;
  message: string;
}

interface ActionRecord {
  timestamps: number[];
  lastAction: number;
  violationCount: number;
  lastViolation: number;
}

export class RateLimiterService {
  // Store: Map<"userId:actionName" | "ip:actionName", ActionRecord>
  private records: Map<string, ActionRecord> = new Map();

  // Preset Configurations
  public static readonly PRESETS = {
    // Campaign creation: Max 3 campaigns per 5 mins, min 10s cooldown
    CAMPAIGN_CREATION: {
      actionName: 'campaign_creation',
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 3,
      minIntervalMs: 10 * 1000, // 10 seconds between campaigns
      errorCode: 'CAMPAIGN_RATE_LIMIT_EXCEEDED',
      customMessage: (retryAfter, max, windowSec) =>
        `Campaign creation rate limit reached (${max} campaigns per ${Math.round(
          windowSec / 60
        )} minutes). Please wait ${retryAfter}s before launching another campaign.`,
    } as RateLimitConfig,

    // Sub4Sub Action (Subscribe / Request sub-back / Verify Claim): Max 10 actions per 60s, min 3s cooldown
    EXCHANGE_ACTION: {
      actionName: 'exchange_action',
      windowMs: 60 * 1000, // 60 seconds
      max: 10,
      minIntervalMs: 3 * 1000, // 3 seconds between actions
      errorCode: 'EXCHANGE_RATE_LIMIT_EXCEEDED',
      customMessage: (retryAfter, max) =>
        `Exchange action rate limit exceeded (${max} actions/min). Please slow down and wait ${retryAfter}s to protect network integrity.`,
    } as RateLimitConfig,

    // Video Watch Claim: Max 6 watch rewards per 60s
    WATCH_ACTION: {
      actionName: 'watch_action',
      windowMs: 60 * 1000, // 60 seconds
      max: 6,
      minIntervalMs: 5 * 1000,
      errorCode: 'WATCH_RATE_LIMIT_EXCEEDED',
      customMessage: (retryAfter, max) =>
        `Watch reward rate limit reached (${max} views/min). Please wait ${retryAfter}s before claiming the next view reward.`,
    } as RateLimitConfig,

    // Challenge Start: Max 8 challenges per 60s
    CHALLENGE_START: {
      actionName: 'challenge_start',
      windowMs: 60 * 1000,
      max: 8,
      minIntervalMs: 2 * 1000,
      errorCode: 'CHALLENGE_RATE_LIMIT_EXCEEDED',
      customMessage: (retryAfter) =>
        `Too many verification challenges started. Please wait ${retryAfter}s before initiating a new task challenge.`,
    } as RateLimitConfig,

    // Discovery Reward: Max 15 discovery tasks per 60s
    DISCOVERY_ACTION: {
      actionName: 'discovery_action',
      windowMs: 60 * 1000,
      max: 15,
      minIntervalMs: 2 * 1000,
      errorCode: 'DISCOVERY_RATE_LIMIT_EXCEEDED',
      customMessage: (retryAfter, max) =>
        `Discovery rate limit reached (${max} discoveries/min). Please wait ${retryAfter}s before discovering more channels.`,
    } as RateLimitConfig,
  };

  constructor() {
    // Periodically clean up stale records every 10 minutes
    setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }

  /**
   * Get unique rate-limit key for a user or IP
   */
  private getKey(identifier: string, actionName: string): string {
    return `${identifier}:${actionName}`;
  }

  /**
   * Evaluates rate limit for a specific identifier and action
   */
  public checkLimit(identifier: string, config: RateLimitConfig): RateLimitCheckResult {
    const key = this.getKey(identifier, config.actionName);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    let record = this.records.get(key);
    if (!record) {
      record = {
        timestamps: [],
        lastAction: 0,
        violationCount: 0,
        lastViolation: 0,
      };
      this.records.set(key, record);
    }

    // Filter out timestamps outside the sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    // 1. Check Cooldown Interval (rapid-fire clicks)
    if (config.minIntervalMs && record.lastAction > 0) {
      const elapsedSinceLast = now - record.lastAction;
      if (elapsedSinceLast < config.minIntervalMs) {
        const cooldownWait = Math.ceil((config.minIntervalMs - elapsedSinceLast) / 1000);
        this.recordViolation(identifier, config.actionName, record);

        return {
          allowed: false,
          remaining: 0,
          limit: config.max,
          retryAfterSeconds: Math.max(1, cooldownWait),
          resetTime: new Date(record.lastAction + config.minIntervalMs),
          errorCode: config.errorCode || 'COOLDOWN_ACTIVE',
          message: `Action attempted too quickly. Please wait ${cooldownWait}s before repeating.`,
        };
      }
    }

    // 2. Check Sliding Window Max Capacity
    if (record.timestamps.length >= config.max) {
      const oldestActive = record.timestamps[0];
      const retryAfterMs = oldestActive + config.windowMs - now;
      const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
      const resetTime = new Date(oldestActive + config.windowMs);

      this.recordViolation(identifier, config.actionName, record);

      const message = config.customMessage
        ? config.customMessage(retryAfterSeconds, config.max, Math.round(config.windowMs / 1000))
        : `Rate limit reached for ${config.actionName} (${config.max} allowed). Try again in ${retryAfterSeconds}s.`;

      return {
        allowed: false,
        remaining: 0,
        limit: config.max,
        retryAfterSeconds,
        resetTime,
        errorCode: config.errorCode || 'RATE_LIMIT_EXCEEDED',
        message,
      };
    }

    // Allowed! Calculate remaining allowance
    const remaining = config.max - (record.timestamps.length + 1);
    const resetTime = record.timestamps.length > 0
      ? new Date(record.timestamps[0] + config.windowMs)
      : new Date(now + config.windowMs);

    return {
      allowed: true,
      remaining: Math.max(0, remaining),
      limit: config.max,
      retryAfterSeconds: 0,
      resetTime,
      message: 'OK',
    };
  }

  /**
   * Records a successfully executed action in the sliding window
   */
  public recordAction(identifier: string, actionName: string): void {
    const key = this.getKey(identifier, actionName);
    const now = Date.now();

    let record = this.records.get(key);
    if (!record) {
      record = {
        timestamps: [],
        lastAction: 0,
        violationCount: 0,
        lastViolation: 0,
      };
      this.records.set(key, record);
    }

    record.timestamps.push(now);
    record.lastAction = now;
  }

  /**
   * Tracks repeated rate-limit violations and notifies Anti-Fraud system if abusive
   */
  private recordViolation(identifier: string, actionName: string, record: ActionRecord): void {
    const now = Date.now();
    // Reset violation count if last violation was more than 3 minutes ago
    if (now - record.lastViolation > 3 * 60 * 1000) {
      record.violationCount = 0;
    }

    record.violationCount += 1;
    record.lastViolation = now;

    // If 4+ violations in short succession, flag user to database
    if (record.violationCount === 4) {
      const user = db.users.get(identifier);
      if (user) {
        user.riskScore = Math.min(100, user.riskScore + 15);

        db.reports.push({
          id: `rate_limit_report_${Date.now()}`,
          reporterUserId: 'rate_limiter_service',
          reporterUsername: 'RateLimiterService',
          targetType: 'creator',
          targetId: user.id,
          reason: `[EXCESSIVE_RATE_LIMIT_VIOLATIONS] User exceeded ${actionName} rate limits 4+ times rapidly. Potential automated bot/macro abuse.`,
          status: 'pending',
          createdAt: new Date().toISOString(),
        });

        db.notifications.unshift({
          id: `notif_ratelimit_${Date.now()}`,
          userId: user.id,
          title: '⚠️ Rapid Activity Warning',
          message: `You are performing ${actionName} actions unusually fast. Please pace your requests to keep the sub-for-sub exchange fair.`,
          type: 'warning',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Get user status across all rate-limited categories
   */
  public getUserStatus(identifier: string): Record<string, any> {
    const now = Date.now();
    const result: Record<string, any> = {};

    for (const [presetKey, config] of Object.entries(RateLimiterService.PRESETS)) {
      const key = this.getKey(identifier, config.actionName);
      const record = this.records.get(key);
      const activeTimestamps = (record?.timestamps || []).filter((ts) => ts > now - config.windowMs);

      const oldest = activeTimestamps[0];
      const retryAfterSeconds = oldest
        ? Math.max(0, Math.ceil((oldest + config.windowMs - now) / 1000))
        : 0;

      result[config.actionName] = {
        actionName: config.actionName,
        currentUsage: activeTimestamps.length,
        limit: config.max,
        remaining: Math.max(0, config.max - activeTimestamps.length),
        windowSeconds: Math.round(config.windowMs / 1000),
        retryAfterSeconds,
        isLimited: activeTimestamps.length >= config.max,
      };
    }

    return result;
  }

  /**
   * Express Middleware Factory
   */
  public createMiddleware(config: RateLimitConfig) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const identifier =
        req.user?.id ||
        (req.headers['x-forwarded-for'] as string) ||
        req.ip ||
        'anonymous';

      const result = this.checkLimit(identifier, config);

      // Set standard RateLimit headers
      res.setHeader('X-RateLimit-Limit', config.max);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime.getTime() / 1000));

      if (!result.allowed) {
        res.setHeader('Retry-After', result.retryAfterSeconds);
        return res.status(429).json({
          success: false,
          message: result.message,
          errorCode: result.errorCode || 'RATE_LIMIT_EXCEEDED',
          retryAfterSeconds: result.retryAfterSeconds,
          resetTime: result.resetTime.toISOString(),
          currentUsage: {
            limit: config.max,
            windowSeconds: Math.round(config.windowMs / 1000),
          },
        });
      }

      // Record action on finish if response is successful (< 400)
      res.on('finish', () => {
        if (res.statusCode < 400) {
          this.recordAction(identifier, config.actionName);
        }
      });

      next();
    };
  }

  /**
   * Cleanup expired memory entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      // 10 minutes inactive threshold
      if (now - record.lastAction > 10 * 60 * 1000 && now - record.lastViolation > 10 * 60 * 1000) {
        this.records.delete(key);
      }
    }
  }
}

export const rateLimiterService = new RateLimiterService();
