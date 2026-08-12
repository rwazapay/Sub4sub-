import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import {
  Users,
  Repeat,
  ExternalLink,
  CheckCircle2,
  Coins,
  Sparkles,
  User,
  Search,
  Globe2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface CreatorSub4SubItem {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  country: string;
  creatorCategory: string;
  reputation: number;
  level: number;
  primaryChannel?: {
    platform: string;
    channelName: string;
    url: string;
  };
  sub4subState: 'none' | 'pending_their_sub_back' | 'needs_my_sub_back' | 'mutual';
  requestId?: string;
}

export const Sub4SubHub: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'feed' | 'incoming' | 'mutual'>('feed');
  const [creators, setCreators] = useState<CreatorSub4SubItem[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [mutualSubs, setMutualSubs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ success: boolean; text: string } | null>(null);

  const fetchSub4SubData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Sub4Sub Feed
      const params = new URLSearchParams();
      if (platformFilter !== 'All') params.append('platform', platformFilter);
      if (searchQuery) params.append('search', searchQuery);

      const [feedRes, requestsRes] = await Promise.all([
        apiClient.get(`/sub4sub/feed?${params.toString()}`),
        apiClient.get('/sub4sub/my-requests'),
      ]);

      if (feedRes.data.success) {
        setCreators(feedRes.data.data.creators || []);
      }

      if (requestsRes.data.success) {
        setPendingRequests(requestsRes.data.data.pendingRequests || []);
        setMutualSubs(requestsRes.data.data.mutualSubs || []);
      }
    } catch (err) {
      console.error('Failed to load Sub4Sub data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSub4SubData();
  }, [platformFilter, searchQuery]);

  // Anti-Fraud Task Challenge Modal State
  const [activeChallenge, setActiveChallenge] = useState<{
    verificationToken: string;
    challengeCode: number;
    minWaitSeconds: number;
    countdown: number;
    targetName: string;
    targetUrl: string;
    targetUserId?: string;
    platform: string;
    requestId?: string;
  } | null>(null);
  const [isVerifyingClaim, setIsVerifyingClaim] = useState(false);

  // Countdown timer effect for anti-fraud verification
  useEffect(() => {
    if (!activeChallenge || activeChallenge.countdown <= 0) return;
    const timer = setInterval(() => {
      setActiveChallenge((prev) => {
        if (!prev) return null;
        if (prev.countdown <= 1) return { ...prev, countdown: 0 };
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeChallenge]);

  // Initiate Anti-Fraud Task Verification Flow
  const handleStartTaskChallenge = async (
    targetUserId: string,
    targetName: string,
    channelUrl: string,
    platform: string,
    requestId?: string
  ) => {
    setProcessingId(targetUserId);
    setFeedback(null);

    try {
      const res = await apiClient.post('/sub4sub/start-challenge', {
        targetUserId,
        platform,
        channelUrl,
      });

      if (res.data.success) {
        const { verificationToken, challengeCode, minWaitSeconds } = res.data.data;

        // Open channel URL in separate window
        window.open(channelUrl, '_blank', 'noopener,noreferrer');

        // Launch Anti-Fraud Modal with countdown timer
        setActiveChallenge({
          verificationToken,
          challengeCode,
          minWaitSeconds,
          countdown: minWaitSeconds,
          targetName,
          targetUrl: channelUrl,
          targetUserId,
          platform,
          requestId,
        });
      }
    } catch (err: any) {
      setFeedback({
        success: false,
        text: err.response?.data?.message || 'Could not start task verification challenge.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Submit Anti-Fraud Task Claim to Server Engine
  const handleVerifyAndClaimTask = async () => {
    if (!activeChallenge) return;

    setIsVerifyingClaim(true);
    setFeedback(null);

    try {
      const res = await apiClient.post('/sub4sub/verify-claim', {
        verificationToken: activeChallenge.verificationToken,
        challengeCode: activeChallenge.challengeCode,
        targetUserId: activeChallenge.targetUserId,
        platform: activeChallenge.platform,
        channelUrl: activeChallenge.targetUrl,
      });

      if (res.data.success) {
        setFeedback({
          success: true,
          text: res.data.message || '🛡️ Anti-Fraud Audit Passed! +25 Credits added to your account.',
        });

        if (user && res.data.data.newBalance !== undefined) {
          updateUser({
            ...user,
            credits: res.data.data.newBalance,
            riskScore: res.data.data.riskScore ?? user.riskScore,
          });
        }

        setActiveChallenge(null);
        fetchSub4SubData();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Anti-fraud audit failed. Please try again.';
      setFeedback({
        success: false,
        text: `⚠️ ${errorMsg}`,
      });
    } finally {
      setIsVerifyingClaim(false);
    }
  };

  // Subscribe to creator and request Sub Back
  const handleSubscribeAndRequestSubBack = async (creator: CreatorSub4SubItem) => {
    if (!creator.primaryChannel?.url) return;
    await handleStartTaskChallenge(
      creator.id,
      creator.displayName,
      creator.primaryChannel.url,
      creator.primaryChannel.platform
    );
  };

  // Sub Back to a request
  const handleSubBack = async (request: any) => {
    const channelUrl = request.followerChannelUrl || `https://youtube.com/@${request.followerUsername}`;
    await handleStartTaskChallenge(
      request.followerUserId,
      request.followerDisplayName,
      channelUrl,
      request.followerPlatform || 'YouTube',
      request.id
    );
  };

  const platforms = ['All', 'YouTube', 'TikTok', 'Instagram', 'Facebook', 'X'];

  return (
    <div className="space-y-6">
      
      {/* Rules & Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-yellow-400/20 to-amber-500/10 border border-yellow-500/40 rounded-3xl p-6 space-y-3 relative overflow-hidden shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300 font-extrabold text-xs uppercase tracking-wider">
              <Repeat className="w-4 h-4" />
              <span>Real Sub4Sub & Follow4Follow Network</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Subscribe to Creators & Get Followed Back 🤝
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 max-w-xl">
              1. Subscribe to a channel (+20 Credits). <br />
              2. They receive a notification to Sub Back (+30 Credits). <br />
              3. Both creators build genuine, permanent audience loops!
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-yellow-400/40 text-center min-w-[90px]">
              <p className="text-lg font-black text-amber-600 dark:text-yellow-400">{pendingRequests.length}</p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Sub Back Queue</p>
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-yellow-400/40 text-center min-w-[90px]">
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{mutualSubs.length}</p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Mutual Pairs</p>
            </div>
          </div>
        </div>

        {/* Anti-Unsub Guarantee */}
        <div className="pt-2 border-t border-yellow-500/30 text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
          <span>Strict Sub4Sub Anti-Cheat Policy: Unsubscribing causes credit forfeiture & account strikes.</span>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 ${
            feedback.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* Sub4Sub Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-amber-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'feed'
                ? 'bg-yellow-400 text-slate-950 shadow-md shadow-yellow-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Discover Sub4Sub Creators</span>
          </button>

          <button
            onClick={() => setActiveTab('incoming')}
            className={`relative px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'incoming'
                ? 'bg-yellow-400 text-slate-950 shadow-md shadow-yellow-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Repeat className="w-4 h-4" />
            <span>Sub Back Queue</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-bold animate-pulse">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('mutual')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'mutual'
                ? 'bg-yellow-400 text-slate-950 shadow-md shadow-yellow-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mutual Pairs 🤝 ({mutualSubs.length})</span>
          </button>
        </div>

        {/* Platform Selector Filter */}
        {activeTab === 'feed' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              {platforms.map((p) => (
                <option key={p} value={p}>
                  {p === 'All' ? 'All Platforms' : p}
                </option>
              ))}
            </select>

            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* Tab Content 1: Sub4Sub Feed */}
      {activeTab === 'feed' && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-44 rounded-2xl bg-amber-100/50 dark:bg-slate-900 animate-pulse" />
              ))}
            </div>
          ) : creators.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-800 rounded-3xl space-y-2">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-800 dark:text-slate-200">No creators found matching search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {creators.map((creator) => (
                <div
                  key={creator.id}
                  className="bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-slate-800 hover:border-yellow-400/80 rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={creator.avatar}
                          alt={creator.displayName}
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-yellow-400/50"
                        />
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[140px]">
                            {creator.displayName}
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">@{creator.username}</p>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-yellow-400/20 text-yellow-800 dark:text-yellow-300 border border-yellow-400/40">
                        {creator.primaryChannel?.platform || 'YouTube'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {creator.bio || 'Digital content creator seeking mutual subscribers.'}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {creator.creatorCategory}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Globe2 className="w-3 h-3" />
                        {creator.country}
                      </span>
                    </div>

                  </div>

                  {/* Sub4Sub Action */}
                  <div className="pt-3 border-t border-amber-100 dark:border-slate-800/80 flex items-center gap-2">
                    <Link
                      to={`/creators/${creator.username}`}
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                      title="View Profile"
                    >
                      <User className="w-4 h-4" />
                    </Link>

                    {creator.sub4subState === 'mutual' ? (
                      <div className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs text-center flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Mutual Sub4Sub Partner 🤝</span>
                      </div>
                    ) : creator.sub4subState === 'pending_their_sub_back' ? (
                      <div className="flex-1 py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-xs text-center flex items-center justify-center gap-1.5">
                        <Repeat className="w-4 h-4 text-yellow-600 animate-spin" />
                        <span>Sub Back Pending ⏳</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSubscribeAndRequestSubBack(creator)}
                        disabled={processingId === creator.id}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs shadow-md shadow-yellow-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Repeat className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>
                          {processingId === creator.id
                            ? 'Opening Channel...'
                            : 'Sub & Request Sub Back (+20 Credits) 🔁'}
                        </span>
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab Content 2: Incoming Sub Back Queue */}
      {activeTab === 'incoming' && (
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-800 rounded-3xl space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Your Sub Back queue is clear!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                When other creators subscribe to your channel on SubLoop, they will appear here so you can Sub Back and earn +30 Credits!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white dark:bg-slate-900 border-2 border-yellow-400 rounded-2xl p-5 space-y-4 shadow-md flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={req.followerAvatar}
                      alt={req.followerDisplayName}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-yellow-400"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{req.followerDisplayName}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-yellow-400/20 text-yellow-800 dark:text-yellow-300">
                          {req.followerPlatform}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">@{req.followerUsername}</p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 font-bold">
                        Subscribed to your channel & waiting for Sub Back!
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-amber-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <a
                      href={req.followerChannelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                      title="View Channel"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => handleSubBack(req)}
                      disabled={processingId === req.id}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-slate-950 font-black text-xs shadow-md shadow-yellow-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{processingId === req.id ? 'Connecting...' : 'Sub Back Now (+30 Credits) 🔁'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: Mutual Pairs */}
      {activeTab === 'mutual' && (
        <div className="space-y-4">
          {mutualSubs.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-800 rounded-3xl space-y-2">
              <Repeat className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">No mutual Sub4Sub partners yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Subscribe to creators in the feed above to request Sub Backs and establish mutual channels!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mutualSubs.map((m) => {
                const isFollower = m.followerUserId === user?.id;
                const partnerName = isFollower ? m.targetDisplayName : m.followerDisplayName;
                const partnerUsername = isFollower ? m.targetUsername : m.followerUsername;
                const partnerAvatar = isFollower ? m.targetAvatar : m.followerAvatar;
                const partnerPlatform = isFollower ? m.targetPlatform : m.followerPlatform;
                const partnerUrl = isFollower ? m.targetChannelUrl : m.followerChannelUrl;

                return (
                  <div
                    key={m.id}
                    className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 space-y-3 shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={partnerAvatar}
                        alt={partnerName}
                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-500/40"
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[120px]">
                          {partnerName}
                        </h4>
                        <p className="text-[10px] text-slate-500">@{partnerUsername}</p>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          Mutual Sub4Sub 🤝
                        </span>
                      </div>
                    </div>

                    <a
                      href={partnerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                      title="Visit Channel"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Anti-Fraud Verification Modal Overlay */}
      {activeChallenge && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border-2 border-yellow-400 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative text-slate-900 dark:text-white">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-yellow-400/20 border-2 border-yellow-400 flex items-center justify-center mx-auto text-yellow-600 dark:text-yellow-400">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black">Anti-Fraud Task Audit</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Verifying genuine engagement for <span className="font-bold text-amber-800 dark:text-amber-300">@{activeChallenge.targetName}</span>
              </p>
            </div>

            {/* Countdown Box */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-slate-800/80 border border-amber-200 dark:border-slate-700 text-center space-y-2">
              <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                {activeChallenge.countdown > 0
                  ? `Please stay on the channel and complete the action...`
                  : `✅ Minimum verification stay time completed!`}
              </p>

              <div className="flex items-center justify-center gap-2">
                <div className="text-3xl font-black text-amber-800 dark:text-yellow-400 font-mono tracking-wider">
                  00:0{activeChallenge.countdown}
                </div>
              </div>

              {/* Security Details */}
              <div className="pt-2 border-t border-amber-200/60 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500">
                <div>Security Code: <span className="font-mono text-slate-800 dark:text-slate-200">#{activeChallenge.challengeCode}</span></div>
                <div>Risk Gate: <span className="text-emerald-600">PASS (0%)</span></div>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleVerifyAndClaimTask}
                disabled={activeChallenge.countdown > 0 || isVerifyingClaim}
                className="w-full py-3.5 px-4 rounded-xl bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-yellow-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                <span>
                  {isVerifyingClaim
                    ? 'Auditing Task Fraud Checks...'
                    : activeChallenge.countdown > 0
                    ? `Verification Unlocks in ${activeChallenge.countdown}s`
                    : 'Verify Task & Claim +25 Credits'}
                </span>
              </button>

              <button
                onClick={() => setActiveChallenge(null)}
                disabled={isVerifyingClaim}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
              >
                Cancel Challenge
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-500">
              Anti-Fraud Engine protects creators against rapid bot clicks and unsubscription spam.
            </p>

          </div>
        </div>
      )}

    </div>
  );
};
