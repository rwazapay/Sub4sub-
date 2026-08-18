import { Router, Response } from 'express';
import { db } from '../db';
import { generateToken, authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

// Helper email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register (Deprecated - Google OAuth Only)
router.post('/register', authLimiter, async (req, res) => {
  return res.status(400).json({
    success: false,
    message: 'Direct email/password registration is disabled. Please authenticate with Google Single Sign-On.',
    errorCode: 'GOOGLE_AUTH_ONLY',
  });
});

// POST /api/auth/login (Deprecated - Google OAuth Only)
router.post('/login', authLimiter, async (req, res) => {
  return res.status(400).json({
    success: false,
    message: 'Direct email/password login is disabled. Please authenticate with Google Single Sign-On.',
    errorCode: 'GOOGLE_AUTH_ONLY',
  });
});

// GET /api/auth/me
router.get('/me', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  db.syncUserDailyState(user);
  return res.json({
    success: true,
    data: {
      user,
    },
  });
});

// POST /api/auth/daily-streak-claim
router.post('/daily-streak-claim', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  try {
    const claimResult = await db.claimDailyRewardAtomic(user);
    return res.json({
      success: true,
      message: claimResult.message,
      data: {
        user: claimResult.user,
        streakBonus: claimResult.rewardAmount,
        streakDays: claimResult.streakDays,
        alreadyClaimed: claimResult.alreadyClaimed,
        nextClaimAvailableAt: claimResult.nextClaimAvailableAt,
        newBalance: claimResult.user.credits,
      },
    });
  } catch (err: any) {
    console.error('Auth daily streak claim error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to claim daily streak bonus.',
      errorCode: 'CLAIM_FAILED',
    });
  }
});

// POST /api/auth/forgot-password (Architecture stub)
router.post('/forgot-password', authLimiter, (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email address is required.',
      errorCode: 'MISSING_EMAIL',
    });
  }

  return res.json({
    success: true,
    message: 'If an account exists for this email, password reset instructions have been sent.',
  });
});

// POST /api/auth/google - Single Source of Truth for Authentication
router.post('/google', authLimiter, async (req, res) => {
  const { credential, email, name, picture, googleId, referralCode } = req.body;

  let userEmail = email;
  let userName = name;
  let userAvatar = picture;
  let userGId = googleId;

  // Decode JWT payload if credential string is provided by Google Identity Services
  if (credential && typeof credential === 'string') {
    try {
      const parts = credential.split('.');
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
        const decoded = JSON.parse(payloadJson);
        if (decoded.email) userEmail = decoded.email;
        if (decoded.name) userName = decoded.name;
        if (decoded.picture) userAvatar = decoded.picture;
        if (decoded.sub) userGId = decoded.sub;
      }
    } catch (err) {
      console.warn('Failed to parse Google JWT credential payload:', err);
    }
  }

  if (!userEmail) {
    return res.status(400).json({
      success: false,
      message: 'Google Authentication failed: Verified email could not be retrieved from Google.',
      errorCode: 'GOOGLE_AUTH_FAILED',
    });
  }

  const cleanEmail = userEmail.trim().toLowerCase();
  const isSuperAdminEmail = cleanEmail === 'xfrancois786@gmail.com';
  let user = Array.from(db.users.values()).find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    // Check if new registration is disabled in platform settings
    if (!db.systemSettings.enableRegistration && !isSuperAdminEmail) {
      return res.status(403).json({
        success: false,
        message: 'New user registrations are temporarily closed by platform administrators.',
        errorCode: 'REGISTRATION_DISABLED',
      });
    }

    // Register new user via Google Identity
    const baseUsername = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '');
    let username = baseUsername.length >= 3 ? baseUsername : `creator_${baseUsername}`;
    let counter = 1;
    while (Array.from(db.users.values()).some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      username = `${baseUsername}${counter++}`;
    }

    const userId = userGId ? `usr_${userGId}` : `usr_g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.setPasswordHash(userId, `google_oauth_verified_${Date.now()}`);

    // Check referral code
    let referrer: any = null;
    const cleanRefCode = referralCode ? String(referralCode).trim().toUpperCase() : null;
    if (cleanRefCode) {
      referrer = Array.from(db.users.values()).find((u) => u.referralCode === cleanRefCode);
    }

    const referralBonus = referrer ? (db.systemSettings.referralReward || 100) : 0;
    const initialCredits = isSuperAdminEmail ? 100000 : (100 + referralBonus);

    user = {
      id: userId,
      username,
      displayName: userName || baseUsername,
      email: cleanEmail,
      country: 'Rwanda',
      role: isSuperAdminEmail ? ('admin' as const) : ('user' as const),
      status: 'active',
      avatar: userAvatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250`,
      bio: isSuperAdminEmail ? 'SubLoop Platform Super Administrator' : `Verified Creator on SubLoop`,
      creatorCategory: 'Technology',
      credits: initialCredits,
      totalCreditsEarned: initialCredits,
      totalCreditsSpent: 0,
      level: isSuperAdminEmail ? 10 : 1,
      reputation: isSuperAdminEmail ? 100 : 90,
      referralCode: `SUB-${username.toUpperCase().substring(0, 6)}`,
      referredBy: referrer ? referrer.id : undefined,
      referralCount: 0,
      referralRewardsEarned: 0,
      streakDays: 1,
      dailyRewardClaimedToday: false,
      dailyDiscoveryCountToday: 0,
      riskScore: 0,
      isPro: isSuperAdminEmail,
      isEmailVerified: true,
      emailVerifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const creatorProfile = {
      id: `prof_${userId}`,
      userId,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      country: user.country,
      category: user.creatorCategory,
      reputation: user.reputation,
      level: user.level,
      profileViews: 1,
      totalDiscoveries: 0,
      isPro: user.isPro,
      socialChannelsCount: 0,
      createdAt: user.createdAt,
    };

    await db.saveUser(user);
    await db.saveCreatorProfile(creatorProfile);
    db.recordTransaction(userId, 'bonus', 100, 'Welcome Google Account Registration Bonus');

    if (referrer) {
      referrer.referralCount = (referrer.referralCount || 0) + 1;
      referrer.referralRewardsEarned = (referrer.referralRewardsEarned || 0) + referralBonus;
      db.recordTransaction(
        referrer.id,
        'referral',
        referralBonus,
        `Referral bonus: @${user.username} registered with your Google invite link`
      );
      await db.saveUser(referrer);
    }

    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      userId,
      title: '🌐 Google Verified Account Created!',
      message: 'Welcome to SubLoop! Your Google Account is securely connected and credited with +100 Welcome Coins.',
      type: 'success',
      link: '/dashboard',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  if (user.status === 'suspended' || user.status === 'banned') {
    return res.status(403).json({
      success: false,
      message: 'Your account has been suspended or banned by platform administrators.',
      errorCode: 'ACCOUNT_SUSPENDED',
    });
  }

  if (isSuperAdminEmail) {
    user.role = 'admin';
    user.isPro = true;
    user.isEmailVerified = true;
    if (user.credits < 50000) {
      user.credits = 100000;
      user.totalCreditsEarned = Math.max(user.totalCreditsEarned, 100000);
    }
  }

  user.lastLoginDate = new Date().toISOString();
  db.syncUserDailyState(user);
  await db.saveUser(user);
  const token = generateToken(user);

  return res.json({
    success: true,
    message: 'Google Sign-In successful!',
    data: {
      token,
      user,
    },
  });
});

// POST /api/auth/send-verification - Send 6-digit email verification code
router.post('/send-verification', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  try {
    const { code, expiresAt } = db.generateEmailVerificationCode(user.id);
    return res.json({
      success: true,
      message: `Verification code sent to ${user.email}. Code expires in 15 minutes.`,
      data: {
        email: user.email,
        expiresAt,
        // In local/sandbox environment, return previewCode for rapid testing
        previewCode: code,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to generate verification code.',
      errorCode: 'VERIFICATION_SEND_FAILED',
    });
  }
});

// POST /api/auth/verify-email - Verify submitted 6-digit code or bypass token
router.post('/verify-email', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Please provide a 6-digit verification code.',
      errorCode: 'MISSING_CODE',
    });
  }

  try {
    const result = await db.verifyUserEmail(user.id, code);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        errorCode: 'INVALID_CODE',
      });
    }

    return res.json({
      success: true,
      message: result.message,
      data: {
        user: result.user,
        bonusCoins: 50,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Email verification failed.',
      errorCode: 'VERIFICATION_FAILED',
    });
  }
});

// POST /api/auth/verify-firebase-token - Sync Firebase Auth email verification
router.post('/verify-firebase-token', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { firebaseUid, emailVerified } = req.body;

  if (emailVerified || user.email?.toLowerCase() === 'xfrancois786@gmail.com') {
    const result = await db.verifyUserEmail(user.id, 'firebase_verified_' + (firebaseUid || user.id));
    return res.json({
      success: true,
      message: 'Firebase email verification synchronized successfully!',
      data: {
        user: result.user || user,
      },
    });
  }

  return res.json({
    success: false,
    message: 'Email is not marked as verified in Firebase Auth.',
    data: { user },
  });
});

export default router;
