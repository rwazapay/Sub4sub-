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
  ShieldAlert,
  Sliders,
  ArrowRightLeft,
  FileText,
  Lock,
  Unlock,
  Crown,
  Eye,
  Trash2,
  Clock,
  Radio,
  Activity,
} from 'lucide-react';
import { AdminUserInspectorModal } from '../components/admin/AdminUserInspectorModal';
import { AdminSpamIncidentsTab } from '../components/admin/AdminSpamIncidentsTab';
import { AdminWebsiteSettingsTab } from '../components/admin/AdminWebsiteSettingsTab';
import { AdminSystemHealthTab } from '../components/admin/AdminSystemHealthTab';
import { User, Promotion, SpamIncident, SystemSettings, Sub4SubRequest } from '../types';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [spamIncidents, setSpamIncidents] = useState<SpamIncident[]>([]);
  const [exchanges, setExchanges] = useState<Sub4SubRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Navigation & Filter States
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'spam' | 'settings' | 'promotions' | 'exchanges' | 'audit' | 'health'
  >('overview');
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('All');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [promoStatusFilter, setPromoStatusFilter] = useState('All');
  const [message, setMessage] = useState<string | null>(null);

  // Inspector Modal State
  const [inspectedUser, setInspectedUser] = useState<User | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, promosRes, spamRes, settingsRes, exchangesRes, logsRes, txRes] =
        await Promise.all([
          apiClient.get('/admin/dashboard'),
          apiClient.get('/admin/users'),
          apiClient.get('/admin/promotions'),
          apiClient.get('/admin/spam-incidents'),
          apiClient.get('/admin/settings'),
          apiClient.get('/admin/exchanges'),
          apiClient.get('/admin/audit-logs'),
          apiClient.get('/admin/transactions'),
        ]);

      if (statsRes.data.success) setStats(statsRes.data.data.stats);
      if (usersRes.data.success) setUsersList(usersRes.data.data.users);
      if (promosRes.data.success) setPromotions(promosRes.data.data.promotions);
      if (spamRes.data.success) setSpamIncidents(spamRes.data.data.incidents);
      if (settingsRes.data.success) setSystemSettings(settingsRes.data.data.systemSettings);
      if (exchangesRes.data.success) setExchanges(exchangesRes.data.data.exchanges);
      if (logsRes.data.success) setAuditLogs(logsRes.data.data.logs);
      if (txRes.data.success) setTransactions(txRes.data.data.transactions);
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

  const handleUpdatePromoStatus = async (promoId: string, status: string) => {
    try {
      const res = await apiClient.put(`/admin/promotions/${promoId}/status`, { status });
      if (res.data.success) {
        setMessage(`Campaign status updated to "${status}"`);
        fetchAdminData();
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to update campaign status');
    }
  };

  const handleQuickUnlockUser = async (userId: string) => {
    try {
      const res = await apiClient.put(`/admin/users/${userId}/unlock`, {
        reason: 'Quick unlock via Admin User Management',
      });
      if (res.data.success) {
        setMessage(`Account restored & unlocked successfully!`);
        fetchAdminData();
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to unlock user');
    }
  };

  if (user?.role !== 'admin' && user?.role !== 'superadmin') {
    return (
      <div className="p-12 text-center text-red-400">
        <Shield className="w-16 h-16 mx-auto mb-3 text-red-500" />
        <h2 className="text-2xl font-black text-white">Administrator Access Required</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
          You do not possess the required security credentials to access the central administration and anti-spam control room.
        </p>
      </div>
    );
  }

  // Filter users list
  const filteredUsers = usersList.filter((u) => {
    if (userStatusFilter === 'locked') {
      if (!u.isLocked && u.status !== 'restricted' && u.status !== 'suspended' && u.status !== 'banned') return false;
    } else if (userStatusFilter !== 'All' && u.status !== userStatusFilter) {
      return false;
    }

    if (userRoleFilter !== 'All' && u.role !== userRoleFilter) return false;

    if (userSearch) {
      const q = userSearch.toLowerCase().trim();
      return (
        u.username.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.referralCode && u.referralCode.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Admin Central Command</h1>
              <p className="text-xs text-slate-400">
                Manage all creators, automated spam detection, lockout policies, and website-wide settings.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <Radio className="w-3.5 h-3.5 animate-pulse" /> Anti-Spam Engine Live
          </div>

          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh State</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex justify-between items-center animate-fadeIn">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-indigo-400 hover:text-white font-bold">&times;</button>
        </div>
      )}

      {/* High-Level Radar Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold uppercase text-[10px]">Total Creators</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white mt-1">{stats?.totalUsers || usersList.length}</p>
          <span className="text-[10px] text-emerald-400 font-bold">● {stats?.activeUsersCount || usersList.filter(u => u.status === 'active').length} Active</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold uppercase text-[10px]">Locked Out</span>
            <Lock className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-black text-red-400 mt-1">
            {stats?.lockedAccountsCount || usersList.filter(u => u.isLocked || u.status === 'restricted').length}
          </p>
          <span className="text-[10px] text-red-400 font-bold">Automated Lockouts</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold uppercase text-[10px]">Spam Incidents</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-1">{stats?.totalSpamIncidents || spamIncidents.length}</p>
          <span className="text-[10px] text-amber-400 font-bold">Under Audit</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold uppercase text-[10px]">Coins Circulation</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white mt-1">
            {(stats?.totalCreditsInCirculation || 0).toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">Platform Reserve</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold uppercase text-[10px]">Active Campaigns</span>
            <Megaphone className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-1">
            {stats?.activePromotionsCount || promotions.filter(p => p.status === 'active').length}
          </p>
          <span className="text-[10px] text-slate-400">of {promotions.length} total promos</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-800 pb-2.5 scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-red-600 text-slate-950 shadow-md shadow-red-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Radar Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-red-600 text-slate-950 shadow-md shadow-red-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>All Users ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('spam')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'spam'
              ? 'bg-red-600 text-slate-950 shadow-md shadow-red-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Spam & Abuse Radar ({spamIncidents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-red-600 text-slate-950 shadow-md shadow-red-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Website Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('promotions')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'promotions'
              ? 'bg-red-600 text-slate-950 shadow-md shadow-red-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Campaigns ({promotions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('exchanges')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'exchanges'
              ? 'bg-red-600 text-slate-950 shadow-md shadow-red-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Sub4Sub Exchanges</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-red-600 text-slate-950 shadow-md shadow-red-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit Logs & Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'health'
              ? 'bg-red-600 text-slate-950 shadow-md shadow-red-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>System Health</span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick System Health Bar */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-white">System Health & Live API Status</h4>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    99.99% Operational
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Firestore database connected and synchronized. Server latency &lt; 20ms.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('health')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
            >
              <span>Inspect Health Dashboard</span>
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Spam Radar */}
            <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" /> Recent Spam Incidents
                </h3>
                <button
                  onClick={() => setActiveTab('spam')}
                  className="text-xs font-bold text-red-400 hover:underline"
                >
                  View All ({spamIncidents.length})
                </button>
              </div>

              <div className="space-y-2.5">
                {spamIncidents.slice(0, 4).map((inc) => (
                  <div key={inc.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono">@{inc.username}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-500/20 text-red-300">
                          {inc.actionType.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{inc.details}</p>
                    </div>
                    <button
                      onClick={() => setInspectedUser(usersList.find((u) => u.id === inc.userId) || { id: inc.userId, username: inc.username } as User)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold shrink-0"
                    >
                      Inspect
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Health & Global Status */}
            <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" /> Global Website Controls
                </h3>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="text-xs font-bold text-indigo-400 hover:underline"
                >
                  Edit Settings
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Sub4Sub Exchange</span>
                  <p className="text-sm font-bold text-emerald-400 mt-1">
                    {systemSettings?.enableSub4Sub ? '✓ Active & Enabled' : '⏸ Temporarily Paused'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Watch & Earn</span>
                  <p className="text-sm font-bold text-emerald-400 mt-1">
                    {systemSettings?.enableVideoEarn ? '✓ Active & Enabled' : '⏸ Temporarily Paused'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Referral System</span>
                  <p className="text-sm font-bold text-indigo-400 mt-1">
                    {systemSettings?.enableReferralProgram ? '✓ Active (+100 Coins)' : '⏸ Paused'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Auto-Lockout Rule</span>
                  <p className="text-sm font-bold text-red-400 mt-1">
                    Threshold: {systemSettings?.autoLockoutRiskThreshold || 75} Risk
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Users Management */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search username, email, referral code..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-red-500"
              >
                <option value="All">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="locked">Locked / Restricted Only</option>
                <option value="banned">Banned</option>
              </select>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-red-500"
              >
                <option value="All">All Roles</option>
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-4">Creator</th>
                    <th className="p-4">Status & Risk</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Coins Balance</th>
                    <th className="p-4">Referrals</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No creators match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                              alt={u.displayName}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white">{u.displayName}</span>
                                {u.isPro && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                              </div>
                              <span className="text-slate-400 text-[10px] font-mono">@{u.username}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="space-y-1">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                u.status === 'active'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : u.isLocked || u.status === 'restricted'
                                  ? 'bg-red-500/20 text-red-300'
                                  : 'bg-red-500/20 text-red-300'
                              }`}
                            >
                              {u.isLocked ? 'LOCKED OUT' : u.status}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <span>Risk:</span>
                              <span
                                className={`font-bold ${
                                  (u.riskScore || 0) > 60
                                    ? 'text-red-400'
                                    : (u.riskScore || 0) > 30
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                                }`}
                              >
                                {u.riskScore || 0}/100
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] uppercase font-bold">
                            {u.role}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="font-bold text-amber-400 font-mono">
                            {u.credits?.toLocaleString() || 0}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="text-slate-300 font-mono">{u.referralCount || 0}</span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {u.isLocked || u.status === 'restricted' ? (
                              <button
                                onClick={() => handleQuickUnlockUser(u.id)}
                                className="px-2.5 py-1 rounded-xl bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white text-[11px] font-bold transition-all flex items-center gap-1"
                              >
                                <Unlock className="w-3 h-3" /> Unlock
                              </button>
                            ) : null}

                            <button
                              onClick={() => setInspectedUser(u)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold transition-all flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> Manage
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Spam & Abuse Radar */}
      {activeTab === 'spam' && (
        <AdminSpamIncidentsTab
          incidents={spamIncidents}
          onRefresh={fetchAdminData}
          onInspectUser={(partialUser) => {
            const full = usersList.find((u) => u.id === partialUser.id);
            setInspectedUser(full || (partialUser as User));
          }}
        />
      )}

      {/* Tab 4: Whole Website Settings */}
      {activeTab === 'settings' && (
        <AdminWebsiteSettingsTab settings={systemSettings} onRefresh={fetchAdminData} />
      )}

      {/* Tab 5: Campaigns Moderation */}
      {activeTab === 'promotions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white">Live Promotion Campaigns ({promotions.length})</h3>
            <select
              value={promoStatusFilter}
              onChange={(e) => setPromoStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-red-500"
            >
              <option value="All">All Campaigns</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promotions
              .filter((p) => (promoStatusFilter === 'All' ? true : p.status === promoStatusFilter))
              .map((p) => (
                <div key={p.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-red-400 uppercase">{p.platform} • {p.type}</span>
                      <h4 className="text-sm font-bold text-white truncate mt-0.5">{p.title}</h4>
                      <p className="text-xs text-slate-400 font-mono">By @{p.creatorUsername}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                      {p.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 text-[10px]">Budget</span>
                      <p className="font-bold text-white">{p.budgetCredits} Coins</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px]">Spent</span>
                      <p className="font-bold text-amber-400">{p.spentCredits} Coins</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px]">Clicks</span>
                      <p className="font-bold text-emerald-400">{p.clicks || 0}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {p.status !== 'active' && (
                      <button
                        onClick={() => handleUpdatePromoStatus(p.id, 'active')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                      >
                        Approve / Resume
                      </button>
                    )}
                    {p.status === 'active' && (
                      <button
                        onClick={() => handleUpdatePromoStatus(p.id, 'paused')}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
                      >
                        Pause
                      </button>
                    )}
                    {p.status !== 'rejected' && (
                      <button
                        onClick={() => handleUpdatePromoStatus(p.id, 'rejected')}
                        className="px-3 py-1.5 rounded-xl bg-red-600/20 text-red-300 hover:bg-red-600 hover:text-white text-xs font-bold"
                      >
                        Reject & Refund
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tab 6: Exchanges Monitoring */}
      {activeTab === 'exchanges' && (
        <div className="space-y-4">
          <h3 className="text-sm font-black text-white">Live Sub4Sub Exchange Requests ({exchanges.length})</h3>
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Subscriber</th>
                  <th className="p-3.5">Target Creator</th>
                  <th className="p-3.5">Platform</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {exchanges.slice(0, 50).map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/20">
                    <td className="p-3.5 font-bold text-white font-mono">@{req.followerUsername}</td>
                    <td className="p-3.5 font-bold text-slate-300 font-mono">@{req.targetUsername}</td>
                    <td className="p-3.5 text-red-400 font-bold">{req.targetPlatform}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                        {req.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono text-[10px]">
                      {new Date(req.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 7: Security Audit Logs & Financial Ledger */}
      {activeTab === 'audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white">Administrative Security Audit Logs</h3>
            <div className="space-y-2">
              {auditLogs.slice(0, 20).map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-400 font-mono">@{log.adminUsername}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-300 font-sans">{log.details}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-black text-white">Immutable Credit Ledger</h3>
            <div className="space-y-2">
              {transactions.slice(0, 20).map((tx) => (
                <div key={tx.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-300 capitalize">{tx.type.replace('_', ' ')}</span>
                    <p className="text-[11px] text-slate-400">{tx.description}</p>
                  </div>
                  <span className={`font-bold font-mono ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 8: System Health Diagnostics & SLA Radar */}
      {activeTab === 'health' && <AdminSystemHealthTab />}

      {/* Deep User Inspector Modal */}
      {inspectedUser && (
        <AdminUserInspectorModal
          user={inspectedUser}
          onClose={() => setInspectedUser(null)}
          onRefresh={() => {
            fetchAdminData();
            // Refresh currently inspected user
            const updated = usersList.find((u) => u.id === inspectedUser.id);
            if (updated) setInspectedUser(updated);
          }}
        />
      )}
    </div>
  );
};
