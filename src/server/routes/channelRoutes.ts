import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
import { PlatformType } from '../../types';

const router = Router();

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
router.post('/', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
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

  const channelId = `chan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newChannel = {
    id: channelId,
    userId: user.id,
    platform,
    channelName: channelName.trim(),
    url: url.trim(),
    category: category || user.creatorCategory || 'Technology',
    description: description ? description.trim() : user.bio,
    thumbnail: thumbnail || user.avatar,
    isVerified: true, // Internal platform verification
    createdAt: new Date().toISOString(),
  };

  db.socialChannels.set(channelId, newChannel);

  // Update channel count on Creator Profile
  const profile = Array.from(db.creatorProfiles.values()).find((p) => p.userId === user.id);
  if (profile) {
    profile.socialChannelsCount += 1;
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
