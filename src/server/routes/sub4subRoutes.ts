import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
import { antiFraudEngine } from '../services/antiFraudEngine';
import { Sub4SubRequest, PlatformType } from '../../types';

const router = Router();

// POST /api/sub4sub/start-challenge - Issue anti-cheat verification token & countdown timer
router.post('/start-challenge', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
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

// POST /api/sub4sub/verify-claim - Execute anti-fraud algorithm and credit user
router.post('/verify-claim', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
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

// POST /api/sub4sub/subscribe - Subscribe to a creator and request a Sub Back
router.post('/subscribe', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { targetUserId, targetPlatform, channelUrl } = req.body;

  if (!targetUserId) {
    return res.status(400).json({
      success: false,
      message: 'Target creator ID is required.',
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

// POST /api/sub4sub/sub-back/:id - Instantly Sub Back to a creator
router.post('/sub-back/:id', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
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

export default router;
