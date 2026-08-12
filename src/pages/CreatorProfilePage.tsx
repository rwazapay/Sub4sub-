import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { SocialChannel, Promotion } from '../types';
import {
  User,
  Globe2,
  Award,
  ExternalLink,
  ShieldCheck,
  Megaphone,
  ArrowLeft,
  Sparkles,
  Coins,
  Repeat,
  CheckCircle2,
} from 'lucide-react';

export const CreatorProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user, updateUser } = useAuth();

  const [creatorUser, setCreatorUser] = useState<any>(null);
  const [channels, setChannels] = useState<SocialChannel[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subProcessing, setSubProcessing] = useState(false);
  const [subMessage, setSubMessage] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    if (username) {
      apiClient
        .get(`/users/profile/${username}`)
        .then((res) => {
          if (res.data.success) {
            setCreatorUser(res.data.data.user);
            setChannels(res.data.data.channels || []);
            setPromotions(res.data.data.activePromotions || []);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [username]);

  const handleSub4SubAction = async () => {
    if (!creatorUser || !user) return;

    const primaryChannel = channels[0];
    const channelUrl = primaryChannel?.url || `https://youtube.com/@${creatorUser.username}`;
    const platform = primaryChannel?.platform || 'YouTube';

    setSubProcessing(true);
    setSubMessage(null);

    // Open creator channel in new window
    window.open(channelUrl, '_blank', 'noopener,noreferrer');

    try {
      const res = await apiClient.post('/sub4sub/subscribe', {
        targetUserId: creatorUser.id,
        targetPlatform: platform,
        channelUrl,
      });

      if (res.data.success) {
        setSubMessage({
          success: true,
          text: res.data.message,
        });

        if (res.data.data.newBalance !== undefined) {
          updateUser({
            ...user,
            credits: res.data.data.newBalance,
          });
        }
      }
    } catch (err: any) {
      setSubMessage({
        success: false,
        text: err.response?.data?.message || 'Sub4Sub action failed.',
      });
    } finally {
      setSubProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400">Loading creator profile...</div>;
  }

  if (!creatorUser) {
    return (
      <div className="p-12 text-center space-y-3">
        <h2 className="text-xl font-bold text-white">Creator Not Found</h2>
        <Link to="/creators" className="text-indigo-400 font-bold text-xs hover:underline">
          Return to Creator Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Back Link */}
      <Link to="/creators" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Directory</span>
      </Link>

      {/* Profile Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <img
            src={creatorUser.avatar}
            alt={creatorUser.displayName}
            className="w-24 h-24 rounded-3xl object-cover ring-4 ring-indigo-500/40 shadow-xl"
          />

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white">{creatorUser.displayName}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Level {creatorUser.level}
              </span>
            </div>

            <p className="text-xs text-slate-400">@{creatorUser.username}</p>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              {creatorUser.bio || 'Digital content creator.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-bold">
              <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-yellow-800 dark:text-yellow-300 flex items-center gap-1">
                <Globe2 className="w-3.5 h-3.5" />
                {creatorUser.country}
              </span>

              <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                Reputation: {creatorUser.reputation}/100
              </span>
            </div>

            {/* Sub4Sub Direct Action Box */}
            {user && user.id !== creatorUser.id && (
              <div className="pt-3 border-t border-amber-200 dark:border-slate-800 space-y-2">
                <button
                  onClick={handleSub4SubAction}
                  disabled={subProcessing}
                  className="py-3 px-5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs shadow-lg shadow-yellow-500/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Repeat className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {subProcessing
                      ? 'Opening Channel...'
                      : `Subscribe to @${creatorUser.username} & Request Sub Back (+20 Credits) 🔁`}
                  </span>
                </button>

                {subMessage && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-bold ${
                      subMessage.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                        : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300'
                    }`}
                  >
                    {subMessage.text}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connected Channels Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          Verified Social Profiles
        </h2>

        {channels.length === 0 ? (
          <p className="text-xs text-slate-400">No social channels connected yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {channels.map((ch) => (
              <a
                key={ch.id}
                href={ch.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-indigo-500/40 transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                    {ch.platform}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400" />
                </div>
                <p className="font-bold text-white text-sm truncate">{ch.channelName}</p>
                <p className="text-[11px] text-slate-400 truncate">{ch.url}</p>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Active Promotions */}
      {promotions.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-indigo-400" />
            Active Creator Promotions
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {promotions.map((p) => (
              <div key={p.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                    {p.platform}
                  </span>
                  <span className="text-amber-300 font-bold text-xs flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" /> +10 Credits
                  </span>
                </div>
                <h3 className="font-bold text-white text-sm">{p.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>
                <a
                  href={p.channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-400 font-bold hover:underline pt-1"
                >
                  <span>Discover Content</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
