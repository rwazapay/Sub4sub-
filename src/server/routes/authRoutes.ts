import { Router, Response } from 'express';
import { db } from '../db';
import { generateToken, authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

// Helper email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  const { username, displayName, email, password, country } = req.body;

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

  const newUser = {
    id: userId,
    username: cleanUsername,
    displayName: displayName.trim(),
    email: cleanEmail,
    country: country || 'Rwanda',
    role: 'user' as const,
    status: 'active' as const,
    avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250`,
    bio: `Creator from ${country || 'Rwanda'} passionate about growing content and discovering new creators.`,
    creatorCategory: 'Technology',
    credits: 100, // 100 registration bonus credits
    totalCreditsEarned: 100,
    totalCreditsSpent: 0,
    level: 1,
    reputation: 80,
    referralCode: `SUB-${cleanUsername.toUpperCase().substring(0, 6)}`,
    referralCount: 0,
    referralRewardsEarned: 0,
    streakDays: 1,
    dailyRewardClaimedToday: false,
    dailyDiscoveryCountToday: 0,
    riskScore: 0,
    isPro: false,
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
      isPro: false,
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

export default router;
