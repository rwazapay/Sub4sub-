import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { YouTubeEmbedPlayer } from '../components/YouTubeEmbedPlayer';
import { ReferralHub } from '../components/ReferralHub';
import { EmailVerificationBanner } from '../components/EmailVerificationBanner';
import {
  Coins,
  Users,
  Play,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  ExternalLink,
  Flame,
  Filter,
  Check,
  Zap,
  Radio,
  Tv,
  Globe,
  RefreshCw,
  AlertCircle,
  Gift,
} from 'lucide-react';

export interface ChannelCampaign {
  id: string;
  channelName: string;
  channelUrl: string;
  avatar: string;
  subscribersRemaining: number;
  subscribedCount: number;
  totalTarget: number;
  rewardCoins: number;
}

export interface VideoCampaign {
  id: string;
  videoTitle: string;
  youtubeId: string;
  channelName: string;
  thumbnail: string;
  rewardCoins: number;
  viewsRemaining: number;
  watchedCount: number;
  totalTarget: number;
  watchTimeSeconds: number;
}

export interface PromotedLookupItem {
  id: string;
  lookupType: 'channel' | 'video' | 'campaign' | 'combo';
  title: string;
  channelName?: string;
  creatorUsername?: string;
  creatorAvatar?: string;
  avatarOrThumbnail: string;
  platform: string;
  targetUrl: string;
  youtubeId?: string;
  rewardCoins: number;
  rewardType: 'per_subscriber' | 'per_view' | 'per_discovery';
  subscribersRemaining?: number;
  viewsRemaining?: number;
  completedCount?: number;
  totalTarget?: number;
  watchTimeSeconds?: number;
  status: 'active' | 'completed' | 'paused';
  isAiVerified?: boolean;
  isSponsored?: boolean;
  createdAt?: string;
}

// Initial fallback channel campaigns
const MOCK_CHANNEL_CAMPAIGNS: ChannelCampaign[] = [
  {
    id: 'ch-1',
    channelName: 'Mitalda Plays',
    channelUrl: 'https://youtube.com/@mitaldaplays',
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
    subscribersRemaining: 6,
    subscribedCount: 7,
    totalTarget: 13,
    rewardCoins: 50,
  },
  {
    id: 'ch-2',
    channelName: 'Nexus Gaming India',
    channelUrl: 'https://youtube.com/@nexusgaming',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    subscribersRemaining: 12,
    subscribedCount: 38,
    totalTarget: 50,
    rewardCoins: 50,
  },
  {
    id: 'ch-3',
    channelName: 'Tech Byte Official',
    channelUrl: 'https://youtube.com/@techbyte',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    subscribersRemaining: 20,
    subscribedCount: 80,
    totalTarget: 100,
    rewardCoins: 50,
  },
];

const MOCK_VIDEO_CAMPAIGNS: VideoCampaign[] = [
  {
    id: 'vid-1',
    videoTitle: 'FINALLY 🔥 BGMI 4.5 UPDATE IS HERE , NARUTO X BGMI 🔥 BEST UPDATE?| Mitalda Plays',
    youtubeId: 'dQw4w9WgXcQ',
    channelName: 'Mitalda Plays',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    rewardCoins: 10,
    viewsRemaining: 63,
    watchedCount: 6,
    totalTarget: 69,
    watchTimeSeconds: 30,
  },
  {
    id: 'vid-2',
    videoTitle: 'Top 10 Secret Tricks in BGMI Custom Rooms 🎮 Pro Gameplay Tips',
    youtubeId: 'L_LUpnjgPso',
    channelName: 'Nexus Gaming India',
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
    rewardCoins: 10,
    viewsRemaining: 45,
    watchedCount: 15,
    totalTarget: 60,
    watchTimeSeconds: 30,
  },
  {
    id: 'vid-3',
    videoTitle: 'How to Grow Fast on YouTube in 2026 📈 Complete Algorithm Secrets',
    youtubeId: 'kJQP7kiw5Fk',
    channelName: 'Tech Byte Official',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    rewardCoins: 10,
    viewsRemaining: 88,
    watchedCount: 12,
    totalTarget: 100,
    watchTimeSeconds: 30,
  },
];

export const EarnPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state: 'subscribe' | 'watch' | 'referral' | 'lookup'
  const initialTab = (searchParams.get('tab') as 'subscribe' | 'watch' | 'referral' | 'lookup') || 'subscribe';
  const [activeTab, setActiveTab] = useState<'subscribe' | 'watch' | 'referral' | 'lookup'>(initialTab);

  // Sync tab change from URL params
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'referral' || tabParam === 'subscribe' || tabParam === 'watch' || tabParam === 'lookup') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'subscribe' | 'watch' | 'referral' | 'lookup') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Channel campaigns list state
  const [channelCampaigns, setChannelCampaigns] = useState<ChannelCampaign[]>(MOCK_CHANNEL_CAMPAIGNS);
  const [subscribedIds, setSubscribedIds] = useState<string[]>([]);

  // Video campaigns state
  const [videoCampaigns, setVideoCampaigns] = useState<VideoCampaign[]>(MOCK_VIDEO_CAMPAIGNS);
  const [activeVideo, setActiveVideo] = useState<VideoCampaign | null>(null);

  // Watch timer state
  const [timer, setTimer] = useState<number>(30);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [canClaimCoins, setCanClaimCoins] = useState<boolean>(false);
  const [claiming, setClaiming] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Look Up Engine State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lookupFilterType, setLookupFilterType] = useState<'all' | 'channel' | 'video' | 'campaign'>('all');
  const [lookupItems, setLookupItems] = useState<PromotedLookupItem[]>([]);
  const [isSearchingLookup, setIsSearchingLookup] = useState<boolean>(false);
  const [hasCustomUrlInspected, setHasCustomUrlInspected] = useState<boolean>(false);

  if (!user) return null;

  // Load lookup items from backend
  const fetchLookupData = async (query = '', type = 'all') => {
    setIsSearchingLookup(true);
    try {
      const res = await apiClient.get('/promotions/lookup', {
        params: {
          q: query,
          type: type,
        },
      });
      if (res.data.success && res.data.data?.items) {
        const items: PromotedLookupItem[] = res.data.data.items;
        setLookupItems(items);

        // Dynamically extract and sync live channel campaigns
        const dynamicChannels: ChannelCampaign[] = items
          .filter((it) => it.lookupType === 'channel' || it.lookupType === 'campaign')
          .map((it) => ({
            id: it.id,
            channelName: it.channelName || it.title,
            channelUrl: it.targetUrl,
            avatar: it.avatarOrThumbnail || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            subscribersRemaining: it.subscribersRemaining !== undefined ? it.subscribersRemaining : Math.max(0, it.totalTarget - it.completedCount),
            subscribedCount: it.completedCount || 0,
            totalTarget: it.totalTarget || 20,
            rewardCoins: it.rewardCoins || 50,
            category: 'YouTube Creator',
          }));

        if (dynamicChannels.length > 0) {
          setChannelCampaigns(dynamicChannels);
        }

        // Dynamically extract and sync live video campaigns
        const dynamicVideos: VideoCampaign[] = items
          .filter((it) => it.lookupType === 'video')
          .map((it) => ({
            id: it.id,
            videoTitle: it.title,
            youtubeId: it.youtubeId || (it.targetUrl.includes('v=') ? it.targetUrl.split('v=')[1]?.substring(0, 11) : 'dQw4w9WgXcQ'),
            channelName: it.channelName || 'YouTube Creator',
            thumbnail: it.avatarOrThumbnail || (it.youtubeId ? `https://i.ytimg.com/vi/${it.youtubeId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80'),
            rewardCoins: it.rewardCoins || 10,
            viewsRemaining: it.viewsRemaining !== undefined ? it.viewsRemaining : Math.max(0, it.totalTarget - it.completedCount),
            watchedCount: it.completedCount || 0,
            totalTarget: it.totalTarget || 50,
            watchTimeSeconds: it.watchTimeSeconds || 30,
          }));

        if (dynamicVideos.length > 0) {
          setVideoCampaigns(dynamicVideos);
        }
      }
    } catch (err) {
      // Fallback local search aggregation
      const combined: PromotedLookupItem[] = [
        ...channelCampaigns.map((c) => ({
          id: c.id,
          lookupType: 'channel' as const,
          title: `${c.channelName} - YouTube Creator Promotion`,
          channelName: c.channelName,
          creatorUsername: c.channelName.toLowerCase().replace(/\s+/g, ''),
          avatarOrThumbnail: c.avatar,
          platform: 'youtube',
          targetUrl: c.channelUrl,
          rewardCoins: c.rewardCoins,
          rewardType: 'per_subscriber' as const,
          subscribersRemaining: c.subscribersRemaining,
          completedCount: c.subscribedCount,
          totalTarget: c.totalTarget,
          status: 'active' as const,
          isAiVerified: true,
          isSponsored: true,
        })),
        ...videoCampaigns.map((v) => ({
          id: v.id,
          lookupType: 'video' as const,
          title: v.videoTitle,
          channelName: v.channelName,
          creatorUsername: v.channelName.toLowerCase().replace(/\s+/g, ''),
          avatarOrThumbnail: v.thumbnail,
          youtubeId: v.youtubeId,
          platform: 'youtube',
          targetUrl: `https://www.youtube.com/watch?v=${v.youtubeId}`,
          rewardCoins: v.rewardCoins,
          rewardType: 'per_view' as const,
          viewsRemaining: v.viewsRemaining,
          completedCount: v.watchedCount,
          totalTarget: v.totalTarget,
          watchTimeSeconds: v.watchTimeSeconds,
          status: 'active' as const,
          isAiVerified: true,
          isSponsored: false,
        })),
      ];

      let filtered = combined;
      if (type !== 'all') {
        filtered = filtered.filter((i) => i.lookupType === type);
      }
      if (query.trim()) {
        const q = query.toLowerCase();
        filtered = filtered.filter(
          (i) =>
            i.title.toLowerCase().includes(q) ||
            i.channelName?.toLowerCase().includes(q) ||
            i.targetUrl.toLowerCase().includes(q)
        );
      }
      setLookupItems(filtered);
    } finally {
      setIsSearchingLookup(false);
    }
  };

  useEffect(() => {
    fetchLookupData(searchQuery, lookupFilterType);
  }, [lookupFilterType]);

  // Handle Search Input Submission or Typing
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActiveTab('lookup');
    fetchLookupData(searchQuery, lookupFilterType);
  };

  // Timer effect for watching videos
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && timerRunning) {
      setTimerRunning(false);
      setCanClaimCoins(true);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timer]);

  // Handle subscribe action
  const handleSubscribe = async (campaign: ChannelCampaign | PromotedLookupItem) => {
    const rawCampaign = campaign as any;
    const channelUrl = rawCampaign.channelUrl || rawCampaign.targetUrl;
    if (channelUrl) {
      window.open(channelUrl, '_blank');
    }

    const reward = campaign.rewardCoins || 50;

    // Optimistically update
    if (!subscribedIds.includes(campaign.id)) {
      setSubscribedIds((prev) => [...prev, campaign.id]);

      const newCredits = user.credits + reward;
      updateUser({ ...user, credits: newCredits });

      setToastMessage(`🎉 You earned +${reward} coins! Channel verification recorded.`);
      setTimeout(() => setToastMessage(null), 3000);

      // Update campaign counts
      setChannelCampaigns((prev) =>
        prev.map((item) =>
          item.id === campaign.id
            ? {
                ...item,
                subscribedCount: item.subscribedCount + 1,
                subscribersRemaining: Math.max(0, item.subscribersRemaining - 1),
              }
            : item
        )
      );

      setLookupItems((prev) =>
        prev.map((item) =>
          item.id === campaign.id
            ? {
                ...item,
                completedCount: (item.completedCount || 0) + 1,
                subscribersRemaining: Math.max(0, (item.subscribersRemaining || 1) - 1),
              }
            : item
        )
      );

      try {
        await apiClient.post('/sub4sub/subscribe', { campaignId: campaign.id });
      } catch (err) {
        // Fallback quiet handle
      }
    }
  };

  // Start watching a video
  const startWatchingVideo = (video: VideoCampaign | PromotedLookupItem) => {
    const rawVideo = video as any;
    const videoData: VideoCampaign = {
      id: video.id,
      videoTitle: rawVideo.videoTitle || rawVideo.title,
      youtubeId: rawVideo.youtubeId || 'dQw4w9WgXcQ',
      channelName: video.channelName || 'YouTube Creator',
      thumbnail: rawVideo.thumbnail || rawVideo.avatarOrThumbnail,
      rewardCoins: video.rewardCoins || 10,
      viewsRemaining: rawVideo.viewsRemaining || 50,
      watchedCount: rawVideo.watchedCount || rawVideo.completedCount || 0,
      totalTarget: video.totalTarget || 60,
      watchTimeSeconds: rawVideo.watchTimeSeconds || 30,
    };

    setActiveVideo(videoData);
    setTimer(videoData.watchTimeSeconds || 30);
    setTimerRunning(true);
    setCanClaimCoins(false);
  };

  // Claim coins after video watch timer completes
  const handleClaimWatchReward = async () => {
    if (!activeVideo || claiming) return;

    setClaiming(true);
    const reward = activeVideo.rewardCoins || 10;
    const newCredits = user.credits + reward;

    updateUser({ ...user, credits: newCredits });

    setToastMessage(`🎉 +${reward} coins added to your wallet!`);
    setTimeout(() => setToastMessage(null), 3000);

    // Update watched count for active video
    setVideoCampaigns((prev) =>
      prev.map((v) =>
        v.id === activeVideo.id
          ? {
              ...v,
              watchedCount: v.watchedCount + 1,
              viewsRemaining: Math.max(0, v.viewsRemaining - 1),
            }
          : v
      )
    );

    try {
      await apiClient.post('/sub4sub/watch-complete', { videoId: activeVideo.id });
    } catch (err) {
      // Quiet fallback
    } finally {
      setClaiming(false);
      setActiveVideo(null);
    }
  };

  // Format seconds as 0:30
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 text-stone-900 dark:text-stone-100 w-full min-w-0">
      <EmailVerificationBanner />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-stone-950 font-bold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 fill-stone-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Title & Subtitle */}
      {!activeVideo && (
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white truncate">
                Earn Coins & Look Up
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                Subscribe, watch videos, invite friends, or look up campaigns to earn free coins.
              </p>
            </div>
            <div className="px-3.5 py-1.5 rounded-2xl bg-red-600/10 border border-red-500/30 flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs font-bold shrink-0 self-start sm:self-auto">
              <Coins className="w-4 h-4 fill-red-500/20" />
              <span>{user.credits} Coins</span>
            </div>
          </div>

          {/* Quick Universal Lookup Bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Look up any campaign, channel URL, or video ID to earn..."
                className="w-full bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-2xl pl-10 pr-24 py-3 text-xs sm:text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-xs"
              />
              <button
                type="submit"
                className="absolute right-2 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1"
              >
                <span>Look Up</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Segmented Bar (Subscribe | Watch & Earn | Referrals | Look Up) */}
      {!activeVideo && (
        <div className="p-1 rounded-2xl bg-stone-100 dark:bg-[#1a1612] border border-stone-200/80 dark:border-[#262018] flex flex-wrap sm:flex-nowrap items-center text-xs font-bold gap-1">
          <button
            onClick={() => handleTabChange('subscribe')}
            className={`flex-1 min-w-[80px] py-2.5 px-3 rounded-xl transition-all text-center whitespace-nowrap ${
              activeTab === 'subscribe'
                ? 'bg-white dark:bg-[#262018] text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Subscribe
          </button>
          <button
            onClick={() => handleTabChange('watch')}
            className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl transition-all text-center whitespace-nowrap ${
              activeTab === 'watch'
                ? 'bg-white dark:bg-[#262018] text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Watch & Earn
          </button>
          <button
            onClick={() => handleTabChange('referral')}
            className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'referral'
                ? 'bg-white dark:bg-[#262018] text-stone-900 dark:text-white shadow-sm text-red-500 font-extrabold'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-red-500" />
            <span>Referrals</span>
            <span className="px-1.5 py-0.5 rounded-full bg-red-600/10 text-red-600 dark:text-red-400 text-[9px] font-black">
              +100
            </span>
          </button>
          <button
            onClick={() => {
              handleTabChange('lookup');
              fetchLookupData(searchQuery, lookupFilterType);
            }}
            className={`flex-1 min-w-[80px] py-2.5 px-3 rounded-xl transition-all text-center flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === 'lookup'
                ? 'bg-white dark:bg-[#262018] text-stone-900 dark:text-white shadow-sm text-red-500 font-extrabold'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Look Up</span>
          </button>
        </div>
      )}

      {/* Content Area */}
      {!activeVideo ? (
        <>
          {/* TAB 1: SUBSCRIBE */}
          {activeTab === 'subscribe' && (
            <div className="space-y-4">
              {channelCampaigns.map((channel) => {
                const isSubbed = subscribedIds.includes(channel.id);
                const progressPct = Math.min(
                  100,
                  Math.round((channel.subscribedCount / channel.totalTarget) * 100)
                );

                return (
                  <div
                    key={channel.id}
                    className="bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-5 shadow-xs space-y-4"
                  >
                    {/* Header: Avatar + Channel Info */}
                    <div className="flex items-center gap-3">
                      <img
                        src={channel.avatar}
                        alt={channel.channelName}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-red-500/20 shrink-0"
                      />
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-stone-900 dark:text-white text-base truncate">
                            {channel.channelName}
                          </h3>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-600/10 text-red-600 dark:text-red-400 border border-red-500/20">
                            Channel
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-stone-400" />
                          <span>{channel.subscribersRemaining} subscribers remaining</span>
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="w-full bg-stone-100 dark:bg-[#0d0b09] h-2 rounded-full overflow-hidden border border-stone-200/50 dark:border-[#262018]">
                        <div
                          className="bg-red-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                        {channel.subscribedCount} / {channel.totalTarget} subscribed
                      </p>
                    </div>

                    {/* Earn Button */}
                    <button
                      onClick={() => handleSubscribe(channel)}
                      disabled={isSubbed}
                      className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                        isSubbed
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 cursor-default'
                          : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/25 active:scale-[0.99]'
                      }`}
                    >
                      {isSubbed ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>Subscribed · Earned 50 coins</span>
                        </>
                      ) : (
                        <span>Earn {channel.rewardCoins} coins</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: WATCH & EARN (List View) */}
          {activeTab === 'watch' && (
            <div className="space-y-4">
              {videoCampaigns.map((video) => (
                <div
                  key={video.id}
                  onClick={() => startWatchingVideo(video)}
                  className="bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-4 shadow-xs hover:border-red-500/50 transition-all cursor-pointer space-y-3 group"
                >
                  {/* Thumbnail with Overlay Play Icon */}
                  <div className="relative aspect-video w-full bg-stone-900 rounded-2xl overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.videoTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-red-600/90 text-stone-950 flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 fill-stone-950 ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white flex items-center gap-1">
                      <Clock className="w-3 h-3 text-red-400" />
                      <span>{video.watchTimeSeconds || 30}s</span>
                    </div>
                  </div>

                  {/* Title & Channel */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-stone-900 dark:text-white text-sm line-clamp-2 group-hover:text-red-500 transition-colors leading-snug">
                        {video.videoTitle}
                      </h3>
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-red-600/10 text-red-600 dark:text-red-400 text-[11px] font-extrabold">
                        +{video.rewardCoins} coins
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{video.channelName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: UNIFIED CAMPAIGN, CHANNEL & VIDEO LOOKUP EXPLORER */}
          {activeTab === 'lookup' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
                <button
                  onClick={() => setLookupFilterType('all')}
                  className={`px-3 py-1.5 rounded-xl transition-colors shrink-0 ${
                    lookupFilterType === 'all'
                      ? 'bg-red-600 text-stone-950'
                      : 'bg-stone-100 dark:bg-[#161310] border border-stone-200 dark:border-[#262018] text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  All Promoted ({lookupItems.length})
                </button>
                <button
                  onClick={() => setLookupFilterType('channel')}
                  className={`px-3 py-1.5 rounded-xl transition-colors shrink-0 ${
                    lookupFilterType === 'channel'
                      ? 'bg-red-600 text-stone-950'
                      : 'bg-stone-100 dark:bg-[#161310] border border-stone-200 dark:border-[#262018] text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  Channels (Sub4Sub)
                </button>
                <button
                  onClick={() => setLookupFilterType('video')}
                  className={`px-3 py-1.5 rounded-xl transition-colors shrink-0 ${
                    lookupFilterType === 'video'
                      ? 'bg-red-600 text-stone-950'
                      : 'bg-stone-100 dark:bg-[#161310] border border-stone-200 dark:border-[#262018] text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  Videos (Watch & Earn)
                </button>
                <button
                  onClick={() => setLookupFilterType('campaign')}
                  className={`px-3 py-1.5 rounded-xl transition-colors shrink-0 ${
                    lookupFilterType === 'campaign'
                      ? 'bg-red-600 text-stone-950'
                      : 'bg-stone-100 dark:bg-[#161310] border border-stone-200 dark:border-[#262018] text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  Sponsored Campaigns
                </button>
              </div>

              {/* Lookup Stats Banner */}
              <div className="p-3.5 rounded-2xl bg-red-600/5 border border-red-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-500 fill-red-500" />
                  <span className="font-bold text-stone-800 dark:text-stone-200">
                    {searchQuery ? `Lookup results for "${searchQuery}"` : 'All Active Promoted Campaigns & Channels'}
                  </span>
                </div>
                <button
                  onClick={() => fetchLookupData(searchQuery, lookupFilterType)}
                  className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                  title="Refresh Lookup"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSearchingLookup ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Lookup Results List */}
              {lookupItems.length === 0 ? (
                <div className="bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-[#0d0b09] flex items-center justify-center mx-auto text-stone-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-stone-900 dark:text-white text-sm">
                    No matching campaign or channel found
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                    Try searching by another channel URL, video title, or creator username.
                  </p>
                </div>
              ) : (
                lookupItems.map((item) => {
                  const isSubbed = subscribedIds.includes(item.id);
                  const isVideo = item.lookupType === 'video';

                  return (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-5 shadow-xs space-y-4 hover:border-red-500/40 transition-colors"
                    >
                      {/* Top Bar: Type Pill & Reward */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                              isVideo
                                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                : item.lookupType === 'channel'
                                ? 'bg-red-600/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                            }`}
                          >
                            {isVideo ? 'Promoted Video' : item.lookupType === 'channel' ? 'Channel Exchange' : 'Sponsored Boost'}
                          </span>
                          {item.isSponsored && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-stone-100 dark:bg-[#262018] text-stone-600 dark:text-stone-300">
                              Featured
                            </span>
                          )}
                        </div>
                        <span className="px-2.5 py-1 rounded-xl bg-red-600 text-stone-950 font-black text-xs shadow-xs">
                          +{item.rewardCoins} coins
                        </span>
                      </div>

                      {/* Item Content: Thumbnail/Avatar & Title */}
                      <div className="flex items-start gap-3">
                        <img
                          src={item.avatarOrThumbnail}
                          alt={item.title}
                          className={`object-cover ring-1 ring-stone-200 dark:ring-[#262018] shrink-0 ${
                            isVideo ? 'w-24 h-14 rounded-xl' : 'w-12 h-12 rounded-full'
                          }`}
                        />
                        <div className="space-y-1 flex-1 min-w-0">
                          <h3 className="font-bold text-stone-900 dark:text-white text-sm line-clamp-2 leading-snug">
                            {item.title}
                          </h3>
                          <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 truncate">
                            <span>{item.channelName || `@${item.creatorUsername}`}</span>
                            <span>•</span>
                            <span className="capitalize">{item.platform}</span>
                          </p>
                        </div>
                      </div>

                      {/* Progress / Slots Remaining */}
                      {item.totalTarget && (
                        <div className="space-y-1 pt-1">
                          <div className="w-full bg-stone-100 dark:bg-[#0d0b09] h-1.5 rounded-full overflow-hidden border border-stone-200/40 dark:border-[#262018]">
                            <div
                              className="bg-red-600 h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.round(((item.completedCount || 0) / item.totalTarget) * 100)
                                )}%`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] text-stone-500 dark:text-stone-400">
                            <span>
                              {item.completedCount || 0} / {item.totalTarget} completed
                            </span>
                            <span>
                              {item.subscribersRemaining || item.viewsRemaining || 0} remaining
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Direct Earn Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        {isVideo ? (
                          <button
                            onClick={() => startWatchingVideo(item)}
                            className="flex-1 py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                          >
                            <Play className="w-4 h-4 fill-stone-950" />
                            <span>Watch & Earn {item.rewardCoins} Coins (30s)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSubscribe(item)}
                            disabled={isSubbed}
                            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 ${
                              isSubbed
                                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 cursor-default'
                                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/25 active:scale-[0.99]'
                            }`}
                          >
                            {isSubbed ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span>Subscribed · Earned 50 coins</span>
                              </>
                            ) : (
                              <span>Subscribe & Earn {item.rewardCoins} Coins</span>
                            )}
                          </button>
                        )}

                        {item.targetUrl && (
                          <a
                            href={item.targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 rounded-2xl bg-stone-100 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] text-stone-600 dark:text-stone-400 hover:text-red-500 transition-colors"
                            title="Open direct URL in new tab"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 4: REFERRAL HUB */}
          {activeTab === 'referral' && <ReferralHub />}
        </>
      ) : (
        /* ACTIVE VIDEO WATCHING MODE */
        <div className="bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-5 shadow-lg space-y-5 animate-in fade-in">
          {/* Back Navigation & Header */}
          <div className="flex items-center gap-3 pb-2 border-b border-stone-200 dark:border-[#262018]">
            <button
              onClick={() => {
                setActiveVideo(null);
                setTimerRunning(false);
              }}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#201b16] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 overflow-hidden">
              <img
                src={activeVideo.thumbnail}
                alt={activeVideo.videoTitle}
                className="w-10 h-10 rounded-lg object-cover shrink-0"
              />
              <div className="truncate">
                <h3 className="font-bold text-stone-900 dark:text-white text-xs truncate">
                  {activeVideo.videoTitle}
                </h3>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                  {activeVideo.channelName}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid: Coins / view & Remaining */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-stone-50 dark:bg-[#0d0b09] border border-stone-200/80 dark:border-[#262018] rounded-2xl p-4 text-center space-y-1">
              <div className="flex justify-center text-red-500">
                <Coins className="w-5 h-5 fill-red-500/20" />
              </div>
              <p className="text-xl font-extrabold text-stone-900 dark:text-white">
                {activeVideo.rewardCoins}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">coins / view</p>
            </div>

            <div className="bg-stone-50 dark:bg-[#0d0b09] border border-stone-200/80 dark:border-[#262018] rounded-2xl p-4 text-center space-y-1">
              <div className="flex justify-center text-stone-500 dark:text-stone-400">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-xl font-extrabold text-stone-900 dark:text-white">
                {activeVideo.viewsRemaining}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">remaining</p>
            </div>
          </div>

          {/* Watched Progress Line */}
          <div className="space-y-1.5">
            <div className="w-full bg-stone-100 dark:bg-[#0d0b09] h-2 rounded-full overflow-hidden border border-stone-200/50 dark:border-[#262018]">
              <div
                className="bg-red-600 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((activeVideo.watchedCount / activeVideo.totalTarget) * 100)
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {activeVideo.watchedCount} / {activeVideo.totalTarget} watched
            </p>
          </div>

          {/* Embedded Video Player */}
          <YouTubeEmbedPlayer
            videoUrlOrId={activeVideo.youtubeId}
            title={activeVideo.videoTitle}
            autoplay
          />

          {/* Bottom Countdown Card or Claim Button */}
          {canClaimCoins ? (
            <button
              onClick={handleClaimWatchReward}
              disabled={claiming}
              className="w-full py-4 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm shadow-xl shadow-red-600/25 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 fill-stone-950" />
              <span>{claiming ? 'Claiming Reward...' : `Claim ${activeVideo.rewardCoins} coins`}</span>
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] flex items-center justify-between">
              <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                Keep the video playing to earn coins
              </span>
              <span className="text-sm font-extrabold text-stone-900 dark:text-white font-mono bg-stone-200 dark:bg-[#1a1612] px-3 py-1 rounded-xl">
                {formatTimer(timer)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
