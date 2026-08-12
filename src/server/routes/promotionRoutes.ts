import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
import { PlatformType } from '../../types';

const router = Router();

// GET /api/promotions - List user's active/past promotions
router.get('/', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const userPromotions = Array.from(db.promotions.values()).filter((p) => p.userId === user.id);

  return res.json({
    success: true,
    data: {
      promotions: userPromotions,
    },
  });
});

// GET /api/promotions/:id - Get specific promotion analytics
router.get('/:id', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const promotion = db.promotions.get(id);

  if (!promotion) {
    return res.status(404).json({
      success: false,
      message: 'Promotion campaign not found.',
      errorCode: 'NOT_FOUND',
    });
  }

  // Calculate CTR and remaining budget
  const ctr = promotion.impressions > 0 ? ((promotion.clicks / promotion.impressions) * 100).toFixed(1) : '0.0';
  const remainingCredits = Math.max(0, promotion.budgetCredits - promotion.spentCredits);

  // Generate analytics timeline data
  const days = promotion.durationDays || 7;
  const dailyAnalytics = Array.from({ length: days }).map((_, i) => ({
    day: `Day ${i + 1}`,
    impressions: Math.floor((promotion.impressions / days) * (0.8 + Math.random() * 0.4)),
    clicks: Math.floor((promotion.clicks / days) * (0.8 + Math.random() * 0.4)),
    creditsSpent: Math.floor((promotion.spentCredits / days) * (0.8 + Math.random() * 0.4)),
  }));

  return res.json({
    success: true,
    data: {
      promotion,
      analytics: {
        ctr: `${ctr}%`,
        remainingCredits,
        dailyAnalytics,
      },
    },
  });
});

// POST /api/promotions - Launch new creator promotion
router.post('/', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { title, description, platform, channelUrl, budgetCredits, durationDays, isSponsored } = req.body;

  if (!title || !platform || !channelUrl || !budgetCredits) {
    return res.status(400).json({
      success: false,
      message: 'Title, platform, channel URL, and budget credits are required.',
      errorCode: 'MISSING_FIELDS',
    });
  }

  const budget = parseInt(budgetCredits, 10);
  if (isNaN(budget) || budget < 50) {
    return res.status(400).json({
      success: false,
      message: 'Minimum promotion budget is 50 Credits.',
      errorCode: 'INVALID_BUDGET',
    });
  }

  if (user.credits < budget) {
    return res.status(402).json({
      success: false,
      message: `Insufficient credit balance. You have ${user.credits} Credits, but this promotion requires ${budget} Credits.`,
      errorCode: 'INSUFFICIENT_CREDITS',
    });
  }

  // Deduct budget immediately
  db.recordTransaction(
    user.id,
    'promotion_spend',
    -budget,
    `Launched promotion: "${title.trim()}" (${platform})`
  );

  const promoId = `prom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const duration = parseInt(durationDays, 10) || 7;

  const newPromotion = {
    id: promoId,
    userId: user.id,
    creatorUsername: user.username,
    creatorDisplayName: user.displayName,
    creatorAvatar: user.avatar,
    creatorCategory: user.creatorCategory || 'Technology',
    country: user.country || 'Rwanda',
    platform: platform as PlatformType,
    channelUrl: channelUrl.trim(),
    title: title.trim(),
    description: description ? description.trim() : `Discover ${user.displayName}'s creator channel on ${platform}.`,
    budgetCredits: budget,
    spentCredits: 0,
    rewardPerDiscovery: 10,
    durationDays: duration,
    status: 'active' as const,
    impressions: 0,
    clicks: 0,
    uniqueDiscoveries: 0,
    isSponsored: !!isSponsored,
    createdAt: new Date().toISOString(),
  };

  db.promotions.set(promoId, newPromotion);

  // Send notification to user
  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: user.id,
    title: '🚀 Promotion Campaign Launched!',
    message: `Your campaign "${newPromotion.title}" is live on the SubLoop discovery feed.`,
    type: 'promotion',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  return res.status(201).json({
    success: true,
    message: 'Promotion launched successfully! Your creator profile is now live on the SubLoop discovery network 🚀',
    data: {
      promotion: newPromotion,
      remainingBalance: user.credits,
    },
  });
});

// PUT /api/promotions/:id/status - Pause, resume, or cancel promotion
router.put('/:id/status', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const { action } = req.body; // 'pause' | 'resume' | 'cancel'

  const promotion = db.promotions.get(id);
  if (!promotion || (promotion.userId !== user.id && user.role !== 'admin')) {
    return res.status(404).json({
      success: false,
      message: 'Promotion not found or unauthorized.',
      errorCode: 'NOT_FOUND',
    });
  }

  if (action === 'pause') {
    promotion.status = 'paused';
  } else if (action === 'resume') {
    if (promotion.spentCredits >= promotion.budgetCredits) {
      return res.status(400).json({
        success: false,
        message: 'Cannot resume a campaign that has exhausted its credit budget.',
        errorCode: 'BUDGET_EXHAUSTED',
      });
    }
    promotion.status = 'active';
  } else if (action === 'cancel') {
    promotion.status = 'cancelled';
    const unspentRefund = Math.max(0, promotion.budgetCredits - promotion.spentCredits);
    if (unspentRefund > 0) {
      db.recordTransaction(
        promotion.userId,
        'refund',
        unspentRefund,
        `Refund for cancelled promotion: "${promotion.title}"`
      );
    }
  }

  return res.json({
    success: true,
    message: `Promotion status updated to ${promotion.status}.`,
    data: {
      promotion,
    },
  });
});

// DELETE /api/promotions/:id - Delete promotion
router.delete('/:id', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;

  const promotion = db.promotions.get(id);
  if (!promotion || (promotion.userId !== user.id && user.role !== 'admin')) {
    return res.status(404).json({
      success: false,
      message: 'Promotion not found or unauthorized.',
      errorCode: 'NOT_FOUND',
    });
  }

  if (promotion.status === 'active') {
    const unspentRefund = Math.max(0, promotion.budgetCredits - promotion.spentCredits);
    if (unspentRefund > 0) {
      db.recordTransaction(
        promotion.userId,
        'refund',
        unspentRefund,
        `Refund for deleted promotion: "${promotion.title}"`
      );
    }
  }

  db.promotions.delete(id);

  return res.json({
    success: true,
    message: 'Promotion campaign deleted.',
  });
});

export default router;
