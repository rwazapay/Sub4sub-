import { db } from '../db';

export interface TaskChallengeSession {
  verificationToken: string;
  userId: string;
  targetUserId?: string;
  promotionId?: string;
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
    userAgent: string = ''
  ): { verificationToken: string; challengeCode: number; minWaitSeconds: number } {
    const verificationToken = `vtok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const challengeCode = Math.floor(1000 + Math.random() * 9000);
    const minWaitSeconds = 8; // Required 8-second verification window

    const session: TaskChallengeSession = {
      verificationToken,
      userId,
      targetUserId,
      promotionId,
      platform,
      channelUrl,
      challengeCode,
      issuedAt: Date.now(),
      minSecondsRequired: minWaitSeconds,
      clientIpHash: clientIp,
      userAgent,
      status: 'pending',
    };

    this.activeSessions.set(verificationToken, session);
    return { verificationToken, challengeCode, minWaitSeconds };
  }

  /**
   * 2. Core Verification & Anti-Fraud Algorithm
   */
  public verifyAndClaim(
    userId: string,
    verificationToken: string,
    providedChallengeCode: number
  ): {
    passed: boolean;
    errorCode?: string;
    message: string;
    riskScore: number;
    auditDetails?: any;
    targetUserId?: string;
    promotionId?: string;
  } {
    const user = db.users.get(userId);
    if (!user) {
      return { passed: false, errorCode: 'USER_NOT_FOUND', message: 'User account not found.', riskScore: 100 };
    }

    const session = this.activeSessions.get(verificationToken);
    if (!session) {
      return {
        passed: false,
        errorCode: 'INVALID_TOKEN',
        message: 'Invalid or expired task verification token. Please start task challenge again.',
        riskScore: user.riskScore + 10,
      };
    }

    if (session.userId !== userId) {
      this.flagFraud(user.id, 'IDENTITY_MISMATCH', 'Verification token ownership mismatch.');
      return {
        passed: false,
        errorCode: 'TOKEN_OWNERSHIP_MISMATCH',
        message: 'Anti-cheat alert: Token ownership mismatch.',
        riskScore: user.riskScore + 30,
      };
    }

    if (session.status !== 'pending') {
      return {
        passed: false,
        errorCode: 'REPLAY_ATTEMPT',
        message: 'Task verification token already claimed (replay attack prevented).',
        riskScore: user.riskScore + 15,
      };
    }

    const now = Date.now();
    const actualElapsedMs = now - session.issuedAt;
    const actualElapsedSeconds = actualElapsedMs / 1000;

    // Check 1: Expiration check (5 minutes max window)
    if (actualElapsedSeconds > 300) {
      session.status = 'expired';
      return {
        passed: false,
        errorCode: 'TOKEN_EXPIRED',
        message: 'Verification challenge expired. Tasks must be claimed within 5 minutes.',
        riskScore: user.riskScore,
      };
    }

    // Check 2: Minimum Stay Verification (Rapid-Click Fraud Check)
    if (actualElapsedSeconds < session.minSecondsRequired) {
      session.status = 'failed';
      user.riskScore = Math.min(100, user.riskScore + 20);

      this.flagFraud(
        user.id,
        'RAPID_CLICK_FRAUD',
        `Attempted claim in ${actualElapsedSeconds.toFixed(1)}s (minimum required ${session.minSecondsRequired}s).`
      );

      return {
        passed: false,
        errorCode: 'RAPID_CLICK_FRAUD',
        message: `Anti-Fraud Check Failed: Claim attempted too quickly (${actualElapsedSeconds.toFixed(1)}s)! Minimum stay of ${session.minSecondsRequired}s required on channel.`,
        riskScore: user.riskScore,
      };
    }

    // Check 3: Challenge Code Security Check
    if (providedChallengeCode !== session.challengeCode) {
      session.status = 'failed';
      user.riskScore = Math.min(100, user.riskScore + 15);
      return {
        passed: false,
        errorCode: 'CHALLENGE_CODE_MISMATCH',
        message: 'Anti-cheat security code mismatch.',
        riskScore: user.riskScore,
      };
    }

    // Check 4: Rolling Velocity Rate Check (Bot/Macro Protection)
    const timestamps = this.userClaimTimestamps.get(userId) || [];
    const recentClaims = timestamps.filter((t) => now - t < 60000); // Claims in last 60s
    if (recentClaims.length >= 5) {
      user.riskScore = Math.min(100, user.riskScore + 25);

      this.flagFraud(
        user.id,
        'SUSPICIOUS_VELOCITY',
        `Exceeded maximum task velocity limit (${recentClaims.length + 1} tasks in 60s).`
      );

      return {
        passed: false,
        errorCode: 'HIGH_VELOCITY_LIMIT',
        message: 'Anti-Fraud Limit Triggered: Exceeded maximum allowed task velocity. Please wait 1 minute.',
        riskScore: user.riskScore,
      };
    }

    // Check 5: Overall User Risk Score Gate
    if (user.riskScore > 60) {
      return {
        passed: false,
        errorCode: 'HIGH_RISK_SUSPENDED',
        message: 'Task Blocked: Your account has high fraud risk flags. Please contact support.',
        riskScore: user.riskScore,
      };
    }

    // All Anti-Fraud Audits Passed!
    session.status = 'verified';
    recentClaims.push(now);
    this.userClaimTimestamps.set(userId, recentClaims);

    // Reward clean behavior by reducing risk score
    user.riskScore = Math.max(0, user.riskScore - 1);

    return {
      passed: true,
      message: 'Anti-Fraud Verification Passed! Task authenticated cleanly.',
      riskScore: user.riskScore,
      targetUserId: session.targetUserId,
      promotionId: session.promotionId,
      auditDetails: {
        verificationToken,
        elapsedSeconds: actualElapsedSeconds.toFixed(1),
        ipHash: session.clientIpHash,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private flagFraud(userId: string, reason: string, details: string) {
    db.reports.push({
      id: `fraud_${Date.now()}`,
      reporterUserId: 'system_anti_cheat',
      reporterUsername: 'AntiCheatEngine',
      targetType: 'creator',
      targetId: userId,
      reason: `[ANTI-FRAUD ALERT] ${reason}: ${details}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    db.notifications.unshift({
      id: `notif_fraud_${Date.now()}`,
      userId,
      title: '⚠️ Anti-Cheat Warning',
      message: `Your task claim was flagged: ${details} Rapid automated clicks harm community trust.`,
      type: 'warning',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }
}

export const antiFraudEngine = new AntiFraudEngine();
