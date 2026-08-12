import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { Zap, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
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
      setErrorMsg(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-yellow-400 selection:text-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        
        {/* Logo Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-yellow-500 via-amber-400 to-yellow-300 shadow-xl shadow-yellow-500/20">
              <Zap className="h-6 w-6 text-slate-950 fill-slate-950" />
            </div>
            <span className="text-2xl font-black text-slate-900">
              Sub<span className="text-yellow-600">Loop</span>
            </span>
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back to Sub4Sub</h2>
          <p className="text-xs text-slate-600">Sign in to manage your creator channels and growth network</p>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-amber-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          
          {/* Real Google Authentication Button */}
          <div className="space-y-3">
            <GoogleAuthButton
              buttonText="Sign in with Google Account"
              onError={(msg) => setErrorMsg(msg)}
            />
            
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 absolute">
                Or Sign In with Email
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Username or Email</label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. tech_rwanda or creator@subloop.co"
                className="w-full bg-slate-50 border border-amber-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-800 block">Password</label>
                <Link to="/forgot-password" className="text-[11px] font-semibold text-amber-700 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-amber-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-slate-950 font-black text-sm shadow-md shadow-yellow-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span>{isSubmitting ? 'Signing in...' : 'Sign In to SubLoop'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-600 font-medium">
          New creator?{' '}
          <Link to="/register" className="font-bold text-amber-800 hover:underline">
            Create account & get +100 Credits
          </Link>
        </p>

      </div>
    </div>
  );
};
