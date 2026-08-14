import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { AiVerificationData } from '../types';

interface AiVerificationBadgeProps {
  isVerified?: boolean;
  verificationData?: AiVerificationData | null;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

export const AiVerificationBadge: React.FC<AiVerificationBadgeProps> = ({
  isVerified = false,
  verificationData,
  onClick,
  size = 'md',
  showScore = false,
}) => {
  if (!isVerified) return null;

  const score = verificationData?.authenticityScore || 96;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-xs px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full font-extrabold bg-gradient-to-r from-indigo-500/20 via-sky-500/20 to-emerald-500/20 text-indigo-300 border border-indigo-500/40 hover:border-indigo-400 hover:text-white transition-all shadow-sm group ${sizeClasses[size]}`}
      title="AI Verified Growth Stats - Audited by Gemini AI"
    >
      <span className="relative flex items-center justify-center">
        <Sparkles className={`${iconSizes[size]} text-indigo-400 group-hover:rotate-12 transition-transform`} />
      </span>
      <span className="flex items-center gap-1">
        <CheckCircle2 className={`${iconSizes[size]} text-emerald-400`} />
        <span>AI Verified</span>
      </span>
      {showScore && (
        <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/30">
          {score}%
        </span>
      )}
    </button>
  );
};
