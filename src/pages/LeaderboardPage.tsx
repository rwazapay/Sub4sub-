import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../services/api';
import { Trophy, Award, Flame, Globe2, Coins, Crown, Sparkles } from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'discoverers' | 'reputation' | 'promoters'>('discoverers');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    apiClient
      .get(`/leaderboard?tab=${activeTab}`)
      .then((res) => {
        if (res.data.success) {
          setLeaderboard(res.data.data.leaderboard || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [activeTab]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-red-500/30 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xl">
        <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
          <Trophy className="w-4 h-4" />
          <span>Community Leaderboard</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Top Content Creators & Growth Champions
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
          Celebrating top creators based on platform engagement, discovery activity, reputation, and channel promotion impact.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('discoverers')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'discoverers'
              ? 'bg-red-600 text-slate-950 font-extrabold shadow-md shadow-red-600/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Top Discoverers
        </button>

        <button
          onClick={() => setActiveTab('reputation')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'reputation'
              ? 'bg-red-600 text-slate-950 font-extrabold shadow-md shadow-red-600/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Top Reputation
        </button>

        <button
          onClick={() => setActiveTab('promoters')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'promoters'
              ? 'bg-red-600 text-slate-950 font-extrabold shadow-md shadow-red-600/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Top Promoters
        </button>
      </div>

      {/* Leaderboard Table / Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-900 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                item.rank === 1
                  ? 'bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border-red-500/50 shadow-lg'
                  : item.rank === 2
                  ? 'bg-slate-900 border-slate-700'
                  : item.rank === 3
                  ? 'bg-slate-900 border-amber-900/40'
                  : 'bg-slate-900/60 border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3.5">
                {/* Rank Badge */}
                <div
                  className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                    item.rank === 1
                      ? 'bg-red-600 text-slate-950 shadow-md shadow-amber-500/40'
                      : item.rank === 2
                      ? 'bg-slate-300 text-slate-950'
                      : item.rank === 3
                      ? 'bg-amber-700 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.rank === 1 ? <Crown className="w-4 h-4" /> : `#${item.rank}`}
                </div>

                <img
                  src={item.avatar}
                  alt={item.displayName}
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/30 shrink-0"
                />

                <div>
                  <Link
                    to={`/creators/${item.username}`}
                    className="font-bold text-white text-sm hover:text-indigo-300 transition-colors block truncate max-w-[160px] sm:max-w-xs"
                  >
                    {item.displayName}
                  </Link>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>@{item.username}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Globe2 className="w-3 h-3" />
                      {item.country}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Value */}
              <div className="text-right shrink-0">
                {activeTab === 'discoverers' && (
                  <div>
                    <span className="font-extrabold text-red-300 text-sm flex items-center gap-1 justify-end">
                      <Coins className="w-4 h-4 text-red-400" />
                      +{item.totalEarned.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500">Credits Earned</span>
                  </div>
                )}

                {activeTab === 'reputation' && (
                  <div>
                    <span className="font-extrabold text-emerald-400 text-sm flex items-center gap-1 justify-end">
                      <Award className="w-4 h-4" />
                      {item.reputation}/100
                    </span>
                    <span className="text-[10px] text-slate-500">Reputation Score</span>
                  </div>
                )}

                {activeTab === 'promoters' && (
                  <div>
                    <span className="font-extrabold text-indigo-400 text-sm flex items-center gap-1 justify-end">
                      <Coins className="w-4 h-4 text-indigo-400" />
                      {item.totalSpent.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500">Credits Promoted</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
