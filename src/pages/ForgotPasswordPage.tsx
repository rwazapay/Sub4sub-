import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ShieldCheck, ArrowLeft, ExternalLink, KeyRound } from 'lucide-react';
import { GoogleAuthButton } from '../components/GoogleAuthButton';

export const ForgotPasswordPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#0d0b09] text-stone-900 dark:text-stone-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-red-600 selection:text-white transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 shadow-xl shadow-red-600/25">
              <Zap className="h-6 w-6 text-stone-950 fill-stone-950" />
            </div>
            <span className="text-2xl font-black text-stone-900 dark:text-white">
              Sub<span className="text-red-500">Loop</span>
            </span>
          </Link>
          <h2 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">Account Recovery</h2>
          <p className="text-xs text-stone-600 dark:text-stone-400">Manage your Google OAuth account security</p>
        </div>

        <div className="bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
              <KeyRound className="w-4 h-4 shrink-0" />
              <span>Google Single Sign-On Account</span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              SubLoop accounts are authenticated exclusively through your verified Google account. You do not have a separate password stored on SubLoop.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">
              Need to access or recover your account?
            </h4>
            
            <GoogleAuthButton buttonText="Sign In with Google" />

            <div className="pt-2">
              <a
                href="https://accounts.google.com/signin/recovery"
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-2xl bg-stone-100 dark:bg-[#1f1a14] hover:bg-stone-200 dark:hover:bg-[#2c241c] text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center justify-center gap-2 transition-all border border-stone-200 dark:border-[#332b21]"
              >
                <span>Google Account Recovery Center</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-200 dark:border-[#262018] text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Sign In</span>
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
};
