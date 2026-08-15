import { Router, Response } from 'express';
import { db } from '../db';
import { generateToken, authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

// Helper email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  const { username, displayName, email, password, country, referralCode } = req.body;

  if (!username || !email || !password || !displayName) {
    return res.status(400).json({
      success: false,
      message: 'Username, display name, email, and password are required.',
      errorCode: 'MISSING_FIELDS',
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(cleanEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address.',
      errorCode: 'INVALID_EMAIL',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.',
      errorCode: 'PASSWORD_TOO_SHORT',
    });
  }

  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (cleanUsername.length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Username must be at least 3 alphanumeric characters or underscores.',
      errorCode: 'INVALID_USERNAME',
    });
  }

  // Check duplicate username or email in database
  let existingUser = Array.from(db.users.values()).find(
    (u) => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail
  );

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'Username or email address is already registered.',
      errorCode: 'DUPLICATE_USER',
    });
  }

  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  db.setPasswordHash(userId, password);

  // Check referral code
  let referrer: any = null;
  const cleanRefCode = referralCode ? String(referralCode).trim().toUpperCase() : null;
  if (cleanRefCode) {
    referrer = Array.from(db.users.values()).find((u) => u.referralCode === cleanRefCode);
  }

  const referralBonus = referrer ? (db.systemSettings.referralReward || 100) : 0;
  const initialCredits = 100 + referralBonus;

  const isSuperAdminEmail = cleanEmail === 'xfrancois786@gmail.com';
  const assignedRole = isSuperAdminEmail ? ('admin' as const) : ('user' as const);
  const assignedCredits = isSuperAdminEmail ? 100000 : initialCredits;

  const newUser = {
    id: userId,
    username: cleanUsername,
    displayName: displayName.trim(),
    email: cleanEmail,
    country: country || 'Rwanda',
    role: assignedRole,
    status: 'active' as const,
    avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250`,
    bio: isSuperAdminEmail
      ? 'SubLoop Super Administrator'
      : `Creator from ${country || 'Rwanda'} passionate about growing content and discovering new creators.`,
    creatorCategory: 'Technology',
    credits: assignedCredits,
    totalCreditsEarned: assignedCredits,
    totalCreditsSpent: 0,
    level: isSuperAdminEmail ? 10 : 1,
    reputation: isSuperAdminEmail ? 100 : 80,
    referralCode: `SUB-${cleanUsername.toUpperCase().substring(0, 6)}`,
    referredBy: referrer ? referrer.id : undefined,
    referralCount: 0,
    referralRewardsEarned: 0,
    streakDays: 1,
    dailyRewardClaimedToday: false,
    dailyDiscoveryCountToday: 0,
    riskScore: 0,
    isPro: isSuperAdminEmail,
    isEmailVerified: isSuperAdminEmail ? true : false,
    emailVerifiedAt: isSuperAdminEmail ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
  };

  // Create corresponding Creator Profile
  const creatorProfile = {
    id: `prof_${userId}`,
    userId,
    username: newUser.username,
    displayName: newUser.displayName,
    avatar: newUser.avatar,
    bio: newUser.bio,
    country: newUser.country,
    category: newUser.creatorCategory,
    reputation: newUser.reputation,
    level: newUser.level,
    profileViews: 1,
    totalDiscoveries: 0,
    isPro: newUser.isPro,
    socialChannelsCount: 0,
    createdAt: newUser.createdAt,
  };

  // Save user & creator profile to Firestore
  await db.saveUser(newUser, password);
  await db.saveCreatorProfile(creatorProfile);

  // Record initial registration bonus
  db.recordTransaction(userId, 'bonus', 100, 'Welcome registration bonus');

  // Handle Referrer reward & referral record
  if (referrer) {
    referrer.referralCount = (referrer.referralCount || 0) + 1;
    referrer.referralRewardsEarned = (referrer.referralRewardsEarned || 0) + referralBonus;
    
    db.recordTransaction(
      referrer.id,
      'referral',
      referralBonus,
      `Referral bonus: @${newUser.username} registered with your invite code`
    );

    db.recordTransaction(
      userId,
      'referral',
      referralBonus,
      `Welcome referral bonus using code ${cleanRefCode}`
    );

    const refRecord = {
      id: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      referrerUserId: referrer.id,
      referrerUsername: referrer.username,
      referredUserId: userId,
      referredUsername: newUser.username,
      status: 'completed' as const,
      rewardCredits: referralBonus,
      createdAt: new Date().toISOString(),
    };
    db.referrals.unshift(refRecord);

    db.notifications.unshift({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: referrer.id,
      title: '🎉 New Referral Joined!',
      message: `@${newUser.username} joined SubLoop using your referral link. You received +${referralBonus} Coins!`,
      type: 'credit',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    try {
      await db.saveUser(referrer);
    } catch (saveRefErr) {
      console.warn('Could not persist referrer update to firestore:', saveRefErr);
    }
  }

  const token = generateToken(newUser);

  return res.status(201).json({
    success: true,
    message: 'Welcome to SubLoop! Registration successful (+100 Bonus Credits).',
    data: {
      token,
      user: newUser,
    },
  });
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  const { loginIdentifier, password } = req.body;

  if (!loginIdentifier || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username/email and password are required.',
      errorCode: 'MISSING_FIELDS',
    });
  }

  const cleanIdentifier = loginIdentifier.trim().toLowerCase();
  let user = Array.from(db.users.values()).find(
    (u) => u.username.toLowerCase() === cleanIdentifier || u.email.toLowerCase() === cleanIdentifier
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid username/email or password.',
      errorCode: 'INVALID_CREDENTIALS',
    });
  }

  const isValidPassword = db.verifyPassword(user.id, password);
  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      message: 'Invalid username/email or password.',
      errorCode: 'INVALID_CREDENTIALS',
    });
  }

  if (user.status === 'suspended' || user.status === 'banned') {
    return res.status(403).json({
      success: false,
      message: 'Your account has been suspended or banned.',
      errorCode: 'ACCOUNT_SUSPENDED',
    });
  }

  // Sync daily state & update last login date
  db.syncUserDailyState(user);
  user.lastLoginDate = new Date().toISOString();

  // Save updated user to Firestore
  await db.saveUser(user);

  const token = generateToken(user);

  return res.json({
    success: true,
    message: 'Logged in successfully.',
    data: {
      token,
      user,
    },
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

// POST /api/auth/google
router.post('/google', authLimiter, async (req, res) => {
  const { credential, email, name, picture, googleId } = req.body;

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
      message: 'Google Authentication failed: Email could not be retrieved.',
      errorCode: 'GOOGLE_AUTH_FAILED',
    });
  }

  const cleanEmail = userEmail.trim().toLowerCase();
  let user = Array.from(db.users.values()).find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    // Register new user via Google
    const baseUsername = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '');
    let username = baseUsername.length >= 3 ? baseUsername : `creator_${baseUsername}`;
    let counter = 1;
    while (Array.from(db.users.values()).some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      username = `${baseUsername}${counter++}`;
    }

    const userId = `usr_google_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.setPasswordHash(userId, `google_secret_${Date.now()}`);

    user = {
      id: userId,
      username,
      displayName: userName || baseUsername,
      email: cleanEmail,
      country: 'Rwanda',
      role: 'user',
      status: 'active',
      avatar: userAvatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250`,
      bio: `Verified Google Creator account`,
      creatorCategory: 'Technology',
      credits: 100, // 100 welcome credits
      totalCreditsEarned: 100,
      totalCreditsSpent: 0,
      level: 1,
      reputation: 90,
      referralCode: `SUB-${username.toUpperCase().substring(0, 6)}`,
      referralCount: 0,
      referralRewardsEarned: 0,
      streakDays: 1,
      dailyRewardClaimedToday: false,
      dailyDiscoveryCountToday: 0,
      riskScore: 0,
      isPro: cleanEmail === 'xfrancois786@gmail.com',
      role: cleanEmail === 'xfrancois786@gmail.com' ? 'admin' : 'user',
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

    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      userId,
      title: '🌐 Google Sign-In Connected!',
      message: 'Welcome to SubLoop! Your Google Account is successfully verified and credited with +100 Welcome Credits.',
      type: 'success',
      link: '/dashboard',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  if (user.status === 'suspended' || user.status === 'banned') {
    return res.status(403).json({
      success: false,
      message: 'Your account has been suspended or banned.',
      errorCode: 'ACCOUNT_SUSPENDED',
    });
  }

  if (cleanEmail === 'xfrancois786@gmail.com') {
    user.role = 'admin';
    user.isPro = true;
    user.isEmailVerified = true;
  }

  user.lastLoginDate = new Date().toISOString();
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
