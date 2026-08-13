import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { Zap, AlertCircle, ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await apiClient.post('/auth/login', {
        loginIdentifier: identifier,
        password,
      });

      if (res.data.success) {
        login(res.data.data.token, res.data.data.user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Login failed. Invalid username/email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (demoIdentifier: string, demoPass: string) => {
    setIdentifier(demoIdentifier);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#0d0b09] text-stone-900 dark:text-stone-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-amber-500 selection:text-stone-950 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        
        {/* Logo Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 shadow-xl shadow-amber-500/20">
              <Zap className="h-6 w-6 text-stone-950 fill-stone-950" />
            </div>
            <span className="text-2xl font-black text-stone-900 dark:text-white">
              Sub<span className="text-amber-500">Loop</span>
            </span>
          </Link>
          <h2 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">Welcome Back</h2>
          <p className="text-xs text-stone-600 dark:text-stone-400">Sign in to manage your creator channels and campaigns</p>
        </div>

        {/* Form Container */}
        <div className="bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          
          {/* Real Google Authentication Button */}
          <div className="space-y-3">
            <GoogleAuthButton
              buttonText="Sign in with Google Account"
              onError={(msg) => setErrorMsg(msg)}
            />
            
            <div className="relative flex items-center justify-center">
              <div className="border-t border-stone-200 dark:border-[#262018] w-full" />
              <span className="bg-white dark:bg-[#161310] px-3 text-[10px] font-extrabold uppercase tracking-wider text-stone-400 absolute">
                Or Sign In with Email
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            <div className="space-y-1.5">
              <label className="font-bold text-stone-900 dark:text-stone-200 block">Username or Email</label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. tech_rwanda or creator@subloop.co"
                className="w-full bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] rounded-2xl px-4 py-3 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-bold text-stone-900 dark:text-stone-200 block">Password</label>
                <Link to="/forgot-password" className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] rounded-2xl px-4 py-3 pr-11 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-black text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? 'Signing in...' : 'Sign In to SubLoop'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* Quick Preset Buttons */}
          <div className="pt-2 border-t border-stone-200 dark:border-[#262018]">
            <p className="text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-2">Quick Demo Accounts:</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('tech_rwanda', 'SubLoop123!')}
                className="flex-1 py-1.5 px-2.5 rounded-xl bg-stone-100 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] text-[11px] font-bold text-stone-700 dark:text-stone-300 hover:border-amber-500 transition-colors"
              >
                Tech Rwanda
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'AdminSubLoop2026!')}
                className="flex-1 py-1.5 px-2.5 rounded-xl bg-stone-100 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:border-amber-500 transition-colors"
              >
                Admin Account
              </button>
            </div>
          </div>

        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-stone-600 dark:text-stone-400 font-medium">
          New creator?{' '}
          <Link to="/register" className="font-bold text-amber-600 dark:text-amber-400 hover:underline">
            Create account & get +100 Credits
          </Link>
        </p>

      </div>
    </div>
  );
};
