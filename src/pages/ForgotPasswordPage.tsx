import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../services/api';
import { Zap, CheckCircle2, ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600">
              <Zap className="h-6 w-6 text-white fill-white" />
            </div>
            <span className="text-2xl font-black text-white">Sub<span className="text-indigo-400">Loop</span></span>
          </Link>
          <h2 className="text-2xl font-black text-white">Reset Password</h2>
          <p className="text-xs text-slate-400">Enter your registered email address to receive reset instructions</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          {submitted ? (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="font-bold text-white text-base">Check Your Inbox</h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                If an account exists for <strong>{email}</strong>, password recovery instructions have been sent.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-indigo-400 font-bold text-xs hover:underline pt-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Login</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="creator@subloop.co"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30 transition-all"
              >
                {isSubmitting ? 'Sending Request...' : 'Send Password Reset Email'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
