import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
import { antiFraudEngine } from '../services/antiFraudEngine';

const router = Router();

// GET /api/referrals/validate/:code - Validate referral code (public or authenticated)
router.get('/validate/:code', (req, res) => {
  const { code } = req.params;
  if (!code) {
    return res.status(400).json({ success: false, message: 'Referral code is required.' });
  }

  const cleanCode = code.trim().toUpperCase();
  const referrer = Array.from(db.users.values()).find((u) => u.referralCode === cleanCode);

  if (!referrer) {
    return res.status(404).json({
      success: false,
      message: 'Referral code does not exist.',
      valid: false,
    });
  }

  return res.json({
    success: true,
    valid: true,
    data: {
      referrerName: referrer.displayName,
      referrerUsername: referrer.username,
      referrerAvatar: referrer.avatar,
      bonusCoins: db.systemSettings.referralReward || 100,
    },
  });
});

// GET /api/referrals - Get user's referral code, link, and history
router.get('/', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  
  // Find all referrals where current user is referrer
  const userReferrals = db.referrals
    .filter((r) => r.referrerUserId === user.id)
    .map((r) => {
      const referredUser = db.users.get(r.referredUserId);
      return {
        id: r.id,
        referredUserId: r.referredUserId,
        referredUsername: r.referredUsername || referredUser?.username || 'Creator',
        referredAvatar: referredUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
        rewardCredits: r.rewardCredits,
        status: r.status,
        createdAt: r.createdAt,
      };
    });

  return res.json({
    success: true,
    data: {
      referralCode: user.referralCode,
      referralCount: user.referralCount || userReferrals.length,
      totalRewardsEarned: user.referralRewardsEarned || (userReferrals.length * (db.systemSettings.referralReward || 100)),
      rewardPerReferral: db.systemSettings.referralReward || 100,
      referredBy: user.referredBy,
      canClaimCode: !user.referredBy,
      referralsList: userReferrals,
    },
  });
});

// POST /api/referrals/claim - Claim referral bonus with a code
router.post('/claim', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { referralCode } = req.body;

  if (db.systemSettings.enableReferralProgram === false) {
    return res.status(403).json({
      success: false,
      message: 'Referral program is temporarily paused for maintenance.',
      errorCode: 'FEATURE_DISABLED',
    });
  }

  if (user.canRefer === false || user.permissionsOverride?.canRefer === false) {
    return res.status(403).json({
      success: false,
      message: 'Referral capabilities have been restricted for your account.',
      errorCode: 'REFERRAL_RESTRICTED',
    });
  }

  if (!referralCode) {
    return res.status(400).json({
      success: false,
      message: 'Referral code is required.',
      errorCode: 'MISSING_CODE',
    });
  }

  const cleanCode = referralCode.trim().toUpperCase();

  if (user.referralCode === cleanCode) {
    return res.status(400).json({
      success: false,
      message: 'You cannot use your own referral code.',
      errorCode: 'SELF_REFERRAL_FORBIDDEN',
    });
  }

  if (user.referredBy) {
    return res.status(400).json({
      success: false,
      message: 'You have already applied a referral code.',
      errorCode: 'REFERRAL_ALREADY_APPLIED',
    });
  }

  const referrer = Array.from(db.users.values()).find((u) => u.referralCode === cleanCode);
  if (!referrer) {
    return res.status(404).json({
      success: false,
      message: 'Invalid referral code. Please double check the code.',
      errorCode: 'REFERRAL_NOT_FOUND',
    });
  }

  // Run Anti-Fraud Sybil and Ring Check
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
  const fraudCheck = antiFraudEngine.auditReferralAttempt(referrer, user, clientIp);
  if (!fraudCheck.allowed) {
    return res.status(422).json({
      success: false,
      message: fraudCheck.reason || 'Referral verification rejected by anti-fraud system.',
      errorCode: 'REFERRAL_FRAUD_FLAGGED',
    });
  }

  const reward = db.systemSettings.referralReward || 100; // 100 credits

  user.referredBy = referrer.id;
  
  // Reward Referrer
  referrer.referralCount = (referrer.referralCount || 0) + 1;
  referrer.referralRewardsEarned = (referrer.referralRewardsEarned || 0) + reward;
  db.recordTransaction(
    referrer.id,
    'referral',
    reward,
    `Referral bonus: ${user.displayName} (@${user.username}) used your code`
  );

  // Reward Referred User
  db.recordTransaction(
    user.id,
    'referral',
    reward,
    `Welcome referral bonus using code ${cleanCode}`
  );

  const refRecord = {
    id: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    referrerUserId: referrer.id,
    referrerUsername: referrer.username,
    referredUserId: user.id,
    referredUsername: user.username,
    status: 'completed' as const,
    rewardCredits: reward,
    createdAt: new Date().toISOString(),
  };
  db.referrals.unshift(refRecord);

  // Notify Referrer
  db.notifications.unshift({
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: referrer.id,
    title: '🎉 New Referral Claimed!',
    message: `${user.displayName} applied your invite code. You earned +${reward} Coins!`,
    type: 'credit',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  try {
    await db.saveUser(user);
    await db.saveUser(referrer);
  } catch (err) {
    console.warn('Firestore persistence warning during referral claim:', err);
  }

  return res.json({
    success: true,
    message: `🎉 Referral code applied! Both you and @${referrer.username} earned +${reward} Coins!`,
    data: {
      newBalance: user.credits,
      referredBy: user.referredBy,
      user,
    },
  });
});

export default router;
