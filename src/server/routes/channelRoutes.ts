import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
import { PlatformType } from '../../types';
import { resolveTargetMetadata } from '../services/youtubeResolver';

const router = Router();

// GET /api/channels/lookup - Resolve real YouTube channel or video from URL or handle/email query
router.get('/lookup', async (req: Request, res: Response) => {
  const query = (req.query.url || req.query.q || req.query.email || '') as string;
  if (!query.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Target URL, handle, or search query is required.',
      errorCode: 'MISSING_QUERY',
    });
  }

  try {
    const resolved = await resolveTargetMetadata(query);
    return res.json({
      success: true,
      data: resolved,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Failed to resolve channel or video.',
      errorCode: 'RESOLUTION_FAILED',
    });
  }
});

// POST /api/channels/resolve - Resolve real channel / video target metadata
router.post('/resolve', async (req: Request, res: Response) => {
  const { url, query } = req.body;
  const target = (url || query || '') as string;

  if (!target.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Target URL or handle is required.',
      errorCode: 'MISSING_TARGET',
    });
  }

  try {
    const resolved = await resolveTargetMetadata(target);
    return res.json({
      success: true,
      data: resolved,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Failed to resolve target.',
      errorCode: 'RESOLUTION_FAILED',
    });
  }
});

// GET /api/channels - List user's social channels
router.get('/', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const channels = Array.from(db.socialChannels.values()).filter((c) => c.userId === user.id);

  return res.json({
    success: true,
    data: {
      channels,
    },
  });
});

// POST /api/channels - Add a social profile channel
router.post('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { platform, channelName, url, category, description, thumbnail } = req.body;

  if (!platform || !channelName || !url) {
    return res.status(400).json({
      success: false,
      message: 'Platform, channel name, and URL are required.',
      errorCode: 'MISSING_FIELDS',
    });
  }

  const validPlatforms: PlatformType[] = ['YouTube', 'TikTok', 'Instagram', 'Facebook', 'X'];
  if (!validPlatforms.includes(platform)) {
    return res.status(400).json({
      success: false,
      message: 'Supported platforms are YouTube, TikTok, Instagram, Facebook, and X.',
      errorCode: 'INVALID_PLATFORM',
    });
  }

  // Attempt real resolution for accurate thumbnail and channel details
  let resolvedThumbnail = thumbnail || user.avatar;
  let resolvedTitle = channelName.trim();

  if (platform === 'YouTube' || url.includes('youtube.com') || url.includes('youtu.be')) {
    try {
      const realMeta = await resolveTargetMetadata(url);
      if (realMeta.thumbnailUrl) {
        resolvedThumbnail = realMeta.thumbnailUrl;
      }
      if (realMeta.channelName && (!channelName || channelName === 'YouTube Channel')) {
        resolvedTitle = realMeta.channelName;
      }
    } catch {
      // Fallback to provided info
    }
  }

  const channelId = `chan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newChannel = {
    id: channelId,
    userId: user.id,
    platform,
    channelName: resolvedTitle,
    url: url.trim(),
    category: category || user.creatorCategory || 'Technology',
    description: description ? description.trim() : user.bio,
    thumbnail: resolvedThumbnail,
    isVerified: true,
    createdAt: new Date().toISOString(),
  };

  await db.saveSocialChannel(newChannel);

  // Update channel count on Creator Profile
  const profile = Array.from(db.creatorProfiles.values()).find((p) => p.userId === user.id);
  if (profile) {
    profile.socialChannelsCount += 1;
    await db.saveCreatorProfile(profile);
  }

  return res.status(201).json({
    success: true,
    message: `${platform} profile connected successfully!`,
    data: {
      channel: newChannel,
    },
  });
});

// DELETE /api/channels/:id - Delete social channel
router.delete('/:id', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;

  const channel = db.socialChannels.get(id);
  if (!channel || channel.userId !== user.id) {
    return res.status(404).json({
      success: false,
      message: 'Channel not found or unauthorized.',
      errorCode: 'NOT_FOUND',
    });
  }

  db.socialChannels.delete(id);

  const profile = Array.from(db.creatorProfiles.values()).find((p) => p.userId === user.id);
  if (profile && profile.socialChannelsCount > 0) {
    profile.socialChannelsCount -= 1;
  }

  return res.json({
    success: true,
    message: 'Social channel removed.',
  });
});

export default router;
