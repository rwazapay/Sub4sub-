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
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-indigo-400" />
            My Promotion Campaigns
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your active, paused, and past creator promotional campaigns
          </p>
        </div>

        <Link
          to="/promote"
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Launch Promotion</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-semibold border-b border-slate-800">
        {['All', 'active', 'paused', 'completed', 'cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-xl capitalize transition-all ${
              filterStatus === st
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
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
            <div key={i} className="h-28 rounded-2xl bg-slate-900 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-slate-900 border border-slate-800 rounded-3xl">
          <Zap className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400">No promotion campaigns found for status "{filterStatus}".</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((promo) => {
            const percentSpent = Math.min(100, Math.round((promo.spentCredits / promo.budgetCredits) * 100));

            return (
              <div
                key={promo.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                        {promo.platform}
                      </span>
                      <h3 className="font-bold text-white text-base">{promo.title}</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{promo.description}</p>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase shrink-0 ${
                    promo.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    promo.status === 'paused' ? 'bg-red-600/10 text-red-300 border border-red-500/20' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {promo.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Budget: {promo.spentCredits} / {promo.budgetCredits} Credits</span>
                    <span className="font-bold text-indigo-400">{percentSpent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      style={{ width: `${percentSpent}%` }}
                    />
                  </div>
                </div>

                {/* Stats & Actions */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4 text-slate-400">
                    <span>Impressions: <strong className="text-white">{promo.impressions}</strong></span>
                    <span>Discoveries: <strong className="text-white">{promo.uniqueDiscoveries}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    {promo.status === 'active' && (
                      <button
                        onClick={() => handleAction(promo.id, 'pause')}
                        className="px-2.5 py-1 rounded-lg bg-red-600/10 hover:bg-red-600/15 text-red-300 font-semibold border border-red-500/20 flex items-center gap-1"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </button>
                    )}

                    {promo.status === 'paused' && (
                      <button
                        onClick={() => handleAction(promo.id, 'resume')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/20 flex items-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Resume</span>
                      </button>
                    )}

                    {promo.status !== 'cancelled' && promo.status !== 'completed' && (
                      <button
                        onClick={() => handleAction(promo.id, 'cancel')}
                        className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold border border-red-500/20 flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}

                    <Link
                      to={`/promotions/${promo.id}`}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1"
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
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
