import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { PlatformType } from '../types';
import {
  Megaphone,
  Coins,
  Sparkles,
  AlertCircle,
  Globe2,
  CheckCircle2,
  Eye,
  Zap,
} from 'lucide-react';

export const PromotePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState<PlatformType>('YouTube');
  const [channelUrl, setChannelUrl] = useState('');
  const [budgetCredits, setBudgetCredits] = useState<number>(200);
  const [durationDays, setDurationDays] = useState<number>(7);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !channelUrl || !budgetCredits) return;

    if (user.credits < budgetCredits) {
      setErrorMsg(`Insufficient credits. You need ${budgetCredits} Credits, but you have ${user.credits} Credits.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await apiClient.post('/promotions', {
        title,
        description: description || `Discover ${user.displayName}'s creator channel on ${platform}.`,
        platform,
        channelUrl,
        budgetCredits,
        durationDays,
      });

      if (res.data.success) {
        if (user) {
          updateUser({
            ...user,
            credits: res.data.data.remainingBalance,
          });
        }
        navigate('/promotions');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to launch promotion campaign.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-yellow-400/20 to-amber-500/10 border border-yellow-500/40 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xl">
        <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300 font-extrabold text-xs uppercase tracking-wider">
          <Megaphone className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          <span>Sub4Sub & Follow4Follow Featured Campaign</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Promote Your Channel for Sub4Sub & Follow4Follow
        </h1>
        <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
          Allocate your earned credits to feature your channel at the top of the Sub4Sub & Follow4Follow discovery feed. Gain hundreds of subscribers and followers from fellow creators!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form Column (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-xs sm:text-sm">
            
            {/* Title */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 block">Campaign Headline</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Check out my new tech tutorials & gadgets channel!"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Platform & Channel URL */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5 sm:col-span-1">
                <label className="font-bold text-slate-300 block">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as PlatformType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="YouTube">YouTube</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="X">X (Twitter)</option>
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-bold text-slate-300 block">Channel or Content URL</label>
                <input
                  type="url"
                  required
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  placeholder="https://youtube.com/@yourchannel or https://tiktok.com/@handle"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 block">Creator Bio / Pitch (Optional)</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell creators what your channel is about, what content you post, and why they should discover you..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Budget & Duration */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-200">Campaign Budget (Credits)</label>
                <span className="font-extrabold text-amber-300 text-sm flex items-center gap-1">
                  <Coins className="w-4 h-4 text-amber-400" />
                  {budgetCredits} Credits
                </span>
              </div>

              <input
                type="range"
                min="50"
                max={Math.max(500, user.credits)}
                step="25"
                value={budgetCredits}
                onChange={(e) => setBudgetCredits(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500 cursor-pointer"
              />

              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Min: 50 Credits</span>
                <span>Your Balance: {user.credits} Credits</span>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <span className="font-bold text-slate-300">Target Duration</span>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value, 10))}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 text-xs focus:outline-none"
                >
                  <option value={3}>3 Days</option>
                  <option value={7}>7 Days (Recommended)</option>
                  <option value={14}>14 Days</option>
                  <option value={30}>30 Days</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || user.credits < budgetCredits}
              className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isSubmitting ? 'Launching Promotion...' : `Launch Promotion (${budgetCredits} Credits)`}</span>
            </button>

          </form>

        </div>

        {/* Live Preview Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase">
            <Eye className="w-4 h-4" />
            <span>Live Discovery Feed Card Preview</span>
          </div>

          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <img
                  src={user.avatar}
                  alt={user.displayName}
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/40"
                />
                <div>
                  <h3 className="font-bold text-white text-sm">{user.displayName}</h3>
                  <p className="text-[11px] text-slate-400">@{user.username}</p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {platform}
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-slate-100 text-sm line-clamp-1">
                {title || 'Your Promotion Headline Here'}
              </h4>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {description || `Discover ${user.displayName}'s creator channel on ${platform}.`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                {user.creatorCategory || 'Technology'}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 flex items-center gap-1">
                <Globe2 className="w-3 h-3" />
                {user.country || 'Rwanda'}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-amber-300">
              <span className="flex items-center gap-1">
                <Coins className="w-4 h-4 text-amber-400" />
                +10 Credits Reward
              </span>
              <span className="text-slate-500 text-[10px]">Preview Mode</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
