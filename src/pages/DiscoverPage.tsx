import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { Promotion } from '../types';
import { Sub4SubHub } from '../components/Sub4SubHub';
import { YouTubeEmbedPlayer } from '../components/YouTubeEmbedPlayer';
import {
  Compass,
  Search,
  Filter,
  Coins,
  ExternalLink,
  CheckCircle2,
  X,
  Sparkles,
  Zap,
  Globe2,
  ShieldCheck,
  User,
} from 'lucide-react';

export const DiscoverPage: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [viewMode, setViewMode] = useState<'sub4sub' | 'promotions'>('sub4sub');
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected promotion for discovery modal
  const [activeDiscoveryPromo, setActiveDiscoveryPromo] = useState<Promotion | null>(null);
  const [hasVisitedChannel, setHasVisitedChannel] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ success: boolean; text: string } | null>(null);

  const categories = [
    'All',
    'Technology',
    'Education',
    'Gaming',
    'Music',
    'Comedy',
    'Lifestyle',
    'Business',
    'Fashion',
    'Sports',
    'Travel',
    'Documentary',
  ];

  const platforms = ['All', 'YouTube', 'TikTok', 'Instagram', 'Facebook', 'X'];

  const countries = ['All', 'Rwanda', 'Kenya', 'Nigeria', 'Ghana', 'South Africa', 'Uganda', 'Global'];

  const fetchDiscoverFeed = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedPlatform !== 'All') params.append('platform', selectedPlatform);
      if (selectedCountry !== 'All') params.append('country', selectedCountry);
      if (searchQuery) params.append('search', searchQuery);

      const res = await apiClient.get(`/discover?${params.toString()}`);
      if (res.data.success) {
        setPromotions(res.data.data.promotions || []);
      }
    } catch (err) {
      console.error('Failed to load discovery feed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscoverFeed();
  }, [selectedCategory, selectedPlatform, selectedCountry, searchQuery]);

  const handleOpenDiscoveryModal = (promo: Promotion) => {
    setActiveDiscoveryPromo(promo);
    setHasVisitedChannel(false);
    setFeedbackMsg(null);
  };

  const handleVisitExternalChannel = () => {
    if (activeDiscoveryPromo) {
      window.open(activeDiscoveryPromo.channelUrl, '_blank', 'noopener,noreferrer');
      setHasVisitedChannel(true);
    }
  };

  const handleCompleteDiscoveryActivity = async () => {
    if (!activeDiscoveryPromo) return;

    setIsCompleting(true);
    setFeedbackMsg(null);

    try {
      const res = await apiClient.post(`/discover/${activeDiscoveryPromo.id}/complete`);
      if (res.data.success) {
        setFeedbackMsg({
          success: true,
          text: res.data.message || '🎉 Discovery activity completed! Credits added to your balance.',
        });

        // Update local user state
        if (user) {
          updateUser({
            ...user,
            credits: res.data.data.newBalance,
            dailyDiscoveryCountToday: res.data.data.dailyCountToday,
          });
        }

        setTimeout(() => {
          setActiveDiscoveryPromo(null);
          fetchDiscoverFeed();
        }, 1800);
      }
    } catch (err: any) {
      setFeedbackMsg({
        success: false,
        text: err.response?.data?.message || 'Could not complete discovery.',
      });
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-yellow-400/20 to-amber-500/10 border border-yellow-500/40 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300 font-bold text-xs uppercase tracking-wider">
              <Compass className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span>Sub4Sub & Discovery Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Real Sub4Sub Network & Creator Discovery
            </h1>
            <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Subscribe to creators on YouTube, TikTok, Instagram, and X to request reciprocal Sub Backs, earn credits, and grow your genuine audience!
            </p>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-yellow-400/50 shrink-0">
            <button
              onClick={() => setViewMode('sub4sub')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                viewMode === 'sub4sub'
                  ? 'bg-yellow-400 text-slate-950 shadow-md shadow-yellow-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🔁 Sub4Sub Network
            </button>
            <button
              onClick={() => setViewMode('promotions')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                viewMode === 'promotions'
                  ? 'bg-yellow-400 text-slate-950 shadow-md shadow-yellow-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              📢 Promoted Campaigns
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'sub4sub' ? (
        <Sub4SubHub />
      ) : (
        <>
          {/* Filter & Search Bar */}
          <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-md">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Search Input (5 cols) */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search creators, titles, handles..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Platform Selector (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Platforms</option>
              {platforms.filter((p) => p !== 'All').map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Country Selector (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Countries</option>
              {countries.filter((c) => c !== 'All').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Category Selector (3 cols) */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Categories</option>
              {categories.filter((cat) => cat !== 'All').map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* Discovery Cards Feed Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : promotions.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-slate-900 border border-slate-800 rounded-3xl">
          <Zap className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="font-bold text-white text-base">No creator promotions match your filters</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try resetting your category or platform filters to see more creators.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSelectedPlatform('All');
              setSelectedCountry('All');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs hover:bg-slate-700"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 space-y-4 transition-all hover:shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                
                {/* Header Info */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={promo.creatorAvatar}
                      alt={promo.creatorDisplayName}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/30"
                    />
                    <div>
                      <h3 className="font-bold text-white text-sm truncate max-w-[150px]">
                        {promo.creatorDisplayName}
                      </h3>
                      <p className="text-[11px] text-slate-400">@{promo.creatorUsername}</p>
                    </div>
                  </div>

                  {promo.isSponsored ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      SPONSORED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {promo.platform}
                    </span>
                  )}
                </div>

                {/* Campaign Title & Bio */}
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-100 text-sm line-clamp-1">{promo.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{promo.description}</p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                    {promo.creatorCategory}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 flex items-center gap-1">
                    <Globe2 className="w-3 h-3" />
                    {promo.country}
                  </span>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <Link
                  to={`/creators/${promo.creatorUsername}`}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  title="View Profile"
                >
                  <User className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => handleOpenDiscoveryModal(promo)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Coins className="w-3.5 h-3.5 text-amber-300 fill-amber-300/30" />
                  <span>Discover (+{promo.rewardPerDiscovery} Credits)</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Discovery Modal Popup */}
      {activeDiscoveryPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative text-slate-100">
            
            <button
              onClick={() => setActiveDiscoveryPromo(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Creator Discovery Activity
              </span>
              <h2 className="text-xl font-black text-white">
                Discover {activeDiscoveryPromo.creatorDisplayName}
              </h2>
              <p className="text-xs text-slate-400">
                Explore this creator’s content on {activeDiscoveryPromo.platform} and return to claim your credits.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={activeDiscoveryPromo.creatorAvatar}
                  alt={activeDiscoveryPromo.creatorDisplayName}
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/40"
                />
                <div>
                  <p className="font-bold text-white text-sm">{activeDiscoveryPromo.creatorDisplayName}</p>
                  <p className="text-xs text-slate-400">@{activeDiscoveryPromo.creatorUsername}</p>
                </div>
              </div>

              <span className="font-extrabold text-amber-300 text-sm flex items-center gap-1">
                <Coins className="w-4 h-4 text-amber-400" />
                +{activeDiscoveryPromo.rewardPerDiscovery} PTS
              </span>
            </div>

            {/* Creative Commons Video Embed if available */}
            {activeDiscoveryPromo.videoEmbedUrl && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Watch Creative Commons (CC-BY) Video:
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {activeDiscoveryPromo.licenseType || 'CC BY 4.0'}
                  </span>
                </div>
                <YouTubeEmbedPlayer
                  videoUrlOrId={activeDiscoveryPromo.videoEmbedUrl}
                  title={activeDiscoveryPromo.title}
                />
              </div>
            )}

            {/* Step 1: Open Channel Link or Detailed Campaign Page */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">1. Open Creator Channel or Track Stay Timer:</span>
                {hasVisitedChannel && (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Visited
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleVisitExternalChannel}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold border border-slate-700 text-xs flex items-center justify-center gap-1.5"
                >
                  <span>Subscribe Channel</span>
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                </button>

                <Link
                  to={`/promotions/${activeDiscoveryPromo.id}`}
                  className="py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-extrabold border border-amber-500/30 text-xs flex items-center justify-center gap-1.5"
                >
                  <span>⏱️ Stay Timer & Analytics</span>
                </Link>
              </div>
            </div>

            {/* Feedback alert */}
            {feedbackMsg && (
              <div className={`p-3 rounded-xl border text-xs font-semibold ${
                feedbackMsg.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}>
                {feedbackMsg.text}
              </div>
            )}

            {/* Step 2: Complete Activity Button */}
            <button
              onClick={handleCompleteDiscoveryActivity}
              disabled={isCompleting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isCompleting ? 'Claiming Reward...' : `Confirm & Earn +${activeDiscoveryPromo.rewardPerDiscovery} Credits`}</span>
            </button>

          </div>
        </div>
      )}
        </>
      )}

    </div>
  );
};
