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
  RefreshCw,
  BarChart3,
  Users,
  ShieldCheck,
  PlayCircle,
  ArrowUpRight,
} from 'lucide-react';
import { TourTriggerButton, useOnboardingTour } from '../components/OnboardingWalkthrough';
import { DailyRewardCard } from '../components/DailyRewardCard';

export const DashboardPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [isClaimingStreak, setIsClaimingStreak] = useState(false);
  const [streakClaimMessage, setStreakClaimMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async (showLoadingState = true) => {
    if (showLoadingState) {
      setIsLoadingAnalytics(true);
    }
    try {
      const res = await apiClient.get('/promotions');
      if (res.data.success) {
        setPromotions(res.data.data.promotions || []);
      }
    } catch {
      // Fallback sample promotions if backend takes time
      setPromotions([]);
    } finally {
      // Small graceful buffer for ultra-smooth perceived performance transition
      setTimeout(() => {
        setIsLoadingAnalytics(false);
        setIsRefreshing(false);
      }, 350);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData(true);
    }
  }, [user]);

  if (!user) return null;

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData(true);
  };

  const handleClaimDailyStreak = async () => {
    setIsClaimingStreak(true);
    try {
      const res = await apiClient.post('/auth/daily-streak-claim');
      if (res.data.success) {
        if (res.data.data?.user) {
          updateUser(res.data.data.user);
        } else {
          updateUser({
            ...user,
            dailyRewardClaimedToday: true,
            credits: user.credits + (res.data.data?.streakBonus || 25),
          });
        }
        setStreakClaimMessage(`🎉 +${res.data.data?.streakBonus || 25} Coins claimed!`);
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
      <div className="bg-gradient-to-r from-stone-900 via-[#1c1813] to-stone-900 border border-stone-800 dark:border-[#262018] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl relative overflow-hidden">
        
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Level {user.level} Creator
              </span>
              <span className="text-xs font-semibold text-stone-400">@{user.username}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 font-medium hidden sm:inline-block">
                {user.country || 'Rwanda'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome back, {user.displayName}! 👋
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              Discover independent creators, earn platform coins, and boost your channel’s promotional reach across the verified exchange network.
            </p>
          </div>

          {/* Daily Streak Reward Card */}
          <DailyRewardCard variant="compact" />
        </div>

        {/* Action Buttons Bar */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <Link
              id="tour-dashboard-earn"
              to="/earn"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/20 active:scale-95"
            >
              <Repeat className="w-4 h-4 text-stone-950 stroke-[2.5]" />
              <span>Earn & Exchange Hub 🔁</span>
            </Link>

            <Link
              id="tour-dashboard-promote"
              to="/promote"
              className="px-4 py-2.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-200 font-bold text-xs flex items-center gap-2 border border-stone-700 dark:border-[#332b21] transition-all"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Launch Campaign</span>
            </Link>

            <Link
              id="tour-dashboard-wallet"
              to="/wallet"
              className="px-4 py-2.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center gap-2 border border-stone-700 dark:border-[#332b21] transition-all"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Coins & Wallet</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <TourTriggerButton variant="badge" />

            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoadingAnalytics}
              className="px-3 py-2 rounded-xl bg-stone-900/60 hover:bg-stone-800 border border-stone-700/80 text-stone-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Refresh dashboard analytics data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Metrics Grid (With Shimmer / Skeleton States) */}
      {isLoadingAnalytics ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] space-y-3 animate-shimmer"
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 bg-stone-200 dark:bg-[#262018] rounded-md" />
                <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-[#262018]" />
              </div>
              <div className="h-8 w-24 bg-stone-200 dark:bg-[#262018] rounded-lg" />
              <div className="h-2.5 w-32 bg-stone-100 dark:bg-[#201b16] rounded-md" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="p-5 rounded-2xl bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] space-y-1 shadow-sm hover:border-amber-500/40 transition-colors">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
              <span className="text-xs font-semibold">Coins Balance</span>
              <Coins className="w-4 h-4 text-amber-500 fill-amber-500/20" />
            </div>
            <p className="text-2xl font-black text-stone-900 dark:text-white">{user.credits.toLocaleString()}</p>
            <span className="text-[10px] text-stone-400 dark:text-stone-500 block">
              Total Earned: {user.totalCreditsEarned.toLocaleString()}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] space-y-1 shadow-sm hover:border-amber-500/40 transition-colors">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
              <span className="text-xs font-semibold">Active Campaigns</span>
              <Megaphone className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-stone-900 dark:text-white">{activePromos.length}</p>
            <span className="text-[10px] text-stone-400 dark:text-stone-500 block">
              Total Created: {promotions.length}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] space-y-1 shadow-sm hover:border-amber-500/40 transition-colors">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
              <span className="text-xs font-semibold">Reputation Score</span>
              <Award className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-stone-900 dark:text-white">{user.reputation}/100</p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
              Community Verified
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] space-y-1 shadow-sm hover:border-amber-500/40 transition-colors">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
              <span className="text-xs font-semibold">Referrals Earned</span>
              <Gift className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-black text-stone-900 dark:text-white">{user.referralCount}</p>
            <span className="text-[10px] text-stone-400 dark:text-stone-500 block">
              +{user.referralRewardsEarned} Coins Bonus
            </span>
          </div>

        </div>
      )}

      {/* Grid: Active Campaigns (Left) & Quick Discover Recommendations (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Active Promotions (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-500" />
              Your Active Promotions
            </h2>
            <Link to="/promotions" className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoadingAnalytics ? (
            /* Shimmer Skeleton for Promotions list */
            <div className="space-y-3">
              {[1, 2].map((idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] space-y-3 animate-shimmer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-14 bg-stone-200 dark:bg-[#262018] rounded-md" />
                        <div className="h-4 w-40 bg-stone-200 dark:bg-[#262018] rounded-md" />
                      </div>
                      <div className="h-3 w-3/4 bg-stone-100 dark:bg-[#201b16] rounded-md" />
                    </div>
                    <div className="h-5 w-16 bg-stone-200 dark:bg-[#262018] rounded-full" />
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between">
                      <div className="h-3 w-28 bg-stone-200 dark:bg-[#262018] rounded-md" />
                      <div className="h-3 w-8 bg-stone-200 dark:bg-[#262018] rounded-md" />
                    </div>
                    <div className="w-full h-2 bg-stone-200 dark:bg-[#262018] rounded-full overflow-hidden" />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-[#201b16]">
                    <div className="h-3 w-24 bg-stone-200 dark:bg-[#262018] rounded-md" />
                    <div className="h-3 w-20 bg-stone-200 dark:bg-[#262018] rounded-md" />
                    <div className="h-3 w-24 bg-stone-200 dark:bg-[#262018] rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : activePromos.length === 0 ? (
            <div className="p-8 text-center space-y-3 bg-stone-50 dark:bg-[#0d0b09] rounded-2xl border border-stone-200 dark:border-[#262018]">
              <Zap className="w-8 h-8 text-stone-400 dark:text-stone-600 mx-auto" />
              <p className="text-xs text-stone-500 dark:text-stone-400">You don't have any active promotions running right now.</p>
              <Link
                to="/promote"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
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
                  <div key={promo.id} className="p-4 rounded-2xl bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 uppercase">
                            {promo.platform}
                          </span>
                          <h3 className="font-bold text-stone-900 dark:text-white text-sm truncate max-w-xs">{promo.title}</h3>
                        </div>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-1">{promo.description}</p>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                        Active
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[11px] text-stone-500 dark:text-stone-400">
                        <span>Budget Spent: {promo.spentCredits} / {promo.budgetCredits} Coins</span>
                        <span className="font-bold text-amber-500">{percentSpent}%</span>
                      </div>
                      <div className="w-full h-2 bg-stone-200 dark:bg-[#201b16] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-300"
                          style={{ width: `${percentSpent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-200 dark:border-[#201b16]">
                      <span>Impressions: <strong>{promo.impressions}</strong></span>
                      <span>Discoveries: <strong>{promo.uniqueDiscoveries}</strong></span>
                      <Link to={`/promotions/${promo.id}`} className="text-amber-600 dark:text-amber-400 font-bold hover:underline">
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
          
          {isLoadingAnalytics ? (
            /* Shimmer Skeleton for side widgets */
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-6 space-y-4 animate-shimmer">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-32 bg-stone-200 dark:bg-[#262018] rounded-md" />
                  <div className="h-4 w-20 bg-stone-200 dark:bg-[#262018] rounded-md" />
                </div>
                <div className="space-y-2">
                  <div className="h-3.5 w-full bg-stone-100 dark:bg-[#201b16] rounded-md" />
                  <div className="h-3.5 w-4/5 bg-stone-100 dark:bg-[#201b16] rounded-md" />
                </div>
                <div className="h-10 w-full bg-stone-200 dark:bg-[#262018] rounded-2xl" />
              </div>

              <div className="bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-6 space-y-3 animate-shimmer">
                <div className="h-4 w-28 bg-stone-200 dark:bg-[#262018] rounded-md" />
                <div className="h-12 w-full bg-stone-100 dark:bg-[#201b16] rounded-xl" />
                <div className="h-3 w-28 ml-auto bg-stone-200 dark:bg-[#262018] rounded-md" />
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
                    <Compass className="w-5 h-5 text-amber-500" />
                    Earn Coins Now
                  </h2>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">+50 Coins / Sub</span>
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Explore verified channel exchange campaigns and video watch tasks in the Earn hub. Completing genuine creator activities grants instant coin rewards.
                </p>

                <Link
                  to="/earn"
                  className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Compass className="w-4 h-4" />
                  <span>Launch Earn & Exchange Hub</span>
                </Link>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                  <Gift className="w-4 h-4" />
                  <span>Your Referral Code</span>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-[#0d0b09] rounded-xl border border-stone-200 dark:border-[#262018] flex items-center justify-between font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                  <span>{user.referralCode}</span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-sans font-normal">+100 Coins per invite</span>
                </div>
                <Link to="/earn" className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold block text-right">
                  View Referral Details →
                </Link>
              </div>
            </>
          )}

        </div>

      </div>

    </div>
  );
};
