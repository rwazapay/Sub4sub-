import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
import { campaignRateLimiter } from '../middleware/rateLimit';
import { PlatformType } from '../../types';

const router = Router();

// GET /api/promotions/lookup - Unified search & inspector for campaigns, channels, and promoted videos
router.get('/lookup', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const query = (req.query.q as string || '').trim().toLowerCase();
  const typeFilter = (req.query.type as string || 'all').toLowerCase();
  const platformFilter = (req.query.platform as string || 'all').toLowerCase();

  // Aggregate Channel Campaigns
  const channelList = [
    {
      id: 'ch-1',
      lookupType: 'channel',
      title: 'Mitalda Plays - Gaming Hub',
      channelName: 'Mitalda Plays',
      creatorUsername: 'mitaldaplays',
      creatorAvatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
      avatarOrThumbnail: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
      platform: 'youtube',
      targetUrl: 'https://youtube.com/@mitaldaplays',
      rewardCoins: 50,
      rewardType: 'per_subscriber',
      subscribersRemaining: 6,
      completedCount: 7,
      totalTarget: 13,
      status: 'active',
      isAiVerified: true,
      isSponsored: true,
      createdAt: '2026-08-01T10:00:00Z',
    },
    {
      id: 'ch-2',
      lookupType: 'channel',
      title: 'Nexus Gaming India - Esports',
      channelName: 'Nexus Gaming India',
      creatorUsername: 'nexusgaming',
      creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      avatarOrThumbnail: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      platform: 'youtube',
      targetUrl: 'https://youtube.com/@nexusgaming',
      rewardCoins: 50,
      rewardType: 'per_subscriber',
      subscribersRemaining: 12,
      completedCount: 38,
      totalTarget: 50,
      status: 'active',
      isAiVerified: true,
      isSponsored: false,
      createdAt: '2026-08-02T12:00:00Z',
    },
    {
      id: 'ch-3',
      lookupType: 'channel',
      title: 'Tech Byte Official - Gadget Reviews',
      channelName: 'Tech Byte Official',
      creatorUsername: 'techbyte',
      creatorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      avatarOrThumbnail: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      platform: 'youtube',
      targetUrl: 'https://youtube.com/@techbyte',
      rewardCoins: 50,
      rewardType: 'per_subscriber',
      subscribersRemaining: 20,
      completedCount: 80,
      totalTarget: 100,
      status: 'active',
      isAiVerified: true,
      isSponsored: true,
      createdAt: '2026-08-03T15:00:00Z',
    },
  ];

  // Aggregate Video Campaigns
  const videoList = [
    {
      id: 'vid-1',
      lookupType: 'video',
      title: 'FINALLY 🔥 BGMI 4.5 UPDATE IS HERE , NARUTO X BGMI 🔥 BEST UPDATE?| Mitalda Plays',
      channelName: 'Mitalda Plays',
      creatorUsername: 'mitaldaplays',
      creatorAvatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
      avatarOrThumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      youtubeId: 'dQw4w9WgXcQ',
      platform: 'youtube',
      targetUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      rewardCoins: 10,
      rewardType: 'per_view',
      viewsRemaining: 63,
      completedCount: 6,
      totalTarget: 69,
      watchTimeSeconds: 30,
      status: 'active',
      isAiVerified: true,
      isSponsored: true,
      createdAt: '2026-08-05T14:00:00Z',
    },
    {
      id: 'vid-2',
      lookupType: 'video',
      title: 'Top 10 Secret Tricks in BGMI Custom Rooms 🎮 Pro Gameplay Tips',
      channelName: 'Nexus Gaming India',
      creatorUsername: 'nexusgaming',
      creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      avatarOrThumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
      youtubeId: 'L_LUpnjgPso',
      platform: 'youtube',
      targetUrl: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
      rewardCoins: 10,
      rewardType: 'per_view',
      viewsRemaining: 45,
      completedCount: 15,
      totalTarget: 60,
      watchTimeSeconds: 30,
      status: 'active',
      isAiVerified: true,
      isSponsored: false,
      createdAt: '2026-08-06T18:00:00Z',
    },
    {
      id: 'vid-3',
      lookupType: 'video',
      title: 'How to Grow Fast on YouTube in 2026 📈 Complete Algorithm Secrets',
      channelName: 'Tech Byte Official',
      creatorUsername: 'techbyte',
      creatorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      avatarOrThumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      youtubeId: 'kJQP7kiw5Fk',
      platform: 'youtube',
      targetUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
      rewardCoins: 10,
      rewardType: 'per_view',
      viewsRemaining: 88,
      completedCount: 12,
      totalTarget: 100,
      watchTimeSeconds: 30,
      status: 'active',
      isAiVerified: true,
      isSponsored: true,
      createdAt: '2026-08-07T09:00:00Z',
    },
  ];

  // Aggregate user created promotions in database
  const dbPromotionsList = Array.from(db.promotions.values()).map((p) => ({
    id: p.id,
    lookupType: 'campaign',
    title: p.title,
    channelName: p.creatorDisplayName || p.creatorUsername,
    creatorUsername: p.creatorUsername,
    creatorAvatar: p.creatorAvatar,
    avatarOrThumbnail: p.creatorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    platform: p.platform || 'youtube',
    targetUrl: p.channelUrl,
    rewardCoins: p.rewardPerDiscovery || 25,
    rewardType: 'per_discovery',
    subscribersRemaining: Math.max(0, Math.floor((p.budgetCredits - p.spentCredits) / (p.rewardPerDiscovery || 10))),
    completedCount: p.clicks || 0,
    totalTarget: Math.floor(p.budgetCredits / (p.rewardPerDiscovery || 10)),
    status: p.status,
    isAiVerified: true,
    isSponsored: p.isSponsored,
    createdAt: p.createdAt,
  }));

  // Combine all items
  let allItems = [...channelList, ...videoList, ...dbPromotionsList];

  // Apply Type Filter
  if (typeFilter !== 'all') {
    allItems = allItems.filter((item) => {
      if (typeFilter === 'channel') return item.lookupType === 'channel';
      if (typeFilter === 'video') return item.lookupType === 'video';
      if (typeFilter === 'campaign') return item.lookupType === 'campaign';
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
router.post('/', authenticateJWT, campaignRateLimiter, (req: AuthenticatedRequest, res: Response) => {
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
