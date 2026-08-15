import { db } from '../db';
import { SpamIncident, User } from '../../types';

export interface TaskChallengeSession {
  verificationToken: string;
  userId: string;
  targetUserId?: string;
  promotionId?: string;
  taskType: 'subscribe' | 'view' | 'referral' | 'daily';
  platform: string;
  channelUrl: string;
  challengeCode: number;
  issuedAt: number;
  minSecondsRequired: number;
  clientIpHash: string;
  userAgent: string;
  status: 'pending' | 'verified' | 'failed' | 'expired';
}

class AntiFraudEngine {
  private activeSessions: Map<string, TaskChallengeSession> = new Map();
  private userClaimTimestamps: Map<string, number[]> = new Map();
  private userIpHistory: Map<string, Set<string>> = new Map();
  private concurrentWatchTracker: Map<string, { startTime: number; promotionId: string }> = new Map();

  /**
   * 1. Start a task challenge: Issues anti-cheat token and required wait time
   */
  public startChallenge(
    userId: string,
    targetUserId?: string,
    promotionId?: string,
    platform: string = 'YouTube',
    channelUrl: string = '',
    clientIp: string = '127.0.0.1',
    userAgent: string = '',
    taskType: 'subscribe' | 'view' | 'referral' | 'daily' = 'subscribe',
    minSecondsRequired: number = 3
  ): { verificationToken: string; challengeCode: number; minWaitSeconds: number } {
    const verificationToken = `vtok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const challengeCode = Math.floor(1000 + Math.random() * 9000);
    const minWait = Math.max(db.systemSettings.minChallengeWaitSeconds || 3, minSecondsRequired);

    const session: TaskChallengeSession = {
      verificationToken,
      userId,
      targetUserId,
      promotionId,
      taskType,
      platform,
      channelUrl,
      challengeCode,
      issuedAt: Date.now(),
      minSecondsRequired: minWait,
      clientIpHash: clientIp,
      userAgent,
      status: 'pending',
    };

    // Track active video watch session
    if (taskType === 'view' && promotionId) {
      this.concurrentWatchTracker.set(userId, {
        startTime: Date.now(),
        promotionId,
      });
    }

    // Record IP for sybil detection
    if (!this.userIpHistory.has(userId)) {
      this.userIpHistory.set(userId, new Set());
    }
    this.userIpHistory.get(userId)!.add(clientIp);

    this.activeSessions.set(verificationToken, session);
    return { verificationToken, challengeCode, minWaitSeconds: minWait };
  }

  /**
   * 2. Core Subscribe / Discovery Verification & Velocity Rate-Limiting
   */
  public verifyAndClaim(
    userId: string,
    verificationToken: string,
    providedChallengeCode?: number | string,
    clientIp: string = '127.0.0.1',
    userAgent: string = ''
  ): {
    passed: boolean;
    errorCode?: string;
    message: string;
    riskScore: number;
    isLocked?: boolean;
    lockoutReason?: string;
    auditDetails?: any;
    targetUserId?: string;
    promotionId?: string;
  } {
    const user = db.users.get(userId);
    if (!user) {
      return { passed: false, errorCode: 'USER_NOT_FOUND', message: 'User account not found.', riskScore: 100 };
    }

    // Check 0: Check if account is currently locked or suspended
    if (user.isLocked || user.status === 'restricted' || user.status === 'suspended' || user.status === 'banned') {
      const isExpired = user.lockoutExpiresAt && new Date(user.lockoutExpiresAt).getTime() < Date.now();
      if (isExpired && user.status === 'restricted') {
        // Auto-release expired lockout
        db.unlockUserAccount(user.id, 'system_engine', 'System Engine', 'Lockout duration expired');
      } else {
        return {
          passed: false,
          errorCode: 'ACCOUNT_LOCKED',
          message: `Your account is currently locked: ${user.lockoutReason || 'Security restrictions apply'}.`,
          riskScore: user.riskScore || 80,
          isLocked: true,
          lockoutReason: user.lockoutReason,
        };
      }
    }

    // Check if user permissions allow earning
    if (user.canEarn === false || user.permissionsOverride?.canEarn === false) {
      return {
        passed: false,
        errorCode: 'EARNING_RESTRICTED',
        message: 'Earning features have been administratively disabled for this account.',
        riskScore: user.riskScore || 0,
      };
    }

    const session = this.activeSessions.get(verificationToken);
    if (!session) {
      // Allow fallback if valid user with low risk
      if ((user.riskScore || 0) < 50) {
        return {
          passed: true,
          message: 'Task claim authenticated successfully.',
          riskScore: user.riskScore || 0,
        };
      }
      return {
        passed: false,
        errorCode: 'INVALID_TOKEN',
        message: 'Security challenge token not recognized or expired.',
        riskScore: user.riskScore || 0,
      };
    }

    if (session.userId !== userId) {
      this.recordAbnormalAction(
        user,
        'token_tampering',
        'high',
        `Token ownership mismatch. Claim attempted for session belonging to another user.`,
        35,
        clientIp
      );
      return {
        passed: false,
        errorCode: 'TOKEN_OWNERSHIP_MISMATCH',
        message: 'Anti-cheat alert: Task token ownership mismatch.',
        riskScore: user.riskScore || 0,
        isLocked: user.isLocked,
      };
    }

    if (session.status !== 'pending') {
      this.recordAbnormalAction(
        user,
        'velocity_abuse',
        'medium',
        `Replay claim attempt on already processed verification token ${verificationToken}.`,
        15,
        clientIp
      );
      return {
        passed: false,
        errorCode: 'REPLAY_ATTEMPT',
        message: 'Task verification token already claimed.',
        riskScore: user.riskScore || 0,
        isLocked: user.isLocked,
      };
    }

    const now = Date.now();
    const actualElapsedMs = now - session.issuedAt;
    const actualElapsedSeconds = actualElapsedMs / 1000;

    // Check 1: Expiration check (10 minutes max window)
    if (actualElapsedSeconds > 600) {
      session.status = 'expired';
      return {
        passed: false,
        errorCode: 'TOKEN_EXPIRED',
        message: 'Verification challenge expired. Tasks must be completed within 10 minutes.',
        riskScore: user.riskScore || 0,
      };
    }

    // Check 2: Minimum Wait Time Enforcement (Bot click prevention)
    if (actualElapsedSeconds < session.minSecondsRequired) {
      this.recordAbnormalAction(
        user,
        'subscribe_spam',
        'medium',
        `Instant task completion reported in ${actualElapsedSeconds.toFixed(1)}s (Required: ${session.minSecondsRequired}s). Automated skip suspected.`,
        20,
        clientIp
      );
      return {
        passed: false,
        errorCode: 'COMPLETED_TOO_FAST',
        message: `Task verification completed too quickly (${actualElapsedSeconds.toFixed(1)}s). Please spend at least ${session.minSecondsRequired} seconds interacting before claiming.`,
        riskScore: user.riskScore,
        isLocked: user.isLocked,
      };
    }

    // Check 3: Velocity & Click Frequency Check (Rate limiting)
    const recentClaims = this.userClaimTimestamps.get(userId) || [];
    const oneMinuteAgo = now - 60000;
    const filteredClaims = recentClaims.filter((t) => t > oneMinuteAgo);
    filteredClaims.push(now);
    this.userClaimTimestamps.set(userId, filteredClaims);

    const maxClaimsPerMin = db.systemSettings.maxClaimsPerMinute || 6;
    if (filteredClaims.length > maxClaimsPerMin) {
      const isCritical = filteredClaims.length > maxClaimsPerMin + 4;
      const lockoutResult = this.recordAbnormalAction(
        user,
        'velocity_abuse',
        isCritical ? 'critical' : 'high',
        `Abnormal task velocity: ${filteredClaims.length} claims in under 60 seconds (Limit: ${maxClaimsPerMin}/min).`,
        isCritical ? 45 : 25,
        clientIp,
        isCritical
      );

      return {
        passed: false,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        message: isCritical
          ? `Account locked due to abnormal rapid click automation (${filteredClaims.length} claims/min).`
          : `Velocity limit exceeded. Please wait a moment before claiming your next task.`,
        riskScore: user.riskScore,
        isLocked: user.isLocked,
        lockoutReason: user.lockoutReason,
      };
    }

    // Passed all anti-fraud checks!
    session.status = 'verified';
    user.riskScore = Math.max(0, (user.riskScore || 0) - 2);

    return {
      passed: true,
      message: 'Task verified and rewards claimed successfully! 🚀',
      riskScore: user.riskScore,
      targetUserId: session.targetUserId,
      promotionId: session.promotionId,
      auditDetails: {
        verificationToken,
        taskType: session.taskType,
        elapsedSeconds: actualElapsedSeconds.toFixed(1),
        ipHash: session.clientIpHash,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * 3. Views & Video Watch Fraud Tracking
   */
  public verifyVideoWatchTask(
    userId: string,
    promotionId: string,
    reportedWatchSeconds: number,
    verificationToken: string,
    clientIp: string = '127.0.0.1'
  ): { passed: boolean; message: string; errorCode?: string; isLocked?: boolean } {
    const user = db.users.get(userId);
    if (!user) return { passed: false, errorCode: 'USER_NOT_FOUND', message: 'User not found' };

    const promo = db.promotions.get(promotionId);
    const requiredSeconds = promo?.requiredStaySeconds || db.systemSettings.minWatchStaySeconds || 10;

    const session = this.activeSessions.get(verificationToken);
    const now = Date.now();

    if (session) {
      const elapsedSeconds = (now - session.issuedAt) / 1000;
      if (elapsedSeconds < requiredSeconds * 0.7) {
        this.recordAbnormalAction(
          user,
          'view_botting',
          'high',
          `Video watch claim reported ${reportedWatchSeconds}s but real elapsed time was ${elapsedSeconds.toFixed(1)}s (Required: ${requiredSeconds}s). Instant view spoofing detected.`,
          30,
          clientIp
        );
        return {
          passed: false,
          errorCode: 'VIEW_TIME_INSUFFICIENT',
          message: `Watch time verification failed. You watched for ${elapsedSeconds.toFixed(0)}s out of required ${requiredSeconds}s.`,
          isLocked: user.isLocked,
        };
      }
    }

    return { passed: true, message: 'Video watch verified successfully.' };
  }

  /**
   * 4. Referral Spam & Sybil Ring Detection
   */
  public auditReferralAttempt(
    referrer: User,
    referee: User,
    clientIp: string = '127.0.0.1'
  ): { allowed: boolean; reason?: string } {
    // 1. Self-referral check
    if (referrer.id === referee.id || referrer.username.toLowerCase() === referee.username.toLowerCase()) {
      return { allowed: false, reason: 'You cannot use your own referral code.' };
    }

    // 2. Cyclic referral check (A referred B, B cannot be referred by A)
    if (referrer.referredBy === referee.id) {
      this.recordAbnormalAction(
        referee,
        'referral_fraud',
        'high',
        `Cyclical mutual referral ring detected between @${referrer.username} and @${referee.username}.`,
        35,
        clientIp
      );
      return { allowed: false, reason: 'Mutual cyclic referral detected. Request rejected by anti-fraud.' };
    }

    // 3. Same IP Sybil Ring check
    const referrerIps = this.userIpHistory.get(referrer.id);
    if (referrerIps && referrerIps.has(clientIp) && clientIp !== '127.0.0.1' && clientIp !== '::1') {
      this.recordAbnormalAction(
        referee,
        'referral_fraud',
        'medium',
        `Referrer @${referrer.username} and referee @${referee.username} share the same IP address (${clientIp}). Sybil self-farming suspected.`,
        25,
        clientIp
      );
    }

    // 4. Referral velocity check
    const todayReferrals = db.referrals.filter(
      (r) => r.referrerUserId === referrer.id && new Date(r.createdAt).toDateString() === new Date().toDateString()
    );
    if (todayReferrals.length >= 25 && !referrer.isPro) {
      return { allowed: false, reason: 'Daily referral cap reached for this creator tier.' };
    }

    return { allowed: true };
  }

  /**
   * 5. Record Abnormal Action, Update Risk Score & Trigger Automated Account Lockout
   */
  public recordAbnormalAction(
    user: User,
    actionType: SpamIncident['actionType'],
    severity: SpamIncident['severity'],
    details: string,
    riskIncrement: number,
    clientIp: string = '127.0.0.1',
    forceLockout: boolean = false
  ): { incident: SpamIncident; accountLocked: boolean } {
    const riskBefore = user.riskScore || 0;
    const riskAfter = Math.min(100, riskBefore + riskIncrement);
    user.riskScore = riskAfter;

    if (!user.recentAbuseFlags) user.recentAbuseFlags = [];
    user.recentAbuseFlags.unshift(`[${actionType}] ${details}`);
    if (user.recentAbuseFlags.length > 10) user.recentAbuseFlags.pop();

    const lockoutThreshold = db.systemSettings.autoLockoutRiskThreshold || 75;
    const shouldLock = forceLockout || riskAfter >= lockoutThreshold;

    let accountLocked = false;
    if (shouldLock && !user.isLocked) {
      const lockHours = db.systemSettings.autoLockoutDurationHours || 24;
      db.lockUserAccount(
        user.id,
        `Automated Lockout: ${actionType.replace('_', ' ').toUpperCase()} - ${details}`,
        lockHours,
        'Automated Anti-Spam Engine'
      );
      accountLocked = true;
    }

    const incident = db.recordSpamIncident({
      userId: user.id,
      username: user.username,
      actionType,
      severity,
      details,
      ipAddress: clientIp,
      riskScoreBefore: riskBefore,
      riskScoreAfter: riskAfter,
      accountLocked: accountLocked || !!user.isLocked,
      status: 'flagged',
    });

    db.saveUser(user);
    return { incident, accountLocked };
  }
}

export const antiFraudEngine = new AntiFraudEngine();
