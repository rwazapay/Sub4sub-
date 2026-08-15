import React, { useState } from 'react';
import {
  X,
  Shield,
  Lock,
  Unlock,
  Coins,
  Crown,
  AlertTriangle,
  CheckCircle2,
  Tv,
  Users,
  History,
  Activity,
} from 'lucide-react';
import { User, SocialChannel, Promotion, CreditTransaction, ReferralRecord, SpamIncident } from '../../types';
import { apiClient } from '../../services/api';

interface AdminUserInspectorModalProps {
  user: User;
  onClose: () => void;
  onRefresh: () => void;
}

export const AdminUserInspectorModal: React.FC<AdminUserInspectorModalProps> = ({
  user,
  onClose,
  onRefresh,
}) => {
  const [details, setDetails] = useState<{
    channels: SocialChannel[];
    promotions: Promotion[];
    transactions: CreditTransaction[];
    referrals: ReferralRecord[];
    userIncidents: SpamIncident[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'permissions' | 'finance' | 'security'>('profile');

  // Adjustment form states
  const [creditAdjustment, setCreditAdjustment] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [lockReason, setLockReason] = useState('');
  const [lockDuration, setLockDuration] = useState('24');
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Permission states
  const [canEarn, setCanEarn] = useState(user.canEarn !== false);
  const [canPromote, setCanPromote] = useState(user.canPromote !== false);
  const [canRefer, setCanRefer] = useState(user.canRefer !== false);
  const [role, setRole] = useState(user.role);

  React.useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/admin/users/${user.id}/details`);
        if (res.data.success) {
          setDetails(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load user deep details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserDetails();
  }, [user.id]);

  const handleAdjustCredits = async () => {
    const amt = parseInt(creditAdjustment, 10);
    if (isNaN(amt) || amt === 0) return;
    try {
      setSubmitting(true);
      const res = await apiClient.post(`/admin/users/${user.id}/credits`, {
        amount: amt,
        reason: creditReason || 'Manual administrative credit adjustment',
      });
      if (res.data.success) {
        setActionMessage(`Credits adjusted by ${amt > 0 ? '+' : ''}${amt}`);
        setCreditAdjustment('');
        setCreditReason('');
        onRefresh();
      }
    } catch (err: any) {
      setActionMessage(err.response?.data?.message || 'Failed to adjust credits');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLock = async (action: 'lock' | 'unlock') => {
    try {
      setSubmitting(true);
      if (action === 'lock') {
        const res = await apiClient.put(`/admin/users/${user.id}/lock`, {
          reason: lockReason || 'Suspicious automated activity detected',
          durationHours: parseInt(lockDuration, 10) || 24,
        });
        if (res.data.success) {
          setActionMessage('User account locked successfully');
          onRefresh();
        }
      } else {
        const res = await apiClient.put(`/admin/users/${user.id}/unlock`, {
          reason: 'Cleared by administrator',
        });
        if (res.data.success) {
          setActionMessage('User account restored & unlocked successfully');
          onRefresh();
        }
      }
    } catch (err: any) {
      setActionMessage(err.response?.data?.message || 'Lock operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePermissions = async () => {
    try {
      setSubmitting(true);
      const res = await apiClient.put(`/admin/users/${user.id}/permissions`, {
        canEarn,
        canPromote,
        canRefer,
      });
      if (res.data.success) {
        setActionMessage('Feature permissions saved');
        onRefresh();
      }
    } catch (err: any) {
      setActionMessage(err.response?.data?.message || 'Failed to save permissions');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    try {
      setSubmitting(true);
      const res = await apiClient.put(`/admin/users/${user.id}/role`, { role: newRole });
      if (res.data.success) {
        setRole(newRole as any);
        setActionMessage(`User role changed to ${newRole}`);
        onRefresh();
      }
    } catch (err: any) {
      setActionMessage(err.response?.data?.message || 'Failed to change role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetRiskScore = async () => {
    try {
      setSubmitting(true);
      const res = await apiClient.post(`/admin/users/${user.id}/reset-risk`);
      if (res.data.success) {
        setActionMessage('Risk score reset to 0 and flags cleared');
        onRefresh();
      }
    } catch (err: any) {
      setActionMessage(err.response?.data?.message || 'Failed to reset risk score');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePro = async () => {
    try {
      setSubmitting(true);
      const res = await apiClient.put(`/admin/users/${user.id}/pro`, { isPro: !user.isPro });
      if (res.data.success) {
        setActionMessage(`VIP Pro status ${!user.isPro ? 'activated' : 'deactivated'}`);
        onRefresh();
      }
    } catch (err: any) {
      setActionMessage(err.response?.data?.message || 'Failed to toggle Pro status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <img
              src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
              alt={user.displayName}
              className="w-12 h-12 rounded-2xl object-cover border border-slate-700"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">{user.displayName}</h3>
                <span className="text-xs text-slate-400 font-mono">@{user.username}</span>
                {user.isPro && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-black text-[10px] flex items-center gap-1">
                    <Crown className="w-3 h-3" /> PRO
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    user.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : user.isLocked || user.status === 'restricted'
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {user.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {user.id} | Email: {user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Alert Banner */}
        {actionMessage && (
          <div className="bg-indigo-600/20 border-b border-indigo-500/30 px-5 py-2.5 text-xs text-indigo-200 flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-indigo-400 hover:text-white">&times;</button>
          </div>
        )}

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-5 gap-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'profile'
                ? 'border-red-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" /> Overview & Activity
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'permissions'
                ? 'border-red-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" /> Features & Lockout
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'finance'
                ? 'border-red-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-4 h-4" /> Coins & Wallet
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'security'
                ? 'border-red-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" /> Anti-Spam Incidents ({details?.userIncidents.length || 0})
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Quick Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Wallet Coins</span>
                  <p className="text-xl font-black text-amber-400 mt-0.5">{user.credits?.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400">Total Earned: {user.totalCreditsEarned || 0}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Risk Score</span>
                  <p className={`text-xl font-black mt-0.5 ${
                    (user.riskScore || 0) > 60 ? 'text-red-400' : (user.riskScore || 0) > 30 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {user.riskScore || 0} / 100
                  </p>
                  <p className="text-[10px] text-slate-400">Spam Strikes: {user.spamStrikes || 0}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Referrals</span>
                  <p className="text-xl font-black text-indigo-400 mt-0.5">{user.referralCount || 0}</p>
                  <p className="text-[10px] text-slate-400">Code: {user.referralCode || 'N/A'}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Creator Level</span>
                  <p className="text-xl font-black text-purple-400 mt-0.5">Lvl {user.level || 1}</p>
                  <p className="text-[10px] text-slate-400">Streak: {user.streakDays || 1}d</p>
                </div>
              </div>

              {/* Linked Social Channels */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Tv className="w-4 h-4 text-red-400" /> Linked Channels ({details?.channels.length || 0})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {details?.channels.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-500 text-xs col-span-2">
                      No external social channels connected yet.
                    </div>
                  ) : (
                    details?.channels.map((c) => (
                      <div key={c.id} className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{c.channelName}</p>
                          <p className="text-[10px] text-slate-400 truncate">{c.platform} • {c.url}</p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10">
                          Verified
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Active Campaigns */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" /> Active Campaigns ({details?.promotions.length || 0})
                </h4>
                <div className="space-y-2">
                  {details?.promotions.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-500 text-xs">
                      No promotion campaigns launched by this user.
                    </div>
                  ) : (
                    details?.promotions.map((p) => (
                      <div key={p.id} className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-4">
                          <p className="font-bold text-white truncate">{p.title}</p>
                          <p className="text-[10px] text-slate-400">{p.platform} • Budget: {p.budgetCredits} coins • Spent: {p.spentCredits}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-300 capitalize">
                          {p.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-6">
              {/* Account Lockout Section */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {user.isLocked || user.status === 'restricted' ? (
                      <Lock className="w-5 h-5 text-red-400" />
                    ) : (
                      <Unlock className="w-5 h-5 text-emerald-400" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-white">Account Lockout & Access Status</h4>
                      <p className="text-[10px] text-slate-400">
                        {user.isLocked
                          ? `Currently locked out: "${user.lockoutReason || 'Security restrictions'}"`
                          : 'Account is active with standard creator access.'}
                      </p>
                    </div>
                  </div>

                  {user.isLocked || user.status === 'restricted' || user.status === 'suspended' ? (
                    <button
                      onClick={() => handleToggleLock('unlock')}
                      disabled={submitting}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Unlock className="w-3.5 h-3.5" /> Unlock Account
                    </button>
                  ) : null}
                </div>

                {!user.isLocked && user.status === 'active' && (
                  <div className="space-y-3 pt-2 border-t border-slate-800/80">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Lockout Reason</label>
                        <input
                          type="text"
                          placeholder="e.g., Abnormal view botting / multiple rapid skips"
                          value={lockReason}
                          onChange={(e) => setLockReason(e.target.value)}
                          className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Duration</label>
                        <select
                          value={lockDuration}
                          onChange={(e) => setLockDuration(e.target.value)}
                          className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                        >
                          <option value="2">2 Hours</option>
                          <option value="12">12 Hours</option>
                          <option value="24">24 Hours</option>
                          <option value="72">3 Days</option>
                          <option value="168">7 Days</option>
                          <option value="720">30 Days</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleLock('lock')}
                      disabled={submitting}
                      className="px-4 py-2 rounded-xl bg-red-600/20 text-red-300 hover:bg-red-600 hover:text-white text-xs font-bold transition-all flex items-center gap-2"
                    >
                      <Lock className="w-3.5 h-3.5" /> Apply Account Lockout
                    </button>
                  </div>
                )}
              </div>

              {/* Feature Permissions Toggles */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-white">Granular Feature Permissions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canEarn}
                      onChange={(e) => setCanEarn(e.target.checked)}
                      className="rounded border-slate-700 text-red-600 focus:ring-0"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">Can Earn Coins</p>
                      <p className="text-[10px] text-slate-400">Allow completing tasks & watches</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canPromote}
                      onChange={(e) => setCanPromote(e.target.checked)}
                      className="rounded border-slate-700 text-red-600 focus:ring-0"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">Can Create Campaigns</p>
                      <p className="text-[10px] text-slate-400">Allow spending coins on promos</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canRefer}
                      onChange={(e) => setCanRefer(e.target.checked)}
                      className="rounded border-slate-700 text-red-600 focus:ring-0"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">Can Refer Friends</p>
                      <p className="text-[10px] text-slate-400">Allow invite code bonuses</p>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSavePermissions}
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl bg-red-600 text-slate-950 font-bold text-xs hover:bg-red-500 transition-all"
                  >
                    Save Feature Permissions
                  </button>
                </div>
              </div>

              {/* Role & VIP Tier Controls */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Administrative Role</label>
                  <div className="flex gap-2 mt-1.5">
                    {['user', 'moderator', 'admin'].map((r) => (
                      <button
                        key={r}
                        onClick={() => handleRoleChange(r)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                          role === r ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">VIP Pro Membership</label>
                  <div className="mt-1.5">
                    <button
                      onClick={handleTogglePro}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        user.isPro ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      <Crown className="w-3.5 h-3.5" />
                      {user.isPro ? 'Pro VIP Active (Revoke)' : 'Grant 1-Year VIP Pro'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-6">
              {/* Credit Adjustment Box */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" /> Manual Wallet Coins Adjustment
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Coins Amount (+ / -)</label>
                    <input
                      type="number"
                      placeholder="e.g. 500 or -200"
                      value={creditAdjustment}
                      onChange={(e) => setCreditAdjustment(e.target.value)}
                      className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Adjustment Reason</label>
                    <input
                      type="text"
                      placeholder="e.g. Compensation for campaign glitch / moderation penalty"
                      value={creditReason}
                      onChange={(e) => setCreditReason(e.target.value)}
                      className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleAdjustCredits}
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all"
                  >
                    Execute Credit Adjustment
                  </button>
                </div>
              </div>

              {/* Transactions History */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300">Recent Transactions Ledger</h4>
                <div className="rounded-2xl bg-slate-950/60 border border-slate-800 overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-3">Time</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {details?.transactions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-500">No transactions on record.</td>
                        </tr>
                      ) : (
                        details?.transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-800/30">
                            <td className="p-3 text-slate-400 font-mono text-[10px]">{new Date(tx.createdAt).toLocaleTimeString()}</td>
                            <td className="p-3 capitalize font-bold text-slate-300">{tx.type.replace('_', ' ')}</td>
                            <td className={`p-3 font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                            </td>
                            <td className="p-3 text-slate-300">{tx.description}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Risk Control Header */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Risk Score: {user.riskScore || 0} / 100</h4>
                  <p className="text-[10px] text-slate-400">
                    Abuse risk score is dynamically calculated by the anti-spam velocity engine.
                  </p>
                </div>
                <button
                  onClick={handleResetRiskScore}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
                >
                  Reset Risk Score to 0
                </button>
              </div>

              {/* Incidents Feed */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300">Spam & Abuse Incident Logs</h4>
                <div className="space-y-2">
                  {details?.userIncidents.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-emerald-400 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> No spam flags or anti-cheat triggers recorded for this user.
                    </div>
                  ) : (
                    details?.userIncidents.map((inc) => (
                      <div key={inc.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            inc.severity === 'critical' || inc.severity === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {inc.actionType.replace('_', ' ')} • {inc.severity}
                          </span>
                          <span className="text-slate-500 text-[10px] font-mono">{new Date(inc.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-200">{inc.details}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Risk Impact: {inc.riskScoreBefore} ➔ {inc.riskScoreAfter} | Lockout Triggered: {inc.accountLocked ? 'Yes' : 'No'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
