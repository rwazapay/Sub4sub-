import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { Zap, AlertCircle, ShieldCheck, Sparkles, Lock, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#0d0b09] text-stone-900 dark:text-stone-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-red-600 selection:text-white transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        
        {/* Logo Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 shadow-xl shadow-red-600/25">
              <Zap className="h-6 w-6 text-stone-950 fill-stone-950" />
            </div>
            <span className="text-2xl font-black text-stone-900 dark:text-white">
              Sub<span className="text-red-500">Loop</span>
            </span>
          </Link>
          <h2 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">Creator Single Sign-On</h2>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Authenticate securely with your verified Google account
          </p>
        </div>

        {/* Authentication Container */}
        <div className="bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-2">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Google-Only Authentication Policy</span>
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
              SubLoop uses Google OAuth as the single source of truth for user authentication to prevent fake accounts, bot spam, and protect creator rewards.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google Single Sign-On Button */}
          <div className="space-y-4">
            <GoogleAuthButton
              buttonText="Continue with Google"
              onError={(msg) => setErrorMsg(msg)}
            />

            <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-500 dark:text-stone-400 pt-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Instant verification</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Zero password leaks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Anti-fraud protected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Admin RBAC ready</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-stone-600 dark:text-stone-400 font-medium">
          New creator?{' '}
          <Link to="/register" className="font-bold text-red-600 dark:text-red-400 hover:underline">
            Register with Google & claim +100 Coins
          </Link>
        </p>

      </div>
    </div>
  );
};
