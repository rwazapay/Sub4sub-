import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import {
  Shield,
  Users,
  Megaphone,
  Coins,
  Settings as SettingsIcon,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'promotions' | 'audit'>('stats');
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, promosRes, logsRes] = await Promise.all([
        apiClient.get('/admin/dashboard'),
        apiClient.get('/admin/users'),
        apiClient.get('/admin/promotions'),
        apiClient.get('/admin/audit-logs'),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data.stats);
      if (usersRes.data.success) setUsersList(usersRes.data.data.users);
      if (promosRes.data.success) setPromotions(promosRes.data.data.promotions);
      if (logsRes.data.success) setAuditLogs(logsRes.data.data.logs);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'superadmin') {
      fetchAdminData();
    }
  }, [user]);

  const handleUpdateUserStatus = async (userId: string, status: string) => {
    try {
      const res = await apiClient.put(`/admin/users/${userId}/status`, { status });
      if (res.data.success) {
        setMessage(`User status updated to ${status}`);
        fetchAdminData();
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleUpdatePromoStatus = async (promoId: string, status: string) => {
    try {
      const res = await apiClient.put(`/admin/promotions/${promoId}/status`, { status });
      if (res.data.success) {
        setMessage(`Promotion status updated to ${status}`);
        fetchAdminData();
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to update promotion status');
    }
  };

  if (user?.role !== 'admin' && user?.role !== 'superadmin') {
    return (
      <div className="p-8 text-center text-red-400">
        <Shield className="w-12 h-12 mx-auto mb-2 text-red-500" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-sm text-slate-400 mt-1">
          Administrator privileges are required to view this control center.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-black text-white">Admin Control Center</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            System health, moderation, user management, and credit compliance controls.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex justify-between items-center">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'stats'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Overview Stats</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users & Anti-Spam</span>
        </button>

        <button
          onClick={() => setActiveTab('promotions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'promotions'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Promotions Moderation</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Security Audit Logs</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Creators</span>
            <p className="text-2xl font-black text-white">{stats.totalUsers}</p>
            <p className="text-[11px] text-indigo-400">Active community members</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Active Campaigns</span>
            <p className="text-2xl font-black text-emerald-400">{stats.activePromotions}</p>
            <p className="text-[11px] text-slate-400">Total: {stats.totalPromotions}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Credits in Circulation</span>
            <p className="text-2xl font-black text-amber-400">{stats.totalCreditsInCirculation?.toLocaleString()}</p>
            <p className="text-[11px] text-slate-400">User balances</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Completed Discoveries</span>
            <p className="text-2xl font-black text-purple-400">{stats.completedDiscoveries?.toLocaleString()}</p>
            <p className="text-[11px] text-purple-300">Safe interactions verified</p>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search user by name, email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Credits</th>
                  <th className="p-3">Streak</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {usersList
                  .filter(
                    (u) =>
                      !userSearch ||
                      u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
                      u.username.toLowerCase().includes(userSearch.toLowerCase())
                  )
                  .map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40">
                      <td className="p-3 flex items-center gap-2">
                        <img src={u.avatar} alt={u.displayName} className="w-7 h-7 rounded-lg object-cover" />
                        <div>
                          <p className="font-bold text-white">{u.displayName}</p>
                          <p className="text-[10px] text-slate-400">@{u.username}</p>
                        </div>
                      </td>
                      <td className="p-3 font-bold text-amber-400">{u.credits}</td>
                      <td className="p-3 text-slate-300">{u.streakDays} days</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : u.status === 'suspended'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {u.status === 'active' ? (
                          <button
                            onClick={() => handleUpdateUserStatus(u.id, 'suspended')}
                            className="px-2 py-1 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 font-bold text-[10px]"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateUserStatus(u.id, 'active')}
                            className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded hover:bg-emerald-500/30 font-bold text-[10px]"
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'promotions' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Creator</th>
                <th className="p-3">Progress</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {promotions.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-white max-w-[200px] truncate">{p.title}</td>
                  <td className="p-3 text-slate-300">@{p.creatorUsername}</td>
                  <td className="p-3 text-slate-400">
                    {p.currentViews} / {p.targetViews} views
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : p.status === 'paused'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1">
                    {p.status !== 'active' && (
                      <button
                        onClick={() => handleUpdatePromoStatus(p.id, 'active')}
                        className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded hover:bg-emerald-500/30 font-bold text-[10px]"
                      >
                        Approve
                      </button>
                    )}
                    {p.status !== 'rejected' && (
                      <button
                        onClick={() => handleUpdatePromoStatus(p.id, 'rejected')}
                        className="px-2 py-1 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 font-bold text-[10px]"
                      >
                        Reject & Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Admin</th>
                <th className="p-3">Action</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-500">
                    No administrative audit actions logged yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="p-3 text-slate-400 font-mono text-[10px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-amber-400">@{log.adminUsername}</td>
                    <td className="p-3 font-mono text-indigo-300 text-[10px] uppercase">{log.action}</td>
                    <td className="p-3 text-slate-200">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
