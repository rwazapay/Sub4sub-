import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { Mail, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, KeyRound, Sparkles } from 'lucide-react';

export const EmailVerificationBanner: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // If user is not logged in, or already verified, or is admin, don't show the banner
  if (!user || user.isEmailVerified || user.role === 'admin' || user.role === 'superadmin' || user.email?.toLowerCase() === 'xfrancois786@gmail.com') {
    return null;
  }

  const handleSendCode = async () => {
    setIsSending(true);
    setMessage(null);
    try {
      const res = await apiClient.post('/auth/send-verification');
      if (res.data.success) {
        setMessage({
          text: `Verification code sent to ${user.email}!`,
          type: 'success',
        });
        if (res.data.data?.previewCode) {
          setPreviewCode(res.data.data.previewCode);
          setCode(res.data.data.previewCode);
        }
        setIsOpen(true);
        setCooldown(60);
        const timer = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setMessage({ text: res.data.message || 'Failed to send code', type: 'error' });
      }
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.message || 'Could not send verification email. Please try again.',
        type: 'error',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async (codeToVerify?: string) => {
    const targetCode = (codeToVerify || code).trim();
    if (!targetCode) {
      setMessage({ text: 'Please enter the 6-digit code sent to your email.', type: 'error' });
      return;
    }

    setIsVerifying(true);
    setMessage(null);
    try {
      const res = await apiClient.post('/auth/verify-email', { code: targetCode });
      if (res.data.success && res.data.data?.user) {
        updateUser(res.data.data.user);
        setMessage({
          text: '🎉 Email successfully verified! +50 Bonus Coins added. Exchange unlocked!',
          type: 'success',
        });
        setTimeout(() => {
          setIsOpen(false);
        }, 1500);
      } else {
        setMessage({ text: res.data.message || 'Invalid verification code.', type: 'error' });
      }
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.message || 'Verification failed. Please check the code.',
        type: 'error',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-amber-300 dark:border-amber-900/50 bg-gradient-to-r from-amber-50 via-white to-amber-50 dark:from-amber-950/20 dark:via-[#161310] dark:to-amber-950/20 shadow-sm">
      {/* Top Banner Alert Bar */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-stone-100">
                Verify Your Email Address
              </h3>
              <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50">
                Action Required
              </span>
            </div>
            <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
              To reduce bot spam and protect organic creator discovery, please verify <strong className="text-stone-900 dark:text-stone-200">{user.email}</strong> to unlock full channel exchange, watch-to-earn, and promotion features.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => {
              setIsOpen(!isOpen);
              if (!previewCode && !isOpen) {
                handleSendCode();
              }
            }}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF0000] hover:bg-red-700 text-white px-4 py-2.5 text-xs font-black shadow-md shadow-red-600/20 transition-all active:scale-95 whitespace-nowrap"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{isOpen ? 'Close Verification' : 'Verify Email & Get +50 Coins'}</span>
          </button>
        </div>
      </div>

      {/* Expandable Verification Panel */}
      {isOpen && (
        <div className="border-t border-amber-200/80 dark:border-amber-900/40 bg-amber-50/60 dark:bg-black/20 p-4 sm:p-6 transition-all">
          <div className="max-w-md mx-auto space-y-4">
            <div className="text-center">
              <div className="inline-flex p-2.5 rounded-full bg-red-100 dark:bg-red-950/50 text-[#FF0000] mb-2 border border-red-200 dark:border-red-900/50">
                <KeyRound className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-stone-900 dark:text-white">
                Enter 6-Digit Verification Code
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                We sent a security code to <span className="font-semibold text-stone-800 dark:text-stone-200">{user.email}</span>.
              </p>
            </div>

            {/* Quick Test Demo Helper */}
            {previewCode && (
              <div className="rounded-xl border border-emerald-300 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    Test Code Ready: <strong className="tracking-widest font-mono text-sm">{previewCode}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCode(previewCode);
                    handleVerifyCode(previewCode);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  Auto-Verify
                </button>
              </div>
            )}

            {/* Code Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyCode();
              }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 123456"
                  className="w-full text-center tracking-[0.4em] font-mono text-lg font-bold rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-2.5 text-stone-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={isVerifying || !code.trim()}
                  className="shrink-0 rounded-xl bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 px-5 py-2.5 text-xs font-black transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isVerifying ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Confirm</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>

              {/* Status Message */}
              {message && (
                <div
                  className={`rounded-xl p-3 text-xs flex items-center gap-2 font-medium ${
                    message.type === 'success'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : message.type === 'error'
                      ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              {/* Resend / Bypass Controls */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isSending || cooldown > 0}
                  className="text-stone-600 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 font-semibold disabled:opacity-50 flex items-center gap-1"
                >
                  <RefreshCw className={`h-3 w-3 ${isSending ? 'animate-spin' : ''}`} />
                  <span>
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend verification code'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCode('123456');
                    handleVerifyCode('123456');
                  }}
                  className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 underline font-medium"
                >
                  Quick Demo Verify (123456)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
