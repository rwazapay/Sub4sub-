import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
import { campaignRateLimiter } from '../middleware/rateLimit';
import { PlatformType } from '../../types';
import { resolveTargetMetadata, extractYouTubeVideoId } from '../services/youtubeResolver';

const router = Router();

// GET /api/promotions/lookup - Unified search & inspector for campaigns, channels, and promoted videos
router.get('/lookup', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const query = typeof req.query.q === 'string'
    ? req.query.q.trim().toLowerCase()
    : typeof req.query.email === 'string'
    ? req.query.email.trim().toLowerCase()
    : '';
  const typeFilter = typeof req.query.type === 'string' ? req.query.type.toLowerCase() : 'all';
  const platformFilter = typeof req.query.platform === 'string' ? req.query.platform.toLowerCase() : 'all';

  // Aggregate user created and seed promotions dynamically from database
  const dbPromotionsList = Array.from(db.promotions.values()).map((p) => {
    const isVideo = !!p.videoEmbedUrl || (p.channelUrl && extractYouTubeVideoId(p.channelUrl) !== null);
    const ytId = p.channelUrl ? extractYouTubeVideoId(p.channelUrl) : undefined;
    const rewardCoins = isVideo ? 10 : (p.rewardPerDiscovery || 50);
    const totalTarget = Math.max(1, Math.floor(p.budgetCredits / rewardCoins));
    const completedCount = p.clicks || 0;
    const remainingCount = Math.max(0, Math.floor((p.budgetCredits - p.spentCredits) / rewardCoins));

    return {
      id: p.id,
      lookupType: isVideo ? ('video' as const) : ('channel' as const),
      title: p.title,
      channelName: p.creatorDisplayName || p.creatorUsername,
      creatorUsername: p.creatorUsername,
      creatorAvatar: p.creatorAvatar,
      avatarOrThumbnail: p.creatorAvatar || (ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'),
      platform: p.platform || 'YouTube',
      targetUrl: p.channelUrl,
      youtubeId: ytId,
      rewardCoins,
      rewardType: isVideo ? ('per_view' as const) : ('per_subscriber' as const),
      subscribersRemaining: !isVideo ? remainingCount : undefined,
      viewsRemaining: isVideo ? remainingCount : undefined,
      completedCount,
      totalTarget,
      watchTimeSeconds: isVideo ? 30 : undefined,
      status: p.status,
      isAiVerified: true,
      isSponsored: p.isSponsored,
      createdAt: p.createdAt,
    };
  });

  // Combine all items
  let allItems = [...dbPromotionsList];

  // If query is a real YouTube URL/ID/handle not yet in DB, resolve it on the fly!
  if (query && (query.includes('youtube.com') || query.includes('youtu.be') || query.startsWith('@') || /^[a-zA-Z0-9_-]{11}$/.test(query))) {
    try {
      const resolved = await resolveTargetMetadata(query);
      const onTheFlyItem = {
        id: `resolved_${Date.now()}`,
        lookupType: resolved.type === 'video' ? ('video' as const) : ('channel' as const),
        title: resolved.title,
        channelName: resolved.channelName,
        creatorUsername: resolved.channelName.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        creatorAvatar: resolved.thumbnailUrl,
        avatarOrThumbnail: resolved.thumbnailUrl,
        platform: resolved.platform,
        targetUrl: resolved.channelUrl,
        youtubeId: resolved.youtubeId,
        rewardCoins: resolved.type === 'video' ? 10 : 50,
        rewardType: resolved.type === 'video' ? ('per_view' as const) : ('per_subscriber' as const),
        subscribersRemaining: resolved.type === 'channel' ? 25 : undefined,
        viewsRemaining: resolved.type === 'video' ? 50 : undefined,
        completedCount: 5,
        totalTarget: resolved.type === 'video' ? 55 : 30,
        watchTimeSeconds: 30,
        status: 'active' as const,
        isAiVerified: true,
        isSponsored: false,
        createdAt: new Date().toISOString(),
      };
      allItems.unshift(onTheFlyItem);
    } catch {
      // Continue normal filtering
    }
  }

  // Apply Type Filter
  if (typeFilter !== 'all') {
    allItems = allItems.filter((item) => {
      if (typeFilter === 'channel') return item.lookupType === 'channel';
      if (typeFilter === 'video') return item.lookupType === 'video';
      return true;
    });
  }

  // Apply Platform Filter
  if (platformFilter !== 'all') {
    allItems = allItems.filter((item) => item.platform.toLowerCase() === platformFilter);
  }

  // Apply Query Filter (search keywords, URLs, YouTube IDs, handles)
  if (query) {
    allItems = allItems.filter((item) => {
      const matchTitle = item.title?.toLowerCase().includes(query);
      const matchChannel = item.channelName?.toLowerCase().includes(query);
      const matchCreator = item.creatorUsername?.toLowerCase().includes(query);
      const matchUrl = item.targetUrl?.toLowerCase().includes(query);
      const matchYtId = (item as any).youtubeId?.toLowerCase().includes(query);

      return matchTitle || matchChannel || matchCreator || matchUrl || matchYtId;
    });
  }

  return res.json({
    success: true,
    data: {
      totalFound: allItems.length,
      items: allItems,
      query,
      typeFilter,
      platformFilter,
    },
  });
});

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

// POST /api/promotions - Launch new creator promotion (Rate-limited: max 3 per 5 min)
router.post('/', authenticateJWT, campaignRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
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

  // Resolve thumbnail if YouTube
  let promoAvatar = user.avatar;
  let videoEmbed: string | undefined;
  const ytId = extractYouTubeVideoId(channelUrl);
  if (ytId) {
    promoAvatar = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
    videoEmbed = `https://www.youtube.com/embed/${ytId}`;
  }

  const newPromotion = {
    id: promoId,
    userId: user.id,
    creatorUsername: user.username,
    creatorDisplayName: user.displayName,
    creatorAvatar: promoAvatar,
    creatorCategory: user.creatorCategory || 'Technology',
    country: user.country || 'Rwanda',
    platform: platform as PlatformType,
    channelUrl: channelUrl.trim(),
    videoEmbedUrl: videoEmbed,
    title: title.trim(),
    description: description ? description.trim() : `Discover ${user.displayName}'s creator channel on ${platform}.`,
    budgetCredits: budget,
    spentCredits: 0,
    rewardPerDiscovery: ytId ? 10 : 50,
    durationDays: duration,
    status: 'active' as const,
    impressions: 0,
    clicks: 0,
    uniqueDiscoveries: 0,
    isSponsored: !!isSponsored,
    createdAt: new Date().toISOString(),
  };

  await db.savePromotion(newPromotion);

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
