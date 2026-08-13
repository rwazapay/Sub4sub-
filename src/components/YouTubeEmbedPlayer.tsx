import React, { useState } from 'react';
import { Tv, ExternalLink, Play, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

interface YouTubeEmbedPlayerProps {
  videoUrlOrId?: string;
  title?: string;
  autoplay?: boolean;
  className?: string;
  aspectRatio?: string;
  onPlayerReady?: () => void;
  onPlayerError?: () => void;
}

export function extractYouTubeId(urlOrId?: string): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;

  const trimmed = urlOrId.trim();

  // Raw 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // YouTube match regex for watch, embed, shorts, youtu.be
  const match = trimmed.match(
    /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );

  if (match && match[1]) {
    return match[1];
  }

  return null;
}

export const YouTubeEmbedPlayer: React.FC<YouTubeEmbedPlayerProps> = ({
  videoUrlOrId,
  title = 'YouTube Video',
  autoplay = false,
  className = '',
  aspectRatio = 'aspect-video',
  onPlayerReady,
  onPlayerError,
}) => {
  const [hasError, setHasError] = useState(false);
  const [domainMode, setDomainMode] = useState<'standard' | 'nocookie'>('standard');

  const youtubeId = extractYouTubeId(videoUrlOrId);

  const directWatchUrl = youtubeId
    ? `https://www.youtube.com/watch?v=${youtubeId}`
    : videoUrlOrId?.startsWith('http')
    ? videoUrlOrId
    : '#';

  const embedDomain = domainMode === 'nocookie' ? 'www.youtube-nocookie.com' : 'www.youtube.com';

  const windowOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
  const originParam = windowOrigin ? `&origin=${encodeURIComponent(windowOrigin)}` : '';

  const embedUrl = youtubeId
    ? `https://${embedDomain}/embed/${youtubeId}?autoplay=${autoplay ? '1' : '0'}&rel=0&modestbranding=1${originParam}`
    : null;

  const handleToggleDomain = () => {
    setHasError(false);
    setDomainMode((prev) => (prev === 'nocookie' ? 'standard' : 'nocookie'));
  };

  const handleIframeError = () => {
    setHasError(true);
    if (onPlayerError) onPlayerError();
  };

  if (!youtubeId || hasError) {
    return (
      <div className={`w-full ${aspectRatio} rounded-2xl bg-stone-950 border border-stone-800 p-6 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden shadow-inner ${className}`}>
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 to-transparent opacity-60 pointer-events-none" />

        <div className="relative z-10 w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
          <Tv className="w-6 h-6" />
        </div>

        <div className="relative z-10 space-y-1 max-w-md">
          <h4 className="text-sm font-extrabold text-white">
            {hasError ? 'Inline Player Restricted / Blocked' : 'Video Player Ready'}
          </h4>
          <p className="text-xs text-stone-400">
            {hasError
              ? 'YouTube embed policy or browser extension prevented inline playback. You can switch player domains or open directly on YouTube.'
              : 'Direct embed link configured. Click below to launch or open in YouTube.'}
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 pt-1">
          <a
            href={directWatchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-stone-950" />
            <span>Watch on YouTube</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {hasError && (
            <button
              type="button"
              onClick={handleToggleDomain}
              className="px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 font-bold text-xs flex items-center gap-1.5 border border-stone-800 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Retry Player ({domainMode === 'nocookie' ? 'Standard Domain' : 'No-Cookie Domain'})</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${aspectRatio} w-full rounded-2xl overflow-hidden bg-black border border-stone-800 shadow-xl ${className}`}>
      <iframe
        src={embedUrl!}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        onError={handleIframeError}
        onLoad={onPlayerReady}
        className="w-full h-full border-0"
      />
    </div>
  );
};
