import React, { useState, useEffect } from 'react';
import { YouTubeEmbedPlayer } from './YouTubeEmbedPlayer';
import {
  Timer,
  ShieldCheck,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  Tv,
  Coins,
  Sparkles,
  ExternalLink,
  Flame,
} from 'lucide-react';

interface ExchangeRetentionTimerProps {
  requiredSeconds?: number;
  promotionTitle?: string;
  channelUrl?: string;
  videoEmbedUrl?: string;
  rewardCoins?: number;
  isCreativeCommons?: boolean;
  licenseType?: string;
  onTimerComplete?: () => void;
}

export const ExchangeRetentionTimer: React.FC<ExchangeRetentionTimerProps> = ({
  requiredSeconds = 60,
  promotionTitle = 'Active Exchange Campaign',
  channelUrl = '#',
  videoEmbedUrl,
  rewardCoins = 10,
  isCreativeCommons = true,
  licenseType = 'CC BY 4.0 International',
  onTimerComplete,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(requiredSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && secondsRemaining === 0) {
      setIsRunning(false);
      setIsCompleted(true);
      if (onTimerComplete) {
        onTimerComplete();
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsRemaining, onTimerComplete]);

  const handleStart = () => {
    setHasStarted(true);
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setSecondsRemaining(requiredSeconds);
    setHasStarted(false);
  };

  const progressPercent = Math.min(
    100,
    Math.max(0, ((requiredSeconds - secondsRemaining) / requiredSeconds) * 100)
  );

  return (
    <div id="exchange-retention-timer-card" className="bg-stone-900 dark:bg-[#15120e] border-2 border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
      
      {/* Decorative Glow & CC Badge */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 blur-3xl rounded-full -z-0 pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Retention Guard Timer</span>
            </span>
            {isCreativeCommons && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>CC-BY Licensed</span>
              </span>
            )}
          </div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            Required Exchange Active Stay
          </h3>
          <p className="text-xs text-stone-400 max-w-lg">
            To earn exchange credits and protect account reputation, users must maintain active subscription / watch time for at least <strong className="text-amber-400">{requiredSeconds} seconds</strong> before leaving.
          </p>
        </div>

        {/* Reward Badge */}
        <div className="flex items-center gap-2 bg-stone-950/80 px-4 py-2.5 rounded-2xl border border-stone-800 shrink-0">
          <Coins className="w-5 h-5 text-amber-400 animate-bounce" />
          <div>
            <div className="text-[10px] text-stone-400 uppercase font-bold">Completion Reward</div>
            <div className="text-sm font-black text-amber-400">+{rewardCoins} Coins</div>
          </div>
        </div>
      </div>

      {/* Embedded CC Video Preview Block */}
      {videoEmbedUrl && (
        <div className="bg-stone-950 rounded-2xl p-4 border border-stone-800 space-y-3 relative z-10">
          <div className="flex items-center justify-between text-xs font-bold text-stone-300">
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-amber-400" />
              <span>Creative Commons Video Player (CC-BY)</span>
            </div>
            <span className="text-[10px] text-stone-500 font-medium">{licenseType}</span>
          </div>

          <YouTubeEmbedPlayer videoUrlOrId={videoEmbedUrl} title={promotionTitle} />

          <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
            <span>Watch CC video directly to satisfy active stay compliance</span>
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
            >
              <span>Visit Official Channel</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Main Countdown Gauge and Visual Progress */}
      <div className="bg-stone-950/90 rounded-2xl p-6 border border-stone-800 space-y-6 relative z-10">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Circular Countdown Ring */}
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="8"
                className="text-stone-800"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="8"
                className={isCompleted ? 'text-emerald-500' : 'text-amber-500'}
                strokeDasharray="263.89"
                strokeDashoffset={263.89 - (263.89 * progressPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={`text-3xl font-black ${isCompleted ? 'text-emerald-400' : 'text-amber-400'}`}>
                {secondsRemaining}s
              </span>
              <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">
                {isCompleted ? 'Done' : 'Remaining'}
              </span>
            </div>
          </div>

          {/* Progress Details & Status */}
          <div className="flex-1 space-y-4 w-full">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-300">Active Retention Progress</span>
              <span className="font-mono font-bold text-amber-400">{Math.round(progressPercent)}%</span>
            </div>

            {/* Bar Progress */}
            <div className="w-full h-3 bg-stone-900 rounded-full overflow-hidden p-0.5 border border-stone-800">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isCompleted ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Status Message Container */}
            <div className="p-3.5 rounded-xl border text-xs font-medium flex items-center gap-3 transition-all">
              {isCompleted ? (
                <div className="flex items-center gap-2.5 text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 w-full">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="font-extrabold text-sm">Retention Requirement Satisfied!</div>
                    <div className="text-[11px] text-emerald-300/80">You have completed the required active stay duration. Coins are now permanently credited.</div>
                  </div>
                </div>
              ) : isRunning ? (
                <div className="flex items-center gap-2.5 text-amber-300 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 w-full">
                  <Clock className="w-5 h-5 shrink-0 animate-spin text-amber-400" />
                  <div>
                    <div className="font-extrabold text-xs">Timer Ticking - Active Stay Enforced</div>
                    <div className="text-[11px] text-stone-400">Keep the channel or CC video active. Do not navigate away prematurely.</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 text-stone-300 bg-stone-900 p-2.5 rounded-lg border border-stone-800 w-full">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
                  <div>
                    <div className="font-extrabold text-xs">Premature Removal Protection Ready</div>
                    <div className="text-[11px] text-stone-400">Click "Start Retention Timer" to begin tracking your required stay duration.</div>
                  </div>
                </div>
              )}
            </div>

            {/* Timer Control Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {!isRunning && !isCompleted && (
                <button
                  type="button"
                  onClick={handleStart}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{hasStarted ? 'Resume Stay Timer' : 'Start Retention Timer'}</span>
                </button>
              )}

              {isRunning && (
                <button
                  type="button"
                  onClick={handlePause}
                  className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-black text-xs flex items-center gap-2 active:scale-95 transition-all"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause Timer</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 font-bold text-xs flex items-center gap-1.5 border border-stone-800 active:scale-95 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              {/* Instant Verify Demo Button */}
              <button
                type="button"
                onClick={() => {
                  setSecondsRemaining(0);
                  setIsRunning(false);
                  setIsCompleted(true);
                  if (onTimerComplete) onTimerComplete();
                }}
                className="ml-auto px-3 py-2 rounded-xl text-[11px] font-bold bg-stone-900 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 transition-all"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Simulate 60s Stay Completion</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Policy Disclaimer Banner */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-stone-300 text-xs">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
        <p>
          <strong className="text-white">Anti-Unsub/Removal Policy:</strong> Our automated verification system checks subscription & view retention periodically. Premature unsubscribing or closing exchanges before 60 seconds will forfeit earned coins and reduce reputation score.
        </p>
      </div>

    </div>
  );
};
