import React from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showBadge?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  showBadge = true,
  className = '',
}) => {
  // Dimensions for YouTube-styled play button badge
  const sizeMap = {
    xs: {
      badge: 'w-7 h-5 rounded-[6px]',
      play: 'w-2.5 h-2.5 translate-x-0.5',
      text: 'text-sm',
      proBadge: 'text-[9px] px-1 py-0.2',
    },
    sm: {
      badge: 'w-8 h-6 rounded-[7px]',
      play: 'w-3 h-3 translate-x-0.5',
      text: 'text-base',
      proBadge: 'text-[10px] px-1.5 py-0.5',
    },
    md: {
      badge: 'w-10 h-7 rounded-[8px]',
      play: 'w-3.5 h-3.5 translate-x-0.5',
      text: 'text-xl',
      proBadge: 'text-[11px] px-1.5 py-0.5',
    },
    lg: {
      badge: 'w-12 h-8 rounded-[9px]',
      play: 'w-4 h-4 translate-x-0.5',
      text: 'text-2xl',
      proBadge: 'text-xs px-2 py-0.5',
    },
    xl: {
      badge: 'w-16 h-11 rounded-[12px]',
      play: 'w-5 h-5 translate-x-0.5',
      text: 'text-3xl',
      proBadge: 'text-sm px-2.5 py-0.5',
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* YouTube Inspired Play Emblem */}
      <div
        className={`relative flex items-center justify-center bg-[#FF0000] text-white shadow-md shadow-red-600/30 transition-transform duration-200 group-hover:scale-105 ${currentSize.badge}`}
        title="SubLoop Creator Exchange"
      >
        {/* Soft gloss highlight */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-white/20 rounded-[inherit] pointer-events-none" />

        {/* Crisp YouTube-style play triangle */}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`text-white drop-shadow-sm ${currentSize.play}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M8 5.14v13.72a1 1 0 001.52.85l11.08-6.86a1 1 0 000-1.7L9.52 4.29A1 1 0 008 5.14z" />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex items-center gap-1.5 tracking-tight font-black font-sans leading-none">
          <span className={`text-stone-950 dark:text-white ${currentSize.text} tracking-tighter`}>
            Sub
          </span>
          <span className={`text-[#FF0000] dark:text-red-500 ${currentSize.text} tracking-tighter`}>
            Loop
          </span>
          {showBadge && (
            <span
              className={`ml-1 font-bold uppercase rounded-md bg-stone-900 text-white dark:bg-white dark:text-stone-950 tracking-wider shadow-sm ${currentSize.proBadge}`}
            >
              PRO
            </span>
          )}
        </div>
      )}
    </div>
  );
};
