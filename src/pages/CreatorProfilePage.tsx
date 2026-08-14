import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { SocialChannel, Promotion, AiVerificationData } from '../types';
import {
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
  TrendingUp,
  Activity,
} from 'lucide-react';
import { AiVerificationBadge } from '../components/AiVerificationBadge';
import { AiGrowthAuditModal } from '../components/AiGrowthAuditModal';

export const CreatorProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user, updateUser } = useAuth();

  const [creatorUser, setCreatorUser] = useState<any>(null);
  const [channels, setChannels] = useState<SocialChannel[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subProcessing, setSubProcessing] = useState(false);
  const [subMessage, setSubMessage] = useState<{ success: boolean; text: string } | null>(null);

  // AI Verification state
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [aiSuccessToast, setAiSuccessToast] = useState<string | null>(null);

  const fetchProfile = () => {
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
  };

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const handleRunAiVerification = async () => {
    if (!creatorUser) return;
    setIsAuditing(true);
    setAiSuccessToast(null);

    try {
      const res = await apiClient.post(`/users/verify-ai/${creatorUser.username}`);
      if (res.data.success) {
        setCreatorUser((prev: any) => ({
          ...prev,
          isAiVerified: true,
          aiVerificationData: res.data.data.aiVerificationData,
        }));
        setAiSuccessToast(res.data.message || 'Growth statistics successfully verified by Gemini AI!');
        setIsAuditModalOpen(true);
      }
    } catch (err: any) {
      console.error('AI Verification failed:', err);
      alert(err.response?.data?.message || 'AI verification failed. Please try again.');
    } finally {
      setIsAuditing(false);
    }
  };

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

  const isVerified = Boolean(creatorUser.isAiVerified);
  const aiData: AiVerificationData | undefined = creatorUser.aiVerificationData;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Back Link */}
      <Link to="/creators" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Directory</span>
      </Link>

      {/* Profile Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative">
            <img
              src={creatorUser.avatar}
              alt={creatorUser.displayName}
              className="w-24 h-24 rounded-3xl object-cover ring-4 ring-indigo-500/40 shadow-xl"
            />
            {isVerified && (
              <div
                className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-indigo-600 text-white shadow-lg border-2 border-slate-900"
                title="AI Verified Growth Stats"
              >
                <Sparkles className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white">{creatorUser.displayName}</h1>
              
              {/* AI Verification Badge */}
              <AiVerificationBadge
                isVerified={isVerified}
                verificationData={aiData}
                onClick={() => setIsAuditModalOpen(true)}
                showScore={true}
              />

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

              {isVerified && (
                <span className="px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Gemini Audited Growth
                </span>
              )}
            </div>

            {/* Sub4Sub Direct Action Box */}
            {user && user.id !== creatorUser.id && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
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

      {/* AI Growth Verification Feature Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Gemini AI Growth Validation System</span>
            </div>
            <h2 className="text-xl font-black text-white">Channel Integrity & Growth Verification</h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Audited by Gemini AI to inspect subscriber retention signals, organic velocity, and protect against artificial manipulation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isVerified ? (
              <button
                onClick={() => setIsAuditModalOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>View Full Audit Report ({aiData?.authenticityScore || 96}%)</span>
              </button>
            ) : (
              <button
                onClick={handleRunAiVerification}
                disabled={isAuditing}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAuditing ? 'Auditing with Gemini...' : 'Verify Channel Growth with AI'}</span>
              </button>
            )}
          </div>
        </div>

        {isVerified && aiData && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Growth Rating</span>
                <p className="text-xs font-black text-white">{aiData.growthQualityRating}</p>
              </div>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Retention Quality</span>
                <p className="text-xs font-black text-white">{aiData.retentionQuality}</p>
              </div>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Authenticity Score</span>
                <p className="text-xs font-black text-emerald-400">{aiData.authenticityScore}% Verified</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        )}

        {aiSuccessToast && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{aiSuccessToast}</span>
          </div>
        )}
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

      {/* AI Growth Audit Modal */}
      <AiGrowthAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        creatorName={creatorUser.displayName}
        username={creatorUser.username}
        verificationData={aiData}
        onReverify={handleRunAiVerification}
        isScanning={isAuditing}
      />

    </div>
  );
};

