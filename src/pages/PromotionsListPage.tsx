import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { Promotion } from '../types';
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  XCircle,
  BarChart2,
  ChevronRight,
  Zap,
} from 'lucide-react';

export const PromotionsListPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);

  const fetchPromotions = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/promotions');
      if (res.data.success) {
        setPromotions(res.data.data.promotions || []);
      }
    } catch (err) {
      console.error('Failed to fetch promotions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleAction = async (promoId: string, action: 'pause' | 'resume' | 'cancel') => {
    try {
      const res = await apiClient.put(`/promotions/${promoId}/status`, { action });
      if (res.data.success) {
        fetchPromotions();
        // Refetch user balance if refunded
        apiClient.get('/auth/me').then((r) => {
          if (r.data.success) updateUser(r.data.data.user);
        });
      }
    } catch (err) {
      console.error('Failed status update:', err);
    }
  };

  const filtered = filterStatus === 'All'
    ? promotions
    : promotions.filter((p) => p.status === filterStatus);

  return (
    <div className="space-y-8 animate-fade-in pb-12 w-full max-w-full min-w-0">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-6 shadow-xs min-w-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-2 truncate">
            <Megaphone className="w-6 h-6 text-red-500 shrink-0" />
            <span className="truncate">My Promotion Campaigns</span>
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 font-medium break-words">
            Manage your active, paused, and past creator promotional campaigns
          </p>
        </div>

        <Link
          to="/promote"
          className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/20 flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Launch Promotion</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-semibold border-b border-stone-200 dark:border-[#262018] no-scrollbar">
        {['All', 'active', 'paused', 'completed', 'cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3.5 py-1.5 rounded-xl capitalize transition-all shrink-0 ${
              filterStatus === st
                ? 'bg-red-600 text-white font-bold shadow-xs'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#1c1813]'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Campaigns List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-stone-100 dark:bg-[#161310] animate-pulse border border-stone-200 dark:border-[#262018]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl">
          <Zap className="w-8 h-8 text-stone-400 mx-auto" />
          <p className="text-xs text-stone-500 dark:text-stone-400">No promotion campaigns found for status "{filterStatus}".</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((promo) => {
            const percentSpent = Math.min(100, Math.round((promo.spentCredits / promo.budgetCredits) * 100));

            return (
              <div
                key={promo.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] hover:border-red-500/40 transition-all space-y-4 shadow-xs min-w-0"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600/10 text-red-600 dark:text-red-400 uppercase shrink-0">
                        {promo.platform}
                      </span>
                      <h3 className="font-bold text-stone-900 dark:text-white text-base truncate">{promo.title}</h3>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-1 break-words">{promo.description}</p>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase shrink-0 self-start sm:self-auto ${
                    promo.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                    promo.status === 'paused' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                    'bg-stone-100 dark:bg-[#201b16] text-stone-500'
                  }`}>
                    {promo.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-stone-500 dark:text-stone-400">
                    <span>Budget: {promo.spentCredits} / {promo.budgetCredits} Credits</span>
                    <span className="font-bold text-red-500">{percentSpent}%</span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 dark:bg-[#0d0b09] rounded-full overflow-hidden border border-stone-200/40 dark:border-[#262018]">
                    <div
                      className="h-full bg-red-600 rounded-full transition-all"
                      style={{ width: `${percentSpent}%` }}
                    />
                  </div>
                </div>

                {/* Stats & Actions */}
                <div className="pt-2 border-t border-stone-150 dark:border-[#262018] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4 text-stone-500 dark:text-stone-400 min-w-0">
                    <span>Impressions: <strong className="text-stone-900 dark:text-white">{promo.impressions}</strong></span>
                    <span>Discoveries: <strong className="text-stone-900 dark:text-white">{promo.uniqueDiscoveries}</strong></span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {promo.status === 'active' && (
                      <button
                        onClick={() => handleAction(promo.id, 'pause')}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20 flex items-center gap-1 shrink-0"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </button>
                    )}

                    {promo.status === 'paused' && (
                      <button
                        onClick={() => handleAction(promo.id, 'resume')}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20 flex items-center gap-1 shrink-0"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Resume</span>
                      </button>
                    )}

                    {promo.status !== 'cancelled' && promo.status !== 'completed' && (
                      <button
                        onClick={() => handleAction(promo.id, 'cancel')}
                        className="px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold border border-red-500/20 flex items-center gap-1 shrink-0"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}

                    <Link
                      to={`/promotions/${promo.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-stone-100 dark:bg-[#201b16] hover:bg-stone-200 dark:hover:bg-[#2a241d] text-stone-800 dark:text-stone-200 font-bold flex items-center gap-1 shrink-0"
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-red-500" />
                      <span>Analytics</span>
                    </Link>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
