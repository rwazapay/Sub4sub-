import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import {
  Gift,
  Flame,
  Copy,
  CheckCircle2,
  Users,
  Sparkles,
  Coins,
  Share2,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

export const EarnPage: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [claimingStreak, setClaimingStreak] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!user) return null;

  const referralLink = `${window.location.origin}/register?ref=${user.referralCode}`;

  const copyToClipboard = (text: string, isLink: boolean) => {
    navigator.clipboard.writeText(text);
    if (isLink) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleClaimDailyStreak = async () => {
    setClaimingStreak(true);
    setMessage(null);
    try {
      const res = await apiClient.post('/auth/daily-streak-claim');
      if (res.data.success) {
        updateUser(res.data.data.user);
        setMessage(`🎉 +${res.data.data.streakBonus} Credits claimed!`);
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Daily bonus already claimed today.');
    } finally {
      setClaimingStreak(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xl">
        <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
          <Gift className="w-4 h-4" />
          <span>Credits Hub</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Earn Platform Credits & Fuel Your Channel Growth
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
          Accumulate internal credits through daily streaks, discovery activities, profile completion, and creator referral rewards.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (7 cols): Daily Streaks & Quests */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Daily Streak Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <Flame className="w-6 h-6 fill-orange-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-base">Daily Login Bonus</h2>
                  <p className="text-xs text-slate-400">Claim your free credits every 24 hours</p>
                </div>
              </div>

              <span className="font-extrabold text-orange-400 text-lg">{user.streakDays} Days</span>
            </div>

            {message && (
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                {message}
              </div>
            )}

            {user.dailyRewardClaimedToday ? (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Daily login bonus claimed today! Check back tomorrow.</span>
              </div>
            ) : (
              <button
                onClick={handleClaimDailyStreak}
                disabled={claimingStreak}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{claimingStreak ? 'Claiming Bonus...' : 'Claim Today\'s Bonus (+15 Credits)'}</span>
              </button>
            )}
          </div>

          {/* Daily Discovery Quests */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Creator Quests & Milestones
            </h2>

            <div className="space-y-3 text-xs">
              
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-bold text-white">Daily Sub4Sub Goal</p>
                  <p className="text-slate-400">Subscribe or Follow 5 creators today</p>
                  <div className="text-[10px] text-yellow-400 font-semibold">
                    Progress: {user.dailyDiscoveryCountToday} / 5 completed
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold">
                  +50 Credits
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-bold text-white">Launch First Promotion</p>
                  <p className="text-slate-400">Promote your YouTube, TikTok, or Instagram profile</p>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold">
                  +100 Credits
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-bold text-white">Connect 2 Social Channels</p>
                  <p className="text-slate-400">Add verified social links in settings</p>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold">
                  +75 Credits
                </span>
              </div>

            </div>
          </div>

        </div>

        {/* Right Column (5 cols): Referral Program */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase">
                <Users className="w-4 h-4" />
                <span>Invite & Earn</span>
              </div>
              <h2 className="font-bold text-white text-lg">Creator Referral Program</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Invite fellow creators to SubLoop. Both you and your invited creator receive <strong>+100 Credits</strong> instantly when they register using your referral link!
              </p>
            </div>

            {/* Referral Code Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Your Referral Code</label>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between font-mono font-bold text-amber-300 text-sm">
                <span>{user.referralCode}</span>
                <button
                  onClick={() => copyToClipboard(user.referralCode, false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans font-semibold flex items-center gap-1"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Direct Referral Link */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Unique Referral Link</label>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-300 truncate">
                <span className="truncate max-w-[200px]">{referralLink}</span>
                <button
                  onClick={() => copyToClipboard(referralLink, true)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1 shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Share Link'}</span>
                </button>
              </div>
            </div>

            {/* Referral Stats */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
              <div>
                <p className="text-slate-400">Total Referred Creators</p>
                <p className="font-extrabold text-white text-base">{user.referralCount}</p>
              </div>

              <div>
                <p className="text-slate-400">Referral Rewards Earned</p>
                <p className="font-extrabold text-amber-300 text-base">+{user.referralRewardsEarned} Credits</p>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
