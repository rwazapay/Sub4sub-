import React, { useState } from 'react';
import {
  Sliders,
  ShieldCheck,
  Coins,
  Globe,
  Save,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  Sparkles,
} from 'lucide-react';
import { SystemSettings } from '../../types';
import { apiClient } from '../../services/api';

interface AdminWebsiteSettingsTabProps {
  settings: SystemSettings | null;
  onRefresh: () => void;
}

export const AdminWebsiteSettingsTab: React.FC<AdminWebsiteSettingsTabProps> = ({
  settings,
  onRefresh,
}) => {
  const [formData, setFormData] = useState<Partial<SystemSettings>>({
    enableSub4Sub: settings?.enableSub4Sub ?? true,
    enableVideoEarn: settings?.enableVideoEarn ?? true,
    enableReferralProgram: settings?.enableReferralProgram ?? true,
    enableComboPurchases: settings?.enableComboPurchases ?? true,
    enableRegistration: settings?.enableRegistration ?? true,
    maintenanceMode: settings?.maintenanceMode ?? false,

    dailyLoginBaseReward: settings?.dailyLoginBaseReward ?? 50,
    referralReward: settings?.referralReward ?? 100,
    sub4subBaseReward: settings?.sub4subBaseReward ?? 25,
    sub4subMutualBonus: settings?.sub4subMutualBonus ?? 25,
    videoWatchReward: settings?.videoWatchReward ?? 10,
    minWatchStaySeconds: settings?.minWatchStaySeconds ?? 10,

    minChallengeWaitSeconds: settings?.minChallengeWaitSeconds ?? 3,
    maxClaimsPerMinute: settings?.maxClaimsPerMinute ?? 6,
    autoLockoutRiskThreshold: settings?.autoLockoutRiskThreshold ?? 75,
    autoLockoutDurationHours: settings?.autoLockoutDurationHours ?? 24,
  });

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleToggle = (key: keyof SystemSettings) => {
    setFormData((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChangeNumber = (key: keyof SystemSettings, val: string) => {
    const parsed = parseInt(val, 10);
    setFormData((prev) => ({ ...prev, [key]: isNaN(parsed) ? 0 : parsed }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMessage(null);
      setErrorMessage(null);
      const res = await apiClient.put('/admin/settings', formData);
      if (res.data.success) {
        setSuccessMessage('Global website settings saved and synchronized across the platform!');
        onRefresh();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to update website settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveSettings} className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Whole Website Configuration & Controls</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live toggle core modules, adjust the token economy rewards, and set anti-bot lockout thresholds.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-lg shadow-red-600/20"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Global Settings'}</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Section 1: Global Feature Toggles */}
      <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-red-400" /> Platform Feature Toggles
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div
            onClick={() => handleToggle('enableSub4Sub')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              formData.enableSub4Sub
                ? 'bg-red-950/20 border-red-500/40 text-white'
                : 'bg-slate-950/40 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Sub4Sub Exchange</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${formData.enableSub4Sub ? 'bg-red-500/20 text-red-300' : 'bg-slate-800 text-slate-500'}`}>
                {formData.enableSub4Sub ? 'ENABLED' : 'PAUSED'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Creator-to-creator channel discovery exchange</p>
          </div>

          <div
            onClick={() => handleToggle('enableVideoEarn')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              formData.enableVideoEarn
                ? 'bg-red-950/20 border-red-500/40 text-white'
                : 'bg-slate-950/40 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Video Watch & Earn</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${formData.enableVideoEarn ? 'bg-red-500/20 text-red-300' : 'bg-slate-800 text-slate-500'}`}>
                {formData.enableVideoEarn ? 'ENABLED' : 'PAUSED'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Pay-to-watch video view campaigns</p>
          </div>

          <div
            onClick={() => handleToggle('enableReferralProgram')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              formData.enableReferralProgram
                ? 'bg-red-950/20 border-red-500/40 text-white'
                : 'bg-slate-950/40 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Referral Program</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${formData.enableReferralProgram ? 'bg-red-500/20 text-red-300' : 'bg-slate-800 text-slate-500'}`}>
                {formData.enableReferralProgram ? 'ENABLED' : 'PAUSED'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Invite code bonuses for referrers & referees</p>
          </div>

          <div
            onClick={() => handleToggle('enableComboPurchases')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              formData.enableComboPurchases
                ? 'bg-red-950/20 border-red-500/40 text-white'
                : 'bg-slate-950/40 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Combo Pack Store</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${formData.enableComboPurchases ? 'bg-red-500/20 text-red-300' : 'bg-slate-800 text-slate-500'}`}>
                {formData.enableComboPurchases ? 'ENABLED' : 'PAUSED'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Quick launch offers for subs + views combos</p>
          </div>

          <div
            onClick={() => handleToggle('enableRegistration')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              formData.enableRegistration
                ? 'bg-red-950/20 border-red-500/40 text-white'
                : 'bg-slate-950/40 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">New User Signups</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${formData.enableRegistration ? 'bg-red-500/20 text-red-300' : 'bg-slate-800 text-slate-500'}`}>
                {formData.enableRegistration ? 'OPEN' : 'CLOSED'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Allow new creators to register accounts</p>
          </div>

          <div
            onClick={() => handleToggle('maintenanceMode')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              formData.maintenanceMode
                ? 'bg-red-600 text-slate-950'
                : 'bg-slate-950/40 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Maintenance Mode</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${formData.maintenanceMode ? 'bg-black text-white' : 'bg-slate-800 text-slate-500'}`}>
                {formData.maintenanceMode ? 'ACTIVE' : 'OFF'}
              </span>
            </div>
            <p className="text-[10px] mt-1 opacity-80">Lock entire website for emergency repairs</p>
          </div>
        </div>
      </div>

      {/* Section 2: Economy & Reward Rates */}
      <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400" /> Token Economy & Reward Rates
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Daily Login Bonus (Coins)</label>
            <input
              type="number"
              value={formData.dailyLoginBaseReward}
              onChange={(e) => handleChangeNumber('dailyLoginBaseReward', e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Referral Bonus per User (Coins)</label>
            <input
              type="number"
              value={formData.referralReward}
              onChange={(e) => handleChangeNumber('referralReward', e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Sub4Sub Base Task Reward (Coins)</label>
            <input
              type="number"
              value={formData.sub4subBaseReward}
              onChange={(e) => handleChangeNumber('sub4subBaseReward', e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Sub Back Mutual Bonus (Coins)</label>
            <input
              type="number"
              value={formData.sub4subMutualBonus}
              onChange={(e) => handleChangeNumber('sub4subMutualBonus', e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Video Watch Reward (Coins)</label>
            <input
              type="number"
              value={formData.videoWatchReward}
              onChange={(e) => handleChangeNumber('videoWatchReward', e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Min Watch Time Required (Seconds)</label>
            <input
              type="number"
              value={formData.minWatchStaySeconds}
              onChange={(e) => handleChangeNumber('minWatchStaySeconds', e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Anti-Spam & Automated Lockout Rules */}
      <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Anti-Spam Velocity & Auto-Lockout Thresholds
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Auto-Lockout Risk Score</label>
            <p className="text-[10px] text-slate-500 mb-1">Score that triggers auto account lock</p>
            <input
              type="number"
              value={formData.autoLockoutRiskThreshold}
              onChange={(e) => handleChangeNumber('autoLockoutRiskThreshold', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Auto-Lockout Duration (Hours)</label>
            <p className="text-[10px] text-slate-500 mb-1">Duration of automated suspension</p>
            <input
              type="number"
              value={formData.autoLockoutDurationHours}
              onChange={(e) => handleChangeNumber('autoLockoutDurationHours', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Max Claims Per Minute</label>
            <p className="text-[10px] text-slate-500 mb-1">Rapid click bot velocity limit</p>
            <input
              type="number"
              value={formData.maxClaimsPerMinute}
              onChange={(e) => handleChangeNumber('maxClaimsPerMinute', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Min Challenge Delay (Seconds)</label>
            <p className="text-[10px] text-slate-500 mb-1">Anti-cheat countdown timer</p>
            <input
              type="number"
              value={formData.minChallengeWaitSeconds}
              onChange={(e) => handleChangeNumber('minChallengeWaitSeconds', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </form>
  );
};
