import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { Flame, Sparkles, CheckCircle2, Gift, Clock, Coins, ChevronRight } from 'lucide-react';
import { DailyRewardModal } from './DailyRewardModal';

interface DailyRewardCardProps {
  variant?: 'compact' | 'full' | 'banner';
  className?: string;
  onRewardClaimed?: (rewardAmount: number, streak: number) => void;
}

export const DailyRewardCard: React.FC<DailyRewardCardProps> = ({
  variant = 'full',
  className = '',
  onRewardClaimed,
}) => {
  const { user, updateUser } = useAuth();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [claimedBonus, setClaimedBonus] = useState(0);
  const [timeLeft, setTimeLeft] = useState<string>('');

  const streak = user?.streakDays || 1;
  const potentialReward = Math.min(25 + (streak - 1) * 5, 100);

  // Live countdown timer until next UTC midnight
  useEffect(() => {
    const updateCountdown = () => {
      const target = user?.nextRewardAvailableAt ? new Date(user.nextRewardAvailableAt) : new Date();
      if (!user?.nextRewardAvailableAt) {
        target.setUTCHours(24, 0, 0, 0);
      }
      const now = new Date();
      const diffMs = Math.max(0, target.getTime() - now.getTime());
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeLeft(
        `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [user?.nextRewardAvailableAt]);

  if (!user) return null;

  const handleClaim = async () => {
    if (user.dailyRewardClaimedToday || isClaiming) return;
    setIsClaiming(true);
    setClaimFeedback(null);

    try {
      let res;
      try {
        res = await apiClient.post('/wallet/daily-claim');
      } catch (firstErr) {
        // Fallback to auth endpoint
        res = await apiClient.post('/auth/daily-streak-claim');
      }

      if (res.data?.success) {
        const bonusCoins =
          res.data.data?.bonusCoins ?? res.data.data?.streakBonus ?? potentialReward;
        const streakDays =
          res.data.data?.streakDays ?? res.data.data?.user?.streakDays ?? streak;
        const nextAt =
          res.data.data?.nextClaimAvailableAt ??
          res.data.data?.user?.nextRewardAvailableAt;

        const updatedUser: typeof user = res.data.data?.user || {
          ...user,
          credits: (user.credits || 0) + bonusCoins,
          totalCreditsEarned: (user.totalCreditsEarned || 0) + bonusCoins,
          dailyRewardClaimedToday: true,
          streakDays: streakDays,
          nextRewardAvailableAt: nextAt,
        };

        updateUser(updatedUser);
        setClaimedBonus(bonusCoins);
        setShowCelebrationModal(true);
        setClaimFeedback(res.data.message || `+${bonusCoins} Coins claimed!`);

        if (onRewardClaimed) {
          onRewardClaimed(bonusCoins, updatedUser.streakDays);
        }
      } else {
        setClaimFeedback(res.data?.message || 'Daily reward check failed. Please refresh.');
      }
    } catch (err: any) {
      console.error('Claim daily reward error:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.message === 'Network Error'
          ? 'Network connection issue. Please check your internet.'
          : 'Failed to claim bonus. Please try again.');
      setClaimFeedback(msg);
    } finally {
      setIsClaiming(false);
    }
  };

  if (variant === 'compact') {
    return (
      <>
        <div
          className={`p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800 dark:border-[#332b21] space-y-2 shrink-0 sm:min-w-[240px] shadow-lg ${className}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-red-500 fill-red-500" />
              <span>Daily Streak</span>
            </span>
            <span className="font-extrabold text-red-400 text-xs px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
              Day {user.streakDays || 1}
            </span>
          </div>

          {user.dailyRewardClaimedToday ? (
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[11px] font-bold text-center flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Claimed ({timeLeft})</span>
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>{isClaiming ? 'Claiming...' : `Claim +${potentialReward} Coins`}</span>
            </button>
          )}

          {claimFeedback && (
            <p className="text-[10px] text-red-300 font-semibold text-center truncate">{claimFeedback}</p>
          )}
        </div>

        <DailyRewardModal
          isOpen={showCelebrationModal}
          onClose={() => setShowCelebrationModal(false)}
          rewardAmount={claimedBonus}
          streakDays={user.streakDays || 1}
          newBalance={user.credits}
          nextUnlockTime={user.nextRewardAvailableAt}
        />
      </>
    );
  }

  return (
    <>
      <div
        className={`p-6 rounded-3xl bg-gradient-to-br from-red-600/15 via-stone-900 to-stone-900 border border-red-600/40 text-stone-100 space-y-4 shadow-xl flex flex-col justify-between relative overflow-hidden ${className}`}
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-red-500 fill-red-500" />
              Daily Check-in Reward
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-red-600 text-white shadow-sm">
              Day {user.streakDays || 1} Streak 🔥
            </span>
          </div>

          <p className="text-xs sm:text-sm font-semibold text-stone-300 leading-relaxed">
            Check in every day to claim bonus coins and grow your consecutive streak multiplier!
          </p>

          {/* 7-Day Roadmap Mini Bar */}
          <div className="grid grid-cols-7 gap-1 pt-1">
            {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
              const isPastOrCurrent = (user.streakDays || 1) >= dayNum;
              const isToday = (user.streakDays || 1) === dayNum;
              return (
                <div
                  key={dayNum}
                  className={`py-1 rounded-lg text-center text-[10px] font-bold border transition-all ${
                    isToday
                      ? 'bg-red-600 text-white border-red-500 shadow-sm'
                      : isPastOrCurrent
                      ? 'bg-red-600/20 text-red-300 border-red-500/30'
                      : 'bg-stone-800/60 text-stone-500 border-stone-800'
                  }`}
                >
                  D{dayNum}
                </div>
              );
            })}
          </div>

          {claimFeedback && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-red-400" />
              <span>{claimFeedback}</span>
            </div>
          )}
        </div>

        <div className="space-y-2 relative z-10 pt-2">
          {user.dailyRewardClaimedToday ? (
            <div className="space-y-2">
              <button
                disabled
                className="w-full py-3.5 px-4 rounded-2xl bg-stone-800/90 border border-stone-700 text-stone-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Claimed Today (+{potentialReward} Coins)</span>
              </button>
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-stone-400">
                <Clock className="w-3.5 h-3.5 text-red-400" />
                <span>Next reward unlocks in:</span>
                <span className="font-mono text-red-400 font-bold">{timeLeft || '00:00:00'}</span>
              </div>
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 active:scale-95"
            >
              <Gift className="w-4 h-4" />
              <span>{isClaiming ? 'Claiming Reward...' : `Claim +${potentialReward} Bonus Coins Now`}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <DailyRewardModal
        isOpen={showCelebrationModal}
        onClose={() => setShowCelebrationModal(false)}
        rewardAmount={claimedBonus}
        streakDays={user.streakDays || 1}
        newBalance={user.credits}
        nextUnlockTime={user.nextRewardAvailableAt}
      />
    </>
  );
};
