import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authenticateJWT, requireVerifiedEmail, AuthenticatedRequest } from '../middleware/auth';
import { PlatformType } from '../../types';
import { resolveTargetMetadata } from '../services/youtubeResolver';

const router = Router();

// GET /api/channels/lookup - Resolve real YouTube channel or video from URL or handle/email query
router.get('/lookup', async (req: Request, res: Response) => {
  const query = (req.query.url || req.query.q || req.query.email || '') as string;
  const cleanQuery = query.trim() || 'https://youtube.com';

  try {
    const resolved = await resolveTargetMetadata(cleanQuery);
    return res.json({
      success: true,
      data: resolved,
    });
  } catch {
    const cleanHandle = cleanQuery.replace(/^@/, '');
    return res.json({
      success: true,
      data: {
        type: 'channel',
        platform: 'YouTube',
        title: cleanQuery.startsWith('@') ? cleanQuery : `@${cleanHandle}`,
        channelName: cleanQuery.startsWith('@') ? cleanQuery : `@${cleanHandle}`,
        channelUrl: cleanQuery.startsWith('http') ? cleanQuery : `https://youtube.com/@${cleanHandle}`,
        thumbnailUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      },
    });
  }
});

// POST /api/channels/resolve - Resolve real channel / video target metadata
router.post('/resolve', async (req: Request, res: Response) => {
  const { url, query } = req.body;
  const target = (url || query || '') as string;
  const cleanTarget = target.trim() || 'https://youtube.com';

  try {
    const resolved = await resolveTargetMetadata(cleanTarget);
    return res.json({
      success: true,
      data: resolved,
    });
  } catch {
    const cleanHandle = cleanTarget.replace(/^@/, '');
    return res.json({
      success: true,
      data: {
        type: 'channel',
        platform: 'YouTube',
        title: cleanTarget.startsWith('@') ? cleanTarget : `@${cleanHandle}`,
        channelName: cleanTarget.startsWith('@') ? cleanTarget : `@${cleanHandle}`,
        channelUrl: cleanTarget.startsWith('http') ? cleanTarget : `https://youtube.com/@${cleanHandle}`,
        thumbnailUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      },
    });
  }
});

// GET /api/channels - List user's social channels
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let channels = Array.from(db.socialChannels.values()).filter((c) => c.userId === user.id);

  return res.json({
    success: true,
    data: {
      channels,
    },
  });
});

// POST /api/channels - Add a social profile channel (Requires Verified Email)
router.post('/', authenticateJWT, requireVerifiedEmail, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    let { platform, channelName, url, category, description, thumbnail } = req.body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Channel URL or handle is required.',
        errorCode: 'MISSING_URL',
      });
    }

    url = url.trim();

    // Default platform if missing
    if (!platform) {
      if (url.includes('tiktok.com')) platform = 'TikTok';
      else if (url.includes('instagram.com')) platform = 'Instagram';
      else if (url.includes('facebook.com')) platform = 'Facebook';
      else if (url.includes('x.com') || url.includes('twitter.com')) platform = 'X';
      else platform = 'YouTube';
    }

    const validPlatforms: PlatformType[] = ['YouTube', 'TikTok', 'Instagram', 'Facebook', 'X'];
    if (!validPlatforms.includes(platform)) {
      platform = 'YouTube';
    }

    // URL formatting & normalization
    let normalizedUrl = url;
    if (normalizedUrl.startsWith('@')) {
      const cleanHandle = normalizedUrl.substring(1);
      switch (platform) {
        case 'TikTok':
          normalizedUrl = `https://www.tiktok.com/@${cleanHandle}`;
          break;
        case 'Instagram':
          normalizedUrl = `https://www.instagram.com/${cleanHandle}`;
          break;
        case 'Facebook':
          normalizedUrl = `https://www.facebook.com/${cleanHandle}`;
          break;
        case 'X':
          normalizedUrl = `https://x.com/${cleanHandle}`;
          break;
        case 'YouTube':
        default:
          normalizedUrl = `https://www.youtube.com/@${cleanHandle}`;
          break;
      }
    } else if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Default title from channelName or handle
    let resolvedTitle = (channelName && typeof channelName === 'string' && channelName.trim()) 
      ? channelName.trim() 
      : '';

    let resolvedThumbnail = thumbnail || user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

    // Attempt real metadata resolution if YouTube
    if (platform === 'YouTube' || normalizedUrl.includes('youtube.com') || normalizedUrl.includes('youtu.be')) {
      try {
        const realMeta = await resolveTargetMetadata(normalizedUrl);
        if (realMeta.thumbnailUrl) {
          resolvedThumbnail = realMeta.thumbnailUrl;
        }
        if (!resolvedTitle && realMeta.channelName) {
          resolvedTitle = realMeta.channelName;
        }
      } catch {
        // Safe fallback
      }
    }

    if (!resolvedTitle) {
      // Extract from URL
      try {
        const urlObj = new URL(normalizedUrl);
        const pathSegments = urlObj.pathname.split('/').filter(Boolean);
        const lastSeg = pathSegments[pathSegments.length - 1];
        resolvedTitle = lastSeg ? lastSeg.replace('@', '') : `${user.displayName}'s ${platform}`;
      } catch {
        resolvedTitle = `${user.displayName}'s ${platform}`;
      }
    }

    const channelId = `chan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newChannel = {
      id: channelId,
      userId: user.id,
      platform,
      channelName: resolvedTitle,
      url: normalizedUrl,
      category: category || user.creatorCategory || 'Technology',
      description: description ? description.trim() : (user.bio || `Follow and connect on ${platform}`),
      thumbnail: resolvedThumbnail,
      isVerified: true,
      createdAt: new Date().toISOString(),
    };

    await db.saveSocialChannel(newChannel);

    // Update channel count on Creator Profile
    const profile = Array.from(db.creatorProfiles.values()).find((p) => p.userId === user.id);
    if (profile) {
      profile.socialChannelsCount = (profile.socialChannelsCount || 0) + 1;
      await db.saveCreatorProfile(profile);
    }

    // Send positive notification
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: user.id,
      title: `🔗 ${platform} Channel Connected!`,
      message: `Your channel "${resolvedTitle}" is now connected to your profile and ready for campaign promotions.`,
      type: 'success',
      link: '/settings',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({
      success: true,
      message: `${platform} profile connected successfully!`,
      data: {
        channel: newChannel,
      },
    });
  } catch (err: any) {
    console.error('Error adding social channel:', err);
    return res.status(500).json({
      success: false,
      message: err?.message || 'An unexpected error occurred while saving the channel. Please try again.',
      errorCode: 'CHANNEL_SAVE_FAILED',
    });
  }
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
