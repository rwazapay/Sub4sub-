import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { Promotion } from '../types';
import {
  Coins,
  Flame,
  Compass,
  Megaphone,
  Eye,
  Award,
  TrendingUp,
  Plus,
  Zap,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Gift,
  Repeat,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isClaimingStreak, setIsClaimingStreak] = useState(false);
  const [streakClaimMessage, setStreakClaimMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      apiClient
        .get('/promotions')
        .then((res) => {
          if (res.data.success) {
            setPromotions(res.data.data.promotions || []);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  if (!user) return null;

  const handleClaimDailyStreak = async () => {
    setIsClaimingStreak(true);
    try {
      const res = await apiClient.post('/auth/daily-streak-claim');
      if (res.data.success) {
        updateUser(res.data.data.user);
        setStreakClaimMessage(`🎉 +${res.data.data.streakBonus} Credits claimed!`);
        setTimeout(() => setStreakClaimMessage(null), 4000);
      }
    } catch (err: any) {
      setStreakClaimMessage(err.response?.data?.message || 'Failed to claim bonus.');
      setTimeout(() => setStreakClaimMessage(null), 4000);
    } finally {
      setIsClaimingStreak(false);
    }
  };

  const activePromos = promotions.filter((p) => p.status === 'active');

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Level {user.level} Creator
              </span>
              <span className="text-xs font-semibold text-slate-400">@{user.username}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome back, {user.displayName}! 👋
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              Discover independent creators, earn platform credits, and boost your channel’s promotional reach across the network.
            </p>
          </div>

          {/* Daily Streak Card */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 shrink-0 sm:min-w-[220px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                <span>Daily Streak</span>
              </span>
              <span className="font-extrabold text-orange-400 text-sm">{user.streakDays} Days</span>
            </div>

            {user.dailyRewardClaimedToday ? (
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[11px] font-bold text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Bonus Claimed Today</span>
              </div>
            ) : (
              <button
                onClick={handleClaimDailyStreak}
                disabled={isClaimingStreak}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95"
              >
                {isClaimingStreak ? 'Claiming...' : 'Claim Daily Login Bonus'}
              </button>
            )}

            {streakClaimMessage && (
              <p className="text-[10px] text-amber-300 font-semibold text-center">{streakClaimMessage}</p>
            )}
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Link
            to="/discover"
            className="px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-md shadow-yellow-500/20 active:scale-95"
          >
            <Repeat className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>Sub4Sub Network 🔁</span>
          </Link>

          <Link
            to="/promote"
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 border border-amber-200 dark:border-slate-800 transition-all"
          >
            <Plus className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <span>Launch Promotion</span>
          </Link>

          <Link
            to="/wallet"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all"
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <span>Buy Credits</span>
          </Link>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Credit Balance</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white">{user.credits.toLocaleString()}</p>
          <span className="text-[10px] text-slate-500">Total Earned: {user.totalCreditsEarned.toLocaleString()}</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Active Campaigns</span>
            <Megaphone className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white">{activePromos.length}</p>
          <span className="text-[10px] text-slate-500">Total Promotions: {promotions.length}</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Reputation Rating</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">{user.reputation}/100</p>
          <span className="text-[10px] text-emerald-400 font-semibold">Community Verified</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Referrals Earned</span>
            <Gift className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white">{user.referralCount}</p>
          <span className="text-[10px] text-slate-500">+{user.referralRewardsEarned} Credits Bonus</span>
        </div>

      </div>

      {/* Grid: Active Campaigns (Left) & Quick Discover Recommendations (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Active Promotions (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-indigo-400" />
              Your Active Promotions
            </h2>
            <Link to="/promotions" className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activePromos.length === 0 ? (
            <div className="p-8 text-center space-y-3 bg-slate-950/50 rounded-2xl border border-slate-800/80">
              <Zap className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">You don't have any active promotions running right now.</p>
              <Link
                to="/promote"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Launch First Campaign</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activePromos.map((promo) => {
                const percentSpent = Math.min(100, Math.round((promo.spentCredits / promo.budgetCredits) * 100));

                return (
                  <div key={promo.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 uppercase">
                            {promo.platform}
                          </span>
                          <h3 className="font-bold text-white text-sm truncate max-w-xs">{promo.title}</h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{promo.description}</p>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                        Active
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Budget Spent: {promo.spentCredits} / {promo.budgetCredits} Credits</span>
                        <span className="font-bold text-indigo-400">{percentSpent}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                          style={{ width: `${percentSpent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                      <span>Impressions: <strong>{promo.impressions}</strong></span>
                      <span>Discoveries: <strong>{promo.uniqueDiscoveries}</strong></span>
                      <Link to={`/promotions/${promo.id}`} className="text-indigo-400 font-bold hover:underline">
                        View Analytics →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Fast Discovery & Earn Prompt (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-400" />
                Earn Credits Now
              </h2>
              <span className="text-xs text-amber-400 font-bold">+10 Credits / Visit</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Explore independent creator channels in the discovery feed. Completing genuine discovery activities grants you platform credits.
            </p>

            <Link
              to="/discover"
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Launch Discovery Feed</span>
            </Link>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
              <Gift className="w-4 h-4" />
              <span>Your Referral Code</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between font-mono font-bold text-amber-300 text-sm">
              <span>{user.referralCode}</span>
              <span className="text-[10px] text-slate-400 font-sans font-normal">+100 Credits per invite</span>
            </div>
            <Link to="/earn" className="text-xs text-indigo-400 hover:underline font-semibold block text-right">
              View Referral Details →
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
};
