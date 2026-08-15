import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  UserX,
  RefreshCw,
  Search,
  Filter,
  Eye,
} from 'lucide-react';
import { SpamIncident, User } from '../../types';
import { apiClient } from '../../services/api';

interface AdminSpamIncidentsTabProps {
  incidents: SpamIncident[];
  onRefresh: () => void;
  onInspectUser: (user: Partial<User>) => void;
}

export const AdminSpamIncidentsTab: React.FC<AdminSpamIncidentsTabProps> = ({
  incidents,
  onRefresh,
  onInspectUser,
}) => {
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterAction, setFilterAction] = useState('All');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = incidents.filter((inc) => {
    if (filterSeverity !== 'All' && inc.severity !== filterSeverity) return false;
    if (filterAction !== 'All' && inc.actionType !== filterAction) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        inc.username.toLowerCase().includes(q) ||
        inc.details.toLowerCase().includes(q) ||
        (inc.ipAddress && inc.ipAddress.includes(q))
      );
    }
    return true;
  });

  const handleResolveIncident = async (id: string, action: 'cleared' | 'reviewed' | 'banned') => {
    try {
      setActionLoading(id);
      const res = await apiClient.put(`/admin/spam-incidents/${id}/resolve`, {
        action,
        resolutionNote: `Resolved via Admin Spam Radar (${action})`,
      });
      if (res.data.success) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to resolve incident:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-950 border border-red-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-red-600/20 border border-red-500/30 text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Automated Anti-Spam & Abuse Radar</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tracks high-velocity subscription skips, fake view botting, and sybil referral rings in real time.
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="self-start md:self-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Incidents
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by username, IP, or flag details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-red-500"
          >
            <option value="All">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-red-500"
          >
            <option value="All">All Action Types</option>
            <option value="subscribe_spam">Subscribe Velocity</option>
            <option value="view_botting">View Botting</option>
            <option value="referral_fraud">Referral Fraud</option>
            <option value="velocity_abuse">Click Velocity</option>
            <option value="token_tampering">Token Tampering</option>
          </select>
        </div>
      </div>

      {/* Incidents Table / Stream */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="font-bold text-white text-sm">No spam incidents detected</p>
            <p className="text-xs text-slate-500 mt-1">
              The anti-fraud engine has not flagged any abnormal behavior under the current filters.
            </p>
          </div>
        ) : (
          filtered.map((inc) => (
            <div
              key={inc.id}
              className={`p-4 rounded-2xl bg-slate-900/60 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                inc.accountLocked
                  ? 'border-red-600/40 bg-red-950/10'
                  : inc.severity === 'high' || inc.severity === 'critical'
                  ? 'border-amber-500/30'
                  : 'border-slate-800'
              }`}
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      inc.severity === 'critical'
                        ? 'bg-red-600 text-slate-950 shadow-sm shadow-red-600/30'
                        : inc.severity === 'high'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : inc.severity === 'medium'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {inc.actionType.replace('_', ' ')}
                  </span>

                  <button
                    onClick={() => onInspectUser({ id: inc.userId, username: inc.username })}
                    className="text-xs font-bold text-white hover:text-red-400 font-mono transition-colors"
                  >
                    @{inc.username}
                  </button>

                  {inc.accountLocked && (
                    <span className="px-2 py-0.5 rounded-md bg-red-600 text-slate-950 font-black text-[10px] flex items-center gap-1">
                      <Lock className="w-3 h-3" /> AUTO-LOCKED
                    </span>
                  )}

                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(inc.createdAt).toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">{inc.details}</p>

                <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 font-mono pt-1">
                  <span>
                    Risk: <strong className="text-white">{inc.riskScoreBefore} ➔ {inc.riskScoreAfter}</strong>
                  </span>
                  {inc.ipAddress && <span>IP: <strong className="text-slate-300">{inc.ipAddress}</strong></span>}
                  <span>Status: <strong className="text-slate-300 capitalize">{inc.status}</strong></span>
                </div>
              </div>

              {/* Triage Actions */}
              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                <button
                  onClick={() => onInspectUser({ id: inc.userId, username: inc.username })}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="Inspect User Details"
                >
                  <Eye className="w-3.5 h-3.5" /> Inspect
                </button>

                <button
                  onClick={() => handleResolveIncident(inc.id, 'cleared')}
                  disabled={actionLoading === inc.id}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white text-xs font-bold transition-all"
                  title="Clear false positive & restore account"
                >
                  Clear
                </button>

                <button
                  onClick={() => handleResolveIncident(inc.id, 'banned')}
                  disabled={actionLoading === inc.id}
                  className="px-3 py-1.5 rounded-xl bg-red-600/20 text-red-300 hover:bg-red-600 hover:text-white text-xs font-bold transition-all flex items-center gap-1"
                  title="Ban User"
                >
                  <UserX className="w-3.5 h-3.5" /> Ban
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
