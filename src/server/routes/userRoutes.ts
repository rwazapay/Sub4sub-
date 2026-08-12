import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/users/creators - Public list of creators
router.get('/creators', (req, res) => {
  const { category, country, search, page = '1', limit = '12' } = req.query;

  let profiles = Array.from(db.creatorProfiles.values());

  if (category && category !== 'All') {
    profiles = profiles.filter((p) => p.category.toLowerCase() === (category as string).toLowerCase());
  }

  if (country && country !== 'All') {
    profiles = profiles.filter((p) => p.country.toLowerCase() === (country as string).toLowerCase());
  }

  if (search) {
    const q = (search as string).toLowerCase();
    profiles = profiles.filter(
      (p) =>
        p.username.toLowerCase().includes(q) ||
        p.displayName.toLowerCase().includes(q) ||
        p.bio.toLowerCase().includes(q)
    );
  }

  // Sort by reputation & views
  profiles.sort((a, b) => b.reputation - a.reputation);

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 12;
  const total = profiles.length;
  const paginated = profiles.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return res.json({
    success: true,
    data: {
      creators: paginated,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

// GET /api/users/:username - Get user/creator profile by username
router.get('/profile/:username', (req, res) => {
  const { username } = req.params;
  const cleanUsername = username.toLowerCase();

  const user = Array.from(db.users.values()).find((u) => u.username.toLowerCase() === cleanUsername);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Creator profile not found.',
      errorCode: 'NOT_FOUND',
    });
  }

  // Increment profile views
  const profile = Array.from(db.creatorProfiles.values()).find((p) => p.userId === user.id);
  if (profile) {
    profile.profileViews += 1;
  }

  // Fetch social channels
  const channels = Array.from(db.socialChannels.values()).filter((ch) => ch.userId === user.id);

  // Fetch active promotions
  const activePromotions = Array.from(db.promotions.values()).filter(
    (p) => p.userId === user.id && p.status === 'active'
  );

  return res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        country: user.country,
        avatar: user.avatar,
        bio: user.bio,
        creatorCategory: user.creatorCategory,
        level: user.level,
        reputation: user.reputation,
        isPro: user.isPro,
        createdAt: user.createdAt,
      },
      profile,
      channels,
      activePromotions,
    },
  });
});

// PUT /api/users/profile - Update user profile
router.put('/profile', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { displayName, bio, country, creatorCategory, avatar } = req.body;

  if (displayName) user.displayName = displayName.trim();
  if (bio) user.bio = bio.trim();
  if (country) user.country = country;
  if (creatorCategory) user.creatorCategory = creatorCategory;
  if (avatar) user.avatar = avatar;

  // Sync with CreatorProfile
  const profile = Array.from(db.creatorProfiles.values()).find((p) => p.userId === user.id);
  if (profile) {
    profile.displayName = user.displayName;
    profile.bio = user.bio;
    profile.country = user.country;
    profile.category = user.creatorCategory;
    profile.avatar = user.avatar;
  }

  return res.json({
    success: true,
    message: 'Profile updated successfully.',
    data: {
      user,
      profile,
    },
  });
});

export default router;
