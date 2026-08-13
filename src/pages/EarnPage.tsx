import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { YouTubeEmbedPlayer } from '../components/YouTubeEmbedPlayer';
import {
  Coins,
  Users,
  Play,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  Tv,
} from 'lucide-react';

interface ChannelCampaign {
  id: string;
  channelName: string;
  channelUrl: string;
  avatar: string;
  subscribersRemaining: number;
  subscribedCount: number;
  totalTarget: number;
  rewardCoins: number;
}

interface VideoCampaign {
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

// Initial mock campaigns matching screenshot data
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
    youtubeId: 'dQw4w9WgXcQ', // fallback embeddable ID
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
];

export const EarnPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  
  // Tab state: 'subscribe' | 'watch'
  const [activeTab, setActiveTab] = useState<'subscribe' | 'watch'>('subscribe');
  
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

  if (!user) return null;

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
  const handleSubscribe = async (campaign: ChannelCampaign) => {
    window.open(campaign.channelUrl, '_blank');
    
    // Optimistically update
    if (!subscribedIds.includes(campaign.id)) {
      setSubscribedIds((prev) => [...prev, campaign.id]);
      
      const newCredits = user.credits + campaign.rewardCoins;
      updateUser({ ...user, credits: newCredits });

      setToastMessage(`🎉 You earned +${campaign.rewardCoins} coins! Channel verification recorded.`);
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

      try {
        await apiClient.post('/sub4sub/subscribe', { campaignId: campaign.id });
      } catch (err) {
        // Fallback quiet handle
      }
    }
  };

  // Start watching a video
  const startWatchingVideo = (video: VideoCampaign) => {
    setActiveVideo(video);
    setTimer(video.watchTimeSeconds || 30);
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
    <div className="max-w-xl mx-auto space-y-6 pb-12 text-stone-900 dark:text-stone-100">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-stone-950 font-bold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 fill-stone-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Title & Subtitle */}
      {!activeVideo && (
        <div className="space-y-1 pt-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white">
            Earn coins
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
            Subscribe or watch a video below to earn coins once verified.
          </p>
        </div>
      )}

      {/* Tab Segmented Bar (Subscribe | Watch & Earn) */}
      {!activeVideo && (
        <div className="p-1 rounded-2xl bg-stone-100 dark:bg-[#1a1612] border border-stone-200/80 dark:border-[#262018] flex items-center text-xs font-bold">
          <button
            onClick={() => setActiveTab('subscribe')}
            className={`flex-1 py-2.5 px-4 rounded-xl transition-all text-center ${
              activeTab === 'subscribe'
                ? 'bg-white dark:bg-[#262018] text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Subscribe
          </button>
          <button
            onClick={() => setActiveTab('watch')}
            className={`flex-1 py-2.5 px-4 rounded-xl transition-all text-center ${
              activeTab === 'watch'
                ? 'bg-white dark:bg-[#262018] text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Watch & Earn
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
                const progressPct = Math.min(100, Math.round((channel.subscribedCount / channel.totalTarget) * 100));

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
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-500/20 shrink-0"
                      />
                      <div className="space-y-0.5">
                        <h3 className="font-bold text-stone-900 dark:text-white text-base">
                          {channel.channelName}
                        </h3>
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
                          className="bg-amber-500 h-full rounded-full transition-all duration-300"
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
                          : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20 active:scale-[0.99]'
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
                  className="bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-4 shadow-xs hover:border-amber-500/50 transition-all cursor-pointer space-y-3 group"
                >
                  {/* Thumbnail with Overlay Play Icon */}
                  <div className="relative aspect-video w-full bg-stone-900 rounded-2xl overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.videoTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-amber-500/90 text-stone-950 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 fill-stone-950 ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Title & Channel */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-stone-900 dark:text-white text-sm line-clamp-2 group-hover:text-amber-500 transition-colors leading-snug">
                      {video.videoTitle}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{video.channelName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* ACTIVE VIDEO WATCHING MODE (Screenshot 5) */
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
              <div className="flex justify-center text-amber-500">
                <Coins className="w-5 h-5 fill-amber-500/20" />
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
                className="bg-amber-500 h-full rounded-full transition-all duration-300"
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
              className="w-full py-4 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
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

