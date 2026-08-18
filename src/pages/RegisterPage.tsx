import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { Zap, AlertCircle, Sparkles, ShieldCheck, CheckCircle2, Gift, Users } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const refParam = searchParams.get('ref') || '';
  const [referralCode, setReferralCode] = useState(refParam);
  const [showReferralInput, setShowReferralInput] = useState(!!refParam);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#0d0b09] text-stone-900 dark:text-stone-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-red-600 selection:text-white transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 shadow-xl shadow-red-600/25">
              <Zap className="h-6 w-6 text-stone-950 fill-stone-950" />
            </div>
            <span className="text-2xl font-black text-stone-900 dark:text-white">
               Sub<span className="text-red-500">Loop</span>
            </span>
          </Link>
          <h2 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">Create Creator Account</h2>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Sign up with Google & instantly claim <span className="text-amber-500 font-bold">+100 Welcome Coins</span>
          </p>
        </div>

        {/* Authentication Container */}
        <div className="bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          
          {/* Welcome Bonus Callout */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-red-600/15 via-amber-500/10 to-transparent border border-red-500/30 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-red-600 text-stone-950 shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-stone-900 dark:text-white">Instant Creator Welcome Package</h4>
              <p className="text-[11px] text-stone-600 dark:text-stone-400">
                New accounts automatically receive +100 Coins to launch their first campaign immediately.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Optional Referral Code Toggle */}
          <div className="space-y-2">
            {!showReferralInput ? (
              <button
                type="button"
                onClick={() => setShowReferralInput(true)}
                className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Have an invite / referral code? (+100 Bonus Coins)</span>
              </button>
            ) : (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block">
                  Friend Invite / Referral Code
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase().trim())}
                  placeholder="e.g. SUB-ABC123"
                  className="w-full bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] rounded-2xl px-4 py-2.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                />
              </div>
            )}
          </div>

          {/* Real Google Authentication Button */}
          <div className="space-y-4 pt-1">
            <GoogleAuthButton
              buttonText="Register with Google (+100 Coins)"
              referralCode={referralCode}
              onError={(msg) => setErrorMsg(msg)}
            />

            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] space-y-2">
              <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-bold text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Google Verified Creator Security</span>
              </div>
              <ul className="text-[10px] text-stone-500 dark:text-stone-400 space-y-1">
                <li>• Prevents bot accounts and ensures 100% authentic channel growth.</li>
                <li>• No manual password creation or email verification links needed.</li>
                <li>• Instant sync with YouTube, TikTok, and social channels.</li>
              </ul>
            </div>
          </div>

        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-stone-600 dark:text-stone-400 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-red-600 dark:text-red-400 hover:underline">
            Sign in with Google
          </Link>
        </p>

      </div>
    </div>
  );
};
