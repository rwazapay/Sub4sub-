import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/referrals - Get user's referral code and stats
router.get('/', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const userReferrals = db.referrals.filter((r) => r.referrerUserId === user.id);

  return res.json({
    success: true,
    data: {
      referralCode: user.referralCode,
      referralCount: user.referralCount,
      totalRewardsEarned: user.referralRewardsEarned,
      rewardPerReferral: db.systemSettings.referralReward,
      referralsList: userReferrals,
    },
  });
});

// POST /api/referrals/claim - Claim referral bonus with a code
router.post('/claim', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { referralCode } = req.body;

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
      message: 'Invalid referral code.',
      errorCode: 'REFERRAL_NOT_FOUND',
    });
  }

  const reward = db.systemSettings.referralReward; // 100 credits

  user.referredBy = referrer.id;
  
  // Reward Referrer
  referrer.referralCount += 1;
  referrer.referralRewardsEarned += reward;
  db.recordTransaction(
    referrer.id,
    'referral',
    reward,
    `Referral bonus: ${user.displayName} joined SubLoop`
  );

  // Reward Referred User
  db.recordTransaction(
    user.id,
    'referral',
    reward,
    `Welcome referral bonus using code ${cleanCode}`
  );

  const refRecord = {
    id: `ref_${Date.now()}`,
    referrerUserId: referrer.id,
    referredUserId: user.id,
    referredUsername: user.username,
    status: 'completed' as const,
    rewardCredits: reward,
    createdAt: new Date().toISOString(),
  };
  db.referrals.unshift(refRecord);

  // Notify Referrer
  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: referrer.id,
    title: '🎉 New Referral Join!',
    message: `${user.displayName} registered using your link. You earned +${reward} Credits!`,
    type: 'credit',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  return res.json({
    success: true,
    message: `Referral code applied! Both you and @${referrer.username} earned +${reward} Credits 🎉`,
    data: {
      newBalance: user.credits,
    },
  });
});

export default router;
