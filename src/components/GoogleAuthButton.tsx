import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { User } from '../types';

interface GoogleAuthButtonProps {
  buttonText?: string;
  onSuccess?: () => void;
  onError?: (msg: string) => void;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  buttonText = 'Sign in with Google',
  onSuccess,
  onError,
}) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const executeRedirect = () => {
    if (onSuccess) onSuccess();
    navigate('/dashboard');
    setTimeout(() => {
      if (window.location.pathname.includes('/login') || window.location.pathname.includes('/register')) {
        window.location.href = '/dashboard';
      }
    }, 100);
  };

  const handleGoogleSignInClick = async () => {
    setIsAuthenticating(true);

    try {
      const provider = new GoogleAuthProvider();
      // Forces Google to show the authentic "Choose an account" screen (Screenshot 1)
      provider.setCustomParameters({ prompt: 'select_account' });

      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isMobile) {
        // Mobile browsers trigger real Google account chooser via full-page redirect
        await signInWithRedirect(auth, provider);
        return;
      }

      // Desktop & tablets use popup with redirect fallback
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        if (user && user.email) {
          const displayName = user.displayName || user.email.split('@')[0];
          const cleanUsername = displayName.toLowerCase().replace(/[^a-z0-9_]/g, '');

          const authenticatedUser: User = {
            id: `usr_${user.uid}`,
            username: cleanUsername || 'google_creator',
            displayName: displayName,
            email: user.email,
            country: 'Rwanda',
            role: 'user',
            status: 'active',
            avatar: user.photoURL || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
            bio: `Creator on SubLoop`,
            creatorCategory: 'Technology',
            credits: 100,
            totalCreditsEarned: 100,
            totalCreditsSpent: 0,
            level: 1,
            reputation: 80,
            referralCode: `SUB-${(cleanUsername || 'CREATOR').toUpperCase().slice(0, 6)}`,
            referralCount: 0,
            referralRewardsEarned: 0,
            streakDays: 1,
            dailyRewardClaimedToday: false,
            dailyDiscoveryCountToday: 0,
            riskScore: 0,
            isPro: false,
            createdAt: new Date().toISOString(),
          };

          const token = `g_token_${Date.now()}_${user.uid}`;
          login(token, authenticatedUser);

          // Background server database synchronization
          try {
            const res = await apiClient.post('/auth/google', {
              email: user.email,
              name: displayName,
              picture: user.photoURL || authenticatedUser.avatar,
              googleId: user.uid,
            });
            if (res.data?.success && res.data?.data?.user) {
              login(res.data.data.token || token, res.data.data.user);
            }
          } catch {
            // Local state preserved
          }

          executeRedirect();
          return;
        }
      } catch (popupErr: any) {
        if (popupErr?.code === 'auth/popup-blocked' || popupErr?.code === 'auth/cancelled-popup-request') {
          // If popup blocked, seamlessly redirect to accounts.google.com
          await signInWithRedirect(auth, provider);
          return;
        } else if (popupErr?.code === 'auth/popup-closed-by-user') {
          setIsAuthenticating(false);
          return;
        }
        throw popupErr;
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (onError) {
        if (err?.code === 'auth/unauthorized-domain') {
          const currentHostname = window.location.hostname;
          onError(
            `This domain (${currentHostname}) is not authorized in your Firebase Authentication settings. To authorize it: Go to Firebase Console > Authentication > Settings > Authorized domains > Add domain "${currentHostname}". In the meantime, you can sign in directly below with your email & password.`
          );
        } else {
          onError(err?.message || 'Google sign-in could not be completed. Please try again.');
        }
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignInClick}
      disabled={isAuthenticating}
      className="w-full py-3.5 px-4 rounded-2xl bg-white dark:bg-[#1c1813] hover:bg-stone-50 dark:hover:bg-[#262018] text-stone-800 dark:text-stone-100 font-bold text-xs sm:text-sm border-2 border-stone-200 dark:border-[#332b21] hover:border-amber-500 shadow-sm transition-all flex items-center justify-center gap-3 active:scale-98 relative group cursor-pointer"
    >
      {/* Official Google Vector Logo */}
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>

      <span>{isAuthenticating ? 'Connecting to Google Accounts...' : buttonText}</span>

      <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-400 uppercase tracking-wide">
        Google Auth
      </span>
    </button>
  );
};


