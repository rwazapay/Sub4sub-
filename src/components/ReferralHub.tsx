import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import {
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  Coins,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Send,
  Globe,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface ReferralItem {
  id: string;
  referredUserId: string;
  referredUsername: string;
  referredAvatar: string;
  rewardCredits: number;
  status: string;
  createdAt: string;
}

interface ReferralStats {
  referralCode: string;
  referralCount: number;
  totalRewardsEarned: number;
  rewardPerReferral: number;
  referredBy?: string;
  canClaimCode: boolean;
  referralsList: ReferralItem[];
}

export const ReferralHub: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Claim Code Input state
  const [inputCode, setInputCode] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimFeedback, setClaimFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const fetchReferralStats = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/referrals');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load referral stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const referralCode = stats?.referralCode || user?.referralCode || 'SUBLOOP';
  const shareLink = typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${referralCode}` : `https://subloop.co/register?ref=${referralCode}`;
  const shareText = `Join SubLoop to exchange real subscribers, boost your YouTube views, and get 100 free bonus coins with my invite code: ${referralCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SubLoop - Creator Follow 2 Follow & Views Booster',
          text: shareText,
          url: shareLink,
        });
      } catch (err) {
        // User cancelled or share not supported
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSocialShare = (platform: 'whatsapp' | 'telegram' | 'twitter') => {
    let url = '';
    const encodedText = encodeURIComponent(`${shareText}\n${shareLink}`);
    
    if (platform === 'whatsapp') {
      url = `https://api.whatsapp.com/send?text=${encodedText}`;
    } else if (platform === 'telegram') {
      url = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(shareText)}`;
    } else if (platform === 'twitter') {
      url = `https://twitter.com/intent/tweet?text=${encodedText}`;
    }

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleClaimCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setIsClaiming(true);
    setClaimFeedback(null);

    try {
      const res = await apiClient.post('/referrals/claim', {
        referralCode: inputCode.trim(),
      });

      if (res.data.success) {
        setClaimFeedback({
          success: true,
          message: res.data.message || 'Referral code successfully applied! +100 Coins received.',
        });
        setInputCode('');
        
        // Refresh auth user balance & stats
        if (res.data.data?.user) {
          updateUser(res.data.data.user);
        } else {
          apiClient.get('/auth/me').then((r) => {
            if (r.data.success) updateUser(r.data.data.user);
          });
        }
        fetchReferralStats();
      }
    } catch (err: any) {
      setClaimFeedback({
        success: false,
        message: err.response?.data?.message || 'Failed to apply referral code. Please check the code and try again.',
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const referralsList = stats?.referralsList || [];

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-full min-w-0">
      
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-[#1a1510] to-stone-900 border border-stone-800 dark:border-[#262018] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/15 border border-red-500/30 text-red-400 text-xs font-bold">
              <Gift className="w-3.5 h-3.5" />
              <span>Real Creator Referral System</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight break-words">
              Invite Creators & Earn Unlimited Coins 🎁
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm max-w-xl leading-relaxed break-words">
              Share your personal invite link. When a new creator joins, <strong>both of you instantly receive +100 Bonus Coins</strong> to promote channels and boost video views!
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchReferralStats}
              disabled={isLoading}
              className="p-2.5 rounded-2xl bg-stone-900/80 hover:bg-stone-800 border border-stone-700 text-stone-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="Refresh referral stats"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-red-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Quick Link & Code Sharing Box */}
        <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-4 sm:p-5 space-y-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Referral Code Box */}
            <div className="space-y-1.5 min-w-0">
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                Your Unique Invite Code
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0 px-4 py-2.5 bg-stone-900 border border-stone-700 rounded-xl font-mono text-base font-black text-red-400 tracking-wider truncate">
                  {referralCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all border border-stone-700 active:scale-95 shrink-0"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-stone-300" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Shareable Link Box */}
            <div className="space-y-1.5 min-w-0">
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                Your Direct Referral Link
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0 px-3 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-xs font-medium text-stone-300 truncate">
                  {shareLink}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-red-600/25 active:scale-95 shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-white" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* Social One-Click Sharing Buttons */}
          <div className="pt-2 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-stone-400">Share instantly to:</span>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleSocialShare('whatsapp')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={() => handleSocialShare('telegram')}
                className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </button>

              <button
                onClick={() => handleSocialShare('twitter')}
                className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all border border-stone-700 active:scale-95"
              >
                <span>𝕏 Post</span>
              </button>

              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all border border-stone-700 active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>More...</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-5 rounded-3xl bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-xs font-bold">Creators Invited</span>
            <Users className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-3xl font-black text-stone-900 dark:text-white">
            {stats?.referralCount || user?.referralCount || 0}
          </p>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
            Active creator signups
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-xs font-bold">Total Bonus Earned</span>
            <Coins className="w-4 h-4 text-red-500 fill-red-500/20" />
          </div>
          <p className="text-3xl font-black text-red-600 dark:text-red-400">
            +{(stats?.totalRewardsEarned || user?.referralRewardsEarned || 0).toLocaleString()}
          </p>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
            Coins credited to wallet
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-xs font-bold">Reward Per Creator</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-stone-900 dark:text-white">
            +100 Coins
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">
            Instant automatic payout
          </span>
        </div>

      </div>

      {/* Claim a Friend's Referral Code Section (If user was not referred during signup) */}
      {stats?.canClaimCode && (
        <div className="bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-stone-900 dark:text-white font-black text-base">
            <Sparkles className="w-5 h-5 text-red-500" />
            <span>Have a Friend's Referral Code? Claim +100 Coins!</span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            If you were invited by another creator or friend and didn't enter their code during registration, paste it below to receive your +100 welcome referral coins.
          </p>

          <form onSubmit={handleClaimCode} className="flex flex-col sm:flex-row gap-3 max-w-lg">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="e.g. SUB-CREATOR"
              className="flex-1 px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-[#0d0b09] border border-stone-300 dark:border-[#332b21] text-stone-900 dark:text-white placeholder:text-stone-400 font-mono text-sm font-bold uppercase tracking-wider focus:outline-none focus:border-red-500"
            />
            <button
              type="submit"
              disabled={isClaiming || !inputCode.trim()}
              className="px-6 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-red-600/25 flex items-center justify-center gap-1.5 transition-all shrink-0"
            >
              {isClaiming ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Claim +100 Coins</span>
                </>
              )}
            </button>
          </form>

          {claimFeedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
                claimFeedback.success
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
              }`}
            >
              {claimFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              )}
              <span>{claimFeedback.message}</span>
            </div>
          )}
        </div>
      )}

      {/* How the Referral Program Works (3-Step Guide) */}
      <div className="bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-6 space-y-4 shadow-xs">
        <h3 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-red-500" />
          <span>How The Referral Loop Works</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] space-y-2">
            <div className="w-7 h-7 rounded-xl bg-red-600/10 text-red-600 dark:text-red-400 font-black text-xs flex items-center justify-center">
              1
            </div>
            <h4 className="font-bold text-sm text-stone-900 dark:text-white">Share Your Link</h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Post your invite link in YouTube video descriptions, WhatsApp creator communities, Telegram channels, or Twitter.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] space-y-2">
            <div className="w-7 h-7 rounded-xl bg-red-600/10 text-red-600 dark:text-red-400 font-black text-xs flex items-center justify-center">
              2
            </div>
            <h4 className="font-bold text-sm text-stone-900 dark:text-white">Creator Registers</h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              When a creator opens your link, your invite code is automatically applied to their new account upon sign up.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] space-y-2">
            <div className="w-7 h-7 rounded-xl bg-red-600/10 text-red-600 dark:text-red-400 font-black text-xs flex items-center justify-center">
              3
            </div>
            <h4 className="font-bold text-sm text-stone-900 dark:text-white">Both Earn +100 Coins</h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Both you and the new creator instantly receive +100 Bonus Coins in your wallets to launch campaigns and grow!
            </p>
          </div>
        </div>
      </div>

      {/* Referred Friends History List */}
      <div className="bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-red-500" />
            <span>Your Referred Creators ({referralsList.length})</span>
          </h3>
          <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
            Real-time Activity
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-stone-100 dark:bg-[#0d0b09] animate-pulse" />
            ))}
          </div>
        ) : referralsList.length === 0 ? (
          <div className="p-10 text-center space-y-3 bg-stone-50 dark:bg-[#0d0b09] rounded-2xl border border-stone-200 dark:border-[#262018]">
            <Gift className="w-8 h-8 text-stone-400 mx-auto" />
            <p className="text-xs text-stone-500 dark:text-stone-400">
              You haven't invited any creators yet. Share your referral link above to start earning free coins!
            </p>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/25 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Copy Referral Link</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {referralsList.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] flex items-center justify-between gap-3 min-w-0"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={item.referredAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                    alt={item.referredUsername}
                    className="w-10 h-10 rounded-full object-cover border border-stone-200 dark:border-[#332b21] shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white truncate">
                      @{item.referredUsername}
                    </h4>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      Joined {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    +{item.rewardCredits || 100} Coins
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-stone-200 dark:bg-[#1c1813] text-stone-600 dark:text-stone-400">
                    {item.status || 'completed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
