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
      const res = await apiClient.post('/wallet/daily-claim');
      if (res.data?.success) {
        const bonusCoins = res.data.data?.bonusCoins || potentialReward;
        const updatedUser = res.data.data?.user || {
          ...user,
          credits: (user.credits || 0) + bonusCoins,
          dailyRewardClaimedToday: true,
          streakDays: res.data.data?.streakDays || streak,
          nextRewardAvailableAt: res.data.data?.nextClaimAvailableAt,
        };

        updateUser(updatedUser);
        setClaimedBonus(bonusCoins);
        setShowCelebrationModal(true);
        setClaimFeedback(res.data.message || `+${bonusCoins} Coins claimed!`);

        if (onRewardClaimed) {
          onRewardClaimed(bonusCoins, updatedUser.streakDays);
        }
      }
    } catch (err: any) {
      setClaimFeedback(err.response?.data?.message || 'Failed to claim bonus.');
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
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Daily Streak</span>
            </span>
            <span className="font-extrabold text-amber-400 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
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
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>{isClaiming ? 'Claiming...' : `Claim +${potentialReward} Coins`}</span>
            </button>
          )}

          {claimFeedback && (
            <p className="text-[10px] text-amber-300 font-semibold text-center truncate">{claimFeedback}</p>
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
        className={`p-6 rounded-3xl bg-gradient-to-br from-amber-500/15 via-stone-900 to-stone-900 border border-amber-500/40 text-stone-100 space-y-4 shadow-xl flex flex-col justify-between relative overflow-hidden ${className}`}
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              Daily Check-in Reward
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500 text-stone-950 shadow-sm">
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
                      ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                      : isPastOrCurrent
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-stone-800/60 text-stone-500 border-stone-800'
                  }`}
                >
                  D{dayNum}
                </div>
              );
            })}
          </div>

          {claimFeedback && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
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
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Next reward unlocks in:</span>
                <span className="font-mono text-amber-400 font-bold">{timeLeft || '00:00:00'}</span>
              </div>
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-95"
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
