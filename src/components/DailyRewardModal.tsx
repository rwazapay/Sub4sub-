import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Sparkles, CheckCircle2, Gift, X, Zap, Trophy, Coins, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewardAmount: number;
  streakDays: number;
  newBalance: number;
  nextUnlockTime?: string;
}

export const playRewardChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    // Arpeggio note frequencies: C5, E5, G5, C6
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.12, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.35);
    });
  } catch {
    // Graceful fallback if audio is restricted by browser policy
  }
};

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({
  isOpen,
  onClose,
  rewardAmount,
  streakDays,
  newBalance,
  nextUnlockTime,
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      playRewardChime();
    }
  }, [isOpen]);

  useEffect(() => {
    const updateCountdown = () => {
      const target = nextUnlockTime ? new Date(nextUnlockTime) : new Date();
      if (!nextUnlockTime) {
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
  }, [nextUnlockTime]);

  const streakDaysSchedule = [
    { day: 1, reward: 25 },
    { day: 2, reward: 30 },
    { day: 3, reward: 35 },
    { day: 4, reward: 40 },
    { day: 5, reward: 45 },
    { day: 6, reward: 50 },
    { day: 7, reward: 100, isMega: true },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-gradient-to-b from-stone-900 via-stone-900 to-[#141210] border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 text-stone-100 shadow-2xl overflow-hidden z-10"
          >
            {/* Top Glow & Decorative effects */}
            <div className="absolute -top-24 -left-24 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-yellow-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6 text-center">
              {/* Header Icon */}
              <div className="relative inline-flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-xl shadow-amber-500/30 flex items-center justify-center"
                >
                  <div className="w-full h-full bg-stone-950 rounded-[22px] flex items-center justify-center">
                    <Gift className="w-10 h-10 text-amber-400 fill-amber-400/20 stroke-[2.2]" />
                  </div>
                </motion.div>

                <div className="absolute -bottom-2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 text-[11px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-stone-950 text-stone-950" />
                  <span>Day {streakDays} Streak</span>
                </div>
              </div>

              {/* Title & Reward Amount */}
              <div className="space-y-2 pt-1">
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
                  <span>Daily Reward Claimed!</span>
                  <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 font-medium">
                  Thanks for checking in today! You’ve unlocked free bonus credits for your creator campaigns.
                </p>
              </div>

              {/* Reward Highlight Badge */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
                <div className="text-left">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                    Added to Wallet
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-amber-300">+{rewardAmount}</span>
                    <span className="text-xs font-bold text-amber-400">Bonus Coins</span>
                  </div>
                </div>

                <div className="h-10 w-px bg-amber-500/20" />

                <div className="text-right">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                    Updated Balance
                  </span>
                  <div className="flex items-baseline justify-end gap-1.5">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span className="text-xl font-black text-white">{newBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* 7-Day Streak Tracker Progression */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-stone-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Streak Reward Roadmap</span>
                  </span>
                  <span className="text-amber-400">{Math.min(streakDays, 7)} / 7 Milestone</span>
                </div>

                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {streakDaysSchedule.map((s) => {
                    const isCompleted = streakDays >= s.day;
                    const isCurrent = streakDays === s.day;
                    return (
                      <div
                        key={s.day}
                        className={`p-2 rounded-xl flex flex-col items-center justify-between gap-1 transition-all border ${
                          isCurrent
                            ? 'bg-amber-500 border-amber-400 text-stone-950 shadow-md shadow-amber-500/30 scale-105'
                            : isCompleted
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-stone-800/60 border-stone-800 text-stone-400'
                        }`}
                      >
                        <span className={`text-[10px] font-bold ${isCurrent ? 'text-stone-950 font-black' : ''}`}>
                          D{s.day}
                        </span>
                        {isCompleted ? (
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isCurrent ? 'text-stone-950' : 'text-amber-400'}`} />
                        ) : s.isMega ? (
                          <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                        ) : (
                          <Coins className="w-3.5 h-3.5 text-stone-400" />
                        )}
                        <span className={`text-[10px] font-black ${isCurrent ? 'text-stone-950' : ''}`}>
                          +{s.reward}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Countdown to Next Check-in */}
              <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 text-xs font-semibold text-stone-300 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Next daily check-in unlocks in:</span>
                <span className="font-mono font-bold text-amber-400 bg-stone-900 px-2 py-0.5 rounded-md border border-stone-700">
                  {timeLeft || '00:00:00'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Link
                  to="/earn"
                  onClick={onClose}
                  className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                >
                  <Coins className="w-4 h-4" />
                  <span>Start Earning Now</span>
                </Link>

                <button
                  onClick={onClose}
                  className="py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs sm:text-sm transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
