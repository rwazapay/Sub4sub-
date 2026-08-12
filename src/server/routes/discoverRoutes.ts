import { Router, Response } from 'express';
import { db } from '../db';
import { rankPromotions } from '../services/rankingAlgorithm';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/discover - Get discovery feed with ranking algorithm & filters
router.get('/', (req, res) => {
  const { category, platform, country, search, page = '1', limit = '10' } = req.query;

  const allPromotions = Array.from(db.promotions.values());
  const rankedPromotions = rankPromotions(allPromotions, {
    category: category as string,
    platform: platform as string,
    country: country as string,
    search: search as string,
  });

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 10;
  const total = rankedPromotions.length;
  const paginated = rankedPromotions.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return res.json({
    success: true,
    data: {
      promotions: paginated,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

// POST /api/discover/:id/complete - Complete legitimate discovery activity & earn credits
router.post('/:id/complete', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const promotionId = req.params.id;

  const promotion = db.promotions.get(promotionId);
  if (!promotion || promotion.status !== 'active') {
    return res.status(404).json({
      success: false,
      message: 'Active creator promotion not found.',
      errorCode: 'PROMOTION_NOT_FOUND',
    });
  }

  if (promotion.userId === user.id) {
    return res.status(400).json({
      success: false,
      message: 'You cannot earn discovery credits from your own promotion campaign.',
      errorCode: 'SELF_DISCOVERY_NOT_ALLOWED',
    });
  }

  // Check daily limit
  if (user.dailyDiscoveryCountToday >= db.systemSettings.maxDailyDiscoveryRewards) {
    return res.status(429).json({
      success: false,
      message: `Daily discovery rewards limit reached (${db.systemSettings.maxDailyDiscoveryRewards} max/day). Please try again tomorrow!`,
      errorCode: 'DAILY_LIMIT_EXCEEDED',
    });
  }

  // Prevent duplicate completion
  const existingActivity = db.discoveryActivities.find(
    (a) => a.userId === user.id && a.promotionId === promotionId
  );

  if (existingActivity) {
    return res.status(400).json({
      success: false,
      message: 'You have already completed discovery for this creator campaign.',
      errorCode: 'DUPLICATE_DISCOVERY',
    });
  }

  const rewardCredits = promotion.rewardPerDiscovery || 10;

  // Record Discovery Activity
  const activity = {
    id: `disc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    creatorId: promotion.userId,
    promotionId: promotion.id,
    activityType: 'view_creator' as const,
    rewardCredits,
    completedAt: new Date().toISOString(),
  };

  db.discoveryActivities.unshift(activity);

  // Credit the discoverer
  db.recordTransaction(
    user.id,
    'earning',
    rewardCredits,
    `Discovered creator: ${promotion.creatorDisplayName} (${promotion.platform})`,
    promotion.id
  );

  user.dailyDiscoveryCountToday += 1;
  user.reputation = Math.min(100, user.reputation + 1);

  // Update promotion stats & spent budget
  promotion.clicks += 1;
  promotion.uniqueDiscoveries += 1;
  promotion.spentCredits += rewardCredits;

  if (promotion.spentCredits >= promotion.budgetCredits) {
    promotion.status = 'completed';
  }

  // Increment creator total discoveries
  const creatorProf = Array.from(db.creatorProfiles.values()).find((p) => p.userId === promotion.userId);
  if (creatorProf) {
    creatorProf.totalDiscoveries += 1;
  }

  return res.json({
    success: true,
    message: `🎉 Discovery complete! You earned +${rewardCredits} Credits!`,
    data: {
      rewardCredits,
      newBalance: user.credits,
      dailyCountToday: user.dailyDiscoveryCountToday,
    },
  });
});

export default router;
