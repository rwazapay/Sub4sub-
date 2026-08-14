import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
import { antiFraudEngine } from '../services/antiFraudEngine';
import { rateLimiterService } from '../services/rateLimiterService';
import {
  campaignRateLimiter,
  exchangeActionRateLimiter,
  watchActionRateLimiter,
  challengeStartRateLimiter,
} from '../middleware/rateLimit';
import { Sub4SubRequest, PlatformType } from '../../types';

const router = Router();

// POST /api/sub4sub/claim-daily-bonus - Claim daily login bonus
router.post('/claim-daily-bonus', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;

  if (user.dailyRewardClaimedToday) {
    return res.status(400).json({
      success: false,
      message: 'Daily login bonus already claimed today! Come back tomorrow for more coins.',
      errorCode: 'DAILY_BONUS_ALREADY_CLAIMED',
    });
  }

  const bonusCoins = 25;
  user.dailyRewardClaimedToday = true;
  user.streakDays = (user.streakDays || 0) + 1;

  db.recordTransaction(
    user.id,
    'bonus',
    bonusCoins,
    `Daily Login Bonus (Day ${user.streakDays} Streak)`
  );

  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: user.id,
    title: '🎁 Daily Bonus Claimed!',
    message: `You earned +${bonusCoins} coins for logging in today! Streak: ${user.streakDays} days.`,
    type: 'credit',
    link: '/wallet',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  return res.json({
    success: true,
    message: `🎉 Claimed +${bonusCoins} coins daily bonus!`,
    data: {
      bonusCoins,
      newBalance: user.credits,
      streakDays: user.streakDays,
      dailyRewardClaimedToday: true,
    },
  });
});

// POST /api/sub4sub/watch-video - Verify watched video and credit coins (Rate-limited)
router.post('/watch-video', authenticateJWT, watchActionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { videoId, watchDurationSeconds } = req.body;

  const duration = parseInt(watchDurationSeconds, 10) || 10;
  if (duration < 5) {
    return res.status(400).json({
      success: false,
      message: 'Video must be watched for at least 5 seconds to earn coins.',
      errorCode: 'WATCH_TIME_TOO_SHORT',
    });
  }

  const rewardCoins = 10;
  db.recordTransaction(
    user.id,
    'earning',
    rewardCoins,
    `Watched YouTube Video (${duration}s view duration)`
  );

  let remainingViews: number | undefined;
  if (videoId) {
    const promo = db.promotions.get(videoId);
    if (promo) {
      promo.impressions = (promo.impressions || 0) + 1;
      promo.clicks = (promo.clicks || 0) + 1;
      promo.spentCredits = (promo.spentCredits || 0) + rewardCoins;
      if (promo.spentCredits >= promo.budgetCredits) {
        promo.status = 'completed';
      }
      await db.savePromotion(promo);
      remainingViews = Math.max(0, Math.floor((promo.budgetCredits - promo.spentCredits) / 10));
    }
  }

  return res.json({
    success: true,
    message: `🎉 Video view verified! +${rewardCoins} coins added to your wallet.`,
    data: {
      rewardCoins,
      newBalance: user.credits,
      remainingViews,
    },
  });
});

// POST /api/sub4sub/watch-complete - Record watch completion & credit coins (Rate-limited)
router.post('/watch-complete', authenticateJWT, watchActionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { videoId } = req.body;

  const rewardCoins = 10;
  db.recordTransaction(
    user.id,
    'earning',
    rewardCoins,
    `Watched YouTube Video (Campaign: ${videoId || 'active'})`
  );

  let remainingViews: number | undefined;
  if (videoId) {
    const promo = db.promotions.get(videoId);
    if (promo) {
      promo.impressions = (promo.impressions || 0) + 1;
      promo.clicks = (promo.clicks || 0) + 1;
      promo.spentCredits = (promo.spentCredits || 0) + rewardCoins;
      if (promo.spentCredits >= promo.budgetCredits) {
        promo.status = 'completed';
      }
      await db.savePromotion(promo);
      remainingViews = Math.max(0, Math.floor((promo.budgetCredits - promo.spentCredits) / 10));
    }
  }

  return res.json({
    success: true,
    message: `🎉 Video view verified! +${rewardCoins} coins added to your wallet.`,
    data: {
      rewardCoins,
      newBalance: user.credits,
      remainingViews,
    },
  });
});

// POST /api/sub4sub/buy-combo - Buy combo pack offer (Rate-limited)
router.post('/buy-combo', authenticateJWT, campaignRateLimiter, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { offerId, priceInr, priceUsd, subscribersCount, viewsCount, channelUrl, videoUrl } = req.body;

  if (!channelUrl) {
    return res.status(400).json({
      success: false,
      message: 'YouTube Channel URL is required to launch combo campaign.',
      errorCode: 'MISSING_CHANNEL_URL',
    });
  }

  const subs = parseInt(subscribersCount, 10) || 13;
  const views = parseInt(viewsCount, 10) || 69;
  const totalCoinsNeeded = subs * 50 + views * 10;

  // Simulate instant payment fulfillment & launch campaigns
  db.recordTransaction(
    user.id,
    'purchase',
    totalCoinsNeeded,
    `Purchased Combo Pack Offer (${subs} Subs + ${views} Views)`
  );

  // Launch Subscriber Campaign
  const subPromoId = `promo_sub_${Date.now()}`;
  db.promotions.set(subPromoId, {
    id: subPromoId,
    userId: user.id,
    creatorUsername: user.username,
    creatorDisplayName: user.displayName,
    creatorAvatar: user.avatar,
    creatorCategory: user.creatorCategory || 'Gaming',
    country: user.country || 'India',
    platform: 'YouTube' as PlatformType,
    channelUrl: channelUrl.trim(),
    title: `${user.displayName} YouTube Channel`,
    description: `Subscribe to ${user.displayName}'s official YouTube channel`,
    budgetCredits: subs * 50,
    spentCredits: 0,
    rewardPerDiscovery: 50,
    durationDays: 30,
    status: 'active' as const,
    impressions: 0,
    clicks: 0,
    uniqueDiscoveries: 0,
    isSponsored: true,
    createdAt: new Date().toISOString(),
  });

  // Launch View Campaign
  if (videoUrl) {
    const viewPromoId = `promo_view_${Date.now()}`;
    db.promotions.set(viewPromoId, {
      id: viewPromoId,
      userId: user.id,
      creatorUsername: user.username,
      creatorDisplayName: user.displayName,
      creatorAvatar: user.avatar,
      creatorCategory: user.creatorCategory || 'Gaming',
      country: user.country || 'India',
      platform: 'YouTube' as PlatformType,
      channelUrl: videoUrl.trim(),
      title: `${user.displayName} Video Campaign`,
      description: `Watch ${user.displayName}'s video to earn 10 coins`,
      budgetCredits: views * 10,
      spentCredits: 0,
      rewardPerDiscovery: 10,
      durationDays: 30,
      status: 'active' as const,
      impressions: 0,
      clicks: 0,
      uniqueDiscoveries: 0,
      isSponsored: true,
      createdAt: new Date().toISOString(),
    });
  }

  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: user.id,
    title: '🚀 Combo Pack Activated!',
    message: `Your combo campaign (${subs} Subscribers + ${views} Views) is live!`,
    type: 'promotion',
    link: '/campaigns',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  return res.json({
    success: true,
    message: `🚀 Combo Pack Offer activated successfully! Both campaigns are now live.`,
    data: {
      newBalance: user.credits,
      subscribersCount: subs,
      viewsCount: views,
    },
  });
});

// POST /api/sub4sub/start-challenge - Issue anti-cheat verification token & countdown timer (Rate-limited)
router.post('/start-challenge', authenticateJWT, challengeStartRateLimiter, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { targetUserId, promotionId, platform, channelUrl } = req.body;

  const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || '';

  const challenge = antiFraudEngine.startChallenge(
    user.id,
    targetUserId,
    promotionId,
    platform,
    channelUrl,
    clientIp,
    userAgent
  );

  return res.json({
    success: true,
    data: {
      verificationToken: challenge.verificationToken,
      challengeCode: challenge.challengeCode,
      minWaitSeconds: challenge.minWaitSeconds,
      userRiskScore: user.riskScore,
    },
    message: `Anti-cheat challenge initialized. Minimum ${challenge.minWaitSeconds}s verification window required.`,
  });
});

// POST /api/sub4sub/verify-claim - Execute anti-fraud algorithm and credit user (Rate-limited)
router.post('/verify-claim', authenticateJWT, exchangeActionRateLimiter, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { verificationToken, challengeCode, targetUserId, platform, channelUrl } = req.body;

  if (!verificationToken || !challengeCode) {
    return res.status(400).json({
      success: false,
      message: 'Verification token and challenge code are required for anti-fraud validation.',
      errorCode: 'MISSING_VERIFICATION_PARAMS',
    });
  }

  // Run Anti-Fraud Algorithm
  const auditResult = antiFraudEngine.verifyAndClaim(user.id, verificationToken, Number(challengeCode));

  if (!auditResult.passed) {
    return res.status(422).json({
      success: false,
      message: auditResult.message,
      errorCode: auditResult.errorCode,
      riskScore: auditResult.riskScore,
    });
  }

  // Anti-Fraud Checks Passed! Proceed to credit user
  const effectiveTargetUserId = auditResult.targetUserId || targetUserId;
  const targetUser = effectiveTargetUserId ? db.users.get(effectiveTargetUserId) : null;

  const rewardCredits = 25; // Clean task completion reward

  db.recordTransaction(
    user.id,
    'earning',
    rewardCredits,
    `Verified Sub4Sub Task Reward (${platform || 'Social'})`
  );

  // If target user present, create or update Sub4Sub relationship
  if (targetUser && targetUser.id !== user.id) {
    const existingReq = Array.from(db.sub4subRequests.values()).find(
      (r) => r.followerUserId === user.id && r.targetUserId === targetUser.id
    );

    if (!existingReq) {
      const requestId = `sub4sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const myChannels = Array.from(db.socialChannels.values()).filter((c) => c.userId === user.id);
      const myPlatform = myChannels[0]?.platform || 'YouTube';
      const myUrl = myChannels[0]?.url || `https://youtube.com/@${user.username}`;

      const newRequest: Sub4SubRequest = {
        id: requestId,
        followerUserId: user.id,
        followerUsername: user.username,
        followerDisplayName: user.displayName,
        followerAvatar: user.avatar,
        followerPlatform: myPlatform,
        followerChannelUrl: myUrl,
        targetUserId: targetUser.id,
        targetUsername: targetUser.username,
        targetDisplayName: targetUser.displayName,
        targetAvatar: targetUser.avatar,
        targetPlatform: platform || 'YouTube',
        targetChannelUrl: channelUrl || `https://youtube.com/@${targetUser.username}`,
        status: 'pending',
        rewardCredits,
        createdAt: new Date().toISOString(),
      };
      db.sub4subRequests.set(requestId, newRequest);

      // Notify target creator
      db.notifications.unshift({
        id: `notif_${Date.now()}`,
        userId: targetUser.id,
        title: '🔔 New Anti-Fraud Verified Subscriber!',
        message: `@${user.username} subscribed to your channel! Click to Sub Back and receive bonus credits.`,
        type: 'promotion',
        link: '/earn',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Notify current user
  db.notifications.unshift({
    id: `notif_${Date.now()}_reward`,
    userId: user.id,
    title: '🛡️ Task Anti-Cheat Verified!',
    message: `Anti-fraud algorithm verified your task completion. +${rewardCredits} Credits credited to your wallet!`,
    type: 'credit',
    link: '/wallet',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  return res.json({
    success: true,
    message: `🛡️ Anti-Fraud Audit Passed! +${rewardCredits} Credits credited to your account.`,
    data: {
      rewardCredits,
      newBalance: user.credits,
      riskScore: user.riskScore,
      auditDetails: auditResult.auditDetails,
    },
  });
});

// GET /api/sub4sub/feed - List creators available for Sub4Sub / Follow4Follow
router.get('/feed', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { platform, search, page = '1', limit = '12' } = req.query;

  // All creator users except current user
  let creators = Array.from(db.users.values()).filter(
    (u) => u.id !== user.id && u.status === 'active'
  );

  if (search) {
    const q = (search as string).toLowerCase();
    creators = creators.filter(
      (c) =>
        c.username.toLowerCase().includes(q) ||
        c.displayName.toLowerCase().includes(q) ||
        c.creatorCategory.toLowerCase().includes(q)
    );
  }

  // Get current user's sub4sub requests
  const userSub4SubList = Array.from(db.sub4subRequests.values());

  const enrichedCreators = creators.map((creator) => {
    // Find channel for platform if specified or first verified channel
    const channels = Array.from(db.socialChannels.values()).filter((ch) => ch.userId === creator.id);
    let primaryChannel = channels.find((ch) => !platform || platform === 'All' || ch.platform === platform);
    if (!primaryChannel && channels.length > 0) primaryChannel = channels[0];

    // Check relationship
    const mySubToCreator = userSub4SubList.find(
      (r) => r.followerUserId === user.id && r.targetUserId === creator.id
    );
    const creatorSubToMe = userSub4SubList.find(
      (r) => r.followerUserId === creator.id && r.targetUserId === user.id
    );

    let sub4subState: 'none' | 'pending_their_sub_back' | 'needs_my_sub_back' | 'mutual' = 'none';
    if (mySubToCreator?.status === 'mutual' || creatorSubToMe?.status === 'mutual') {
      sub4subState = 'mutual';
    } else if (mySubToCreator?.status === 'pending') {
      sub4subState = 'pending_their_sub_back';
    } else if (creatorSubToMe?.status === 'pending') {
      sub4subState = 'needs_my_sub_back';
    }

    return {
      id: creator.id,
      username: creator.username,
      displayName: creator.displayName,
      avatar: creator.avatar,
      bio: creator.bio,
      country: creator.country,
      creatorCategory: creator.creatorCategory,
      reputation: creator.reputation,
      level: creator.level,
      isPro: creator.isPro,
      primaryChannel: primaryChannel || {
        platform: 'YouTube' as PlatformType,
        channelName: `${creator.displayName} Channel`,
        url: `https://youtube.com/@${creator.username}`,
      },
      channels,
      sub4subState,
      requestId: mySubToCreator?.id || creatorSubToMe?.id,
    };
  });

  // Filter out if specific platform requested and creator has no channel matching
  let filtered = enrichedCreators;
  if (platform && platform !== 'All') {
    filtered = enrichedCreators.filter((c) => c.primaryChannel?.platform === platform);
  }

  // Sort: Mutual sub state at bottom, "needs_my_sub_back" at top!
  filtered.sort((a, b) => {
    const score = (state: string) => {
      if (state === 'needs_my_sub_back') return 3;
      if (state === 'none') return 2;
      if (state === 'pending_their_sub_back') return 1;
      return 0; // mutual
    };
    return score(b.sub4subState) - score(a.sub4subState);
  });

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 12;
  const total = filtered.length;
  const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

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

// POST /api/sub4sub/subscribe - Subscribe to a creator and request a Sub Back (Rate-limited)
router.post('/subscribe', authenticateJWT, exchangeActionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { targetUserId, targetPlatform, channelUrl, campaignId } = req.body;

  if (campaignId && !targetUserId) {
    const rewardCoins = 50;
    db.recordTransaction(
      user.id,
      'earning',
      rewardCoins,
      `Subscribed to Channel Campaign (${campaignId})`
    );

    let remainingSubs: number | undefined;
    const promo = db.promotions.get(campaignId);
    if (promo) {
      promo.clicks = (promo.clicks || 0) + 1;
      promo.spentCredits = (promo.spentCredits || 0) + rewardCoins;
      if (promo.spentCredits >= promo.budgetCredits) {
        promo.status = 'completed';
      }
      await db.savePromotion(promo);
      remainingSubs = Math.max(0, Math.floor((promo.budgetCredits - promo.spentCredits) / (promo.rewardPerDiscovery || 50)));
    }

    return res.json({
      success: true,
      data: {
        rewardCredits: rewardCoins,
        newBalance: user.credits,
        remainingSubscribers: remainingSubs,
      },
      message: `🎉 Subscribed successfully! +${rewardCoins} coins added to your balance.`,
    });
  }

  if (!targetUserId) {
    return res.status(400).json({
      success: false,
      message: 'Target creator ID or campaign ID is required.',
      errorCode: 'MISSING_TARGET_ID',
    });
  }

  if (targetUserId === user.id) {
    return res.status(400).json({
      success: false,
      message: 'You cannot perform Sub4Sub with yourself!',
      errorCode: 'SELF_SUB_NOT_ALLOWED',
    });
  }

  const targetUser = db.users.get(targetUserId);
  if (!targetUser) {
    return res.status(404).json({
      success: false,
      message: 'Target creator not found.',
      errorCode: 'CREATOR_NOT_FOUND',
    });
  }

  // Check if current user already subscribed to target
  const existingMySub = Array.from(db.sub4subRequests.values()).find(
    (r) => r.followerUserId === user.id && r.targetUserId === targetUserId
  );

  if (existingMySub) {
    return res.status(400).json({
      success: false,
      message: existingMySub.status === 'mutual' 
        ? 'You are already in a mutual Sub4Sub partnership with this creator!'
        : 'You have already sent a Sub4Sub request to this creator. Waiting for them to Sub Back!',
      errorCode: 'DUPLICATE_SUB4SUB',
    });
  }

  // Check if target user had already subscribed to current user (Reverse Request exists)
  const reverseSub = Array.from(db.sub4subRequests.values()).find(
    (r) => r.followerUserId === targetUserId && r.targetUserId === user.id
  );

  const platform: PlatformType = targetPlatform || 'YouTube';
  const url = channelUrl || `https://youtube.com/@${targetUser.username}`;

  // Get current user's primary channel
  const myChannels = Array.from(db.socialChannels.values()).filter((c) => c.userId === user.id);
  const myPlatform = myChannels[0]?.platform || 'YouTube';
  const myUrl = myChannels[0]?.url || `https://youtube.com/@${user.username}`;

  if (reverseSub) {
    // Complete mutual sub!
    reverseSub.status = 'mutual';
    reverseSub.completedAt = new Date().toISOString();

    const rewardCredits = 30; // +20 sub + +10 mutual bonus
    db.recordTransaction(
      user.id,
      'earning',
      rewardCredits,
      `Mutual Sub4Sub completed with @${targetUser.username}`
    );

    db.recordTransaction(
      targetUser.id,
      'bonus',
      10,
      `Mutual Sub4Sub bonus with @${user.username}`
    );

    // Send notifications
    db.notifications.unshift({
      id: `notif_${Date.now()}_1`,
      userId: targetUser.id,
      title: '🤝 Mutual Sub4Sub Completed!',
      message: `@${user.username} subscribed back to your ${myPlatform} channel! You both earned bonus credits.`,
      type: 'success',
      link: `/creators/${user.username}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    db.notifications.unshift({
      id: `notif_${Date.now()}_2`,
      userId: user.id,
      title: '🎉 Mutual Sub4Sub Established!',
      message: `You and @${targetUser.username} are now mutual Sub4Sub partners! +${rewardCredits} credits added to your wallet.`,
      type: 'success',
      link: `/creators/${targetUser.username}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return res.json({
      success: true,
      data: {
        sub4sub: reverseSub,
        isMutual: true,
        rewardCredits,
        newBalance: user.credits,
      },
      message: `🤝 Mutual Sub4Sub complete! You and @${targetUser.username} are now following each other. Earned +${rewardCredits} Credits!`,
    });
  } else {
    // Create new Sub4Sub Request
    const requestId = `sub4sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const rewardCredits = 20;

    const newRequest: Sub4SubRequest = {
      id: requestId,
      followerUserId: user.id,
      followerUsername: user.username,
      followerDisplayName: user.displayName,
      followerAvatar: user.avatar,
      followerPlatform: myPlatform,
      followerChannelUrl: myUrl,
      targetUserId: targetUser.id,
      targetUsername: targetUser.username,
      targetDisplayName: targetUser.displayName,
      targetAvatar: targetUser.avatar,
      targetPlatform: platform,
      targetChannelUrl: url,
      status: 'pending',
      rewardCredits,
      createdAt: new Date().toISOString(),
    };

    db.sub4subRequests.set(requestId, newRequest);

    // Award Credits to Follower
    db.recordTransaction(
      user.id,
      'earning',
      rewardCredits,
      `Sub4Sub: Subscribed to @${targetUser.username} (${platform})`
    );

    // Notify Target User to Sub Back
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: targetUser.id,
      title: '🔔 New Sub4Sub Request!',
      message: `@${user.username} subscribed to your ${platform} channel! Click to Sub Back and form a mutual loop.`,
      type: 'promotion',
      link: '/earn',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return res.json({
      success: true,
      data: {
        sub4sub: newRequest,
        isMutual: false,
        rewardCredits,
        newBalance: user.credits,
      },
      message: `🎉 Subscribed! Request sent to @${targetUser.username} to Sub Back. You earned +${rewardCredits} Credits!`,
    });
  }
});

// POST /api/sub4sub/sub-back/:id - Instantly Sub Back to a creator (Rate-limited)
router.post('/sub-back/:id', authenticateJWT, exchangeActionRateLimiter, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const requestId = req.params.id;

  const subRequest = db.sub4subRequests.get(requestId);
  if (!subRequest) {
    return res.status(404).json({
      success: false,
      message: 'Sub4Sub request not found.',
      errorCode: 'NOT_FOUND',
    });
  }

  if (subRequest.targetUserId !== user.id) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized sub-back request.',
      errorCode: 'UNAUTHORIZED',
    });
  }

  if (subRequest.status === 'mutual') {
    return res.status(400).json({
      success: false,
      message: 'Mutual Sub4Sub is already established for this creator!',
      errorCode: 'ALREADY_MUTUAL',
    });
  }

  subRequest.status = 'mutual';
  subRequest.completedAt = new Date().toISOString();

  const rewardCredits = 30; // +20 sub back + +10 mutual bonus
  db.recordTransaction(
    user.id,
    'earning',
    rewardCredits,
    `Sub4Sub: Subscribed back to @${subRequest.followerUsername}`
  );

  // Notify original follower
  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: subRequest.followerUserId,
    title: '🤝 Mutual Sub4Sub Confirmed!',
    message: `@${user.username} subscribed back to your channel! You are now mutual partners.`,
    type: 'success',
    link: `/creators/${user.username}`,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  return res.json({
    success: true,
    data: {
      sub4sub: subRequest,
      rewardCredits,
      newBalance: user.credits,
    },
    message: `🤝 Mutual Sub4Sub complete! You subscribed back to @${subRequest.followerUsername}. Earned +${rewardCredits} Credits!`,
  });
});

// GET /api/sub4sub/my-requests - Get user's incoming Sub Back requests & active mutual pairs
router.get('/my-requests', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const allRequests = Array.from(db.sub4subRequests.values());

  // Incoming pending requests waiting for current user to sub back
  const pendingRequests = allRequests.filter(
    (r) => r.targetUserId === user.id && r.status === 'pending'
  );

  // Active mutual sub pairs involving current user
  const mutualSubs = allRequests.filter(
    (r) => (r.targetUserId === user.id || r.followerUserId === user.id) && r.status === 'mutual'
  );

  // My outgoing sub requests pending target's sub back
  const mySubscribed = allRequests.filter(
    (r) => r.followerUserId === user.id && r.status === 'pending'
  );

  return res.json({
    success: true,
    data: {
      pendingSubBackCount: pendingRequests.length,
      mutualCount: mutualSubs.length,
      pendingRequests,
      mutualSubs,
      mySubscribed,
    },
  });
});

// GET /api/sub4sub/rate-limit-status - Check current user rate-limit allocations and cooldowns
router.get('/rate-limit-status', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const status = rateLimiterService.getUserStatus(user.id);

  return res.json({
    success: true,
    data: {
      userId: user.id,
      status,
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
