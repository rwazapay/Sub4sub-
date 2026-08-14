import React, { useEffect, useCallback } from 'react';
import { driver, Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Compass, Rocket, Wallet, HelpCircle } from 'lucide-react';

const ONBOARDING_STORAGE_KEY = 'subloop_onboarding_completed_v1';

export function useOnboardingTour() {
  const { user } = useAuth();

  const startTour = useCallback((force = false) => {
    if (!user) return;

    // Check if on mobile or desktop to pick best target selectors
    const isMobile = window.innerWidth < 1024;

    const earnElement = isMobile
      ? (document.querySelector('#tour-mobile-earn') || document.querySelector('#tour-dashboard-earn') || '#tour-dashboard-earn')
      : (document.querySelector('#tour-sidebar-earn') || document.querySelector('#tour-dashboard-earn') || '#tour-dashboard-earn');

    const promoteElement = isMobile
      ? (document.querySelector('#tour-mobile-promote') || document.querySelector('#tour-dashboard-promote') || '#tour-dashboard-promote')
      : (document.querySelector('#tour-sidebar-promote') || document.querySelector('#tour-dashboard-promote') || '#tour-dashboard-promote');

    const walletElement = isMobile
      ? (document.querySelector('#tour-mobile-wallet') || document.querySelector('#tour-wallet-pill') || document.querySelector('#tour-dashboard-wallet') || '#tour-wallet-pill')
      : (document.querySelector('#tour-wallet-pill') || document.querySelector('#tour-sidebar-wallet') || document.querySelector('#tour-dashboard-wallet') || '#tour-wallet-pill');

    const driverObj: Driver = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: 'rgba(5, 4, 3, 0.78)',
      stagePadding: 6,
      stageRadius: 16,
      popoverClass: 'subloop-custom-popover',
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      doneBtnText: 'Start Growing! 🚀',
      steps: [
        {
          element: earnElement as any,
          popover: {
            title: '⭐ 1. Earn Coins & Discover Creators',
            description:
              'Watch authentic YouTube videos (+10 coins) and subscribe to fellow creator channels (+50 coins) to rapidly build up your coin wallet for free.',
            side: isMobile ? 'top' : 'right',
            align: 'start',
          },
        },
        {
          element: promoteElement as any,
          popover: {
            title: '🚀 2. Promote Your Channel & Videos',
            description:
              'Paste your YouTube channel link or video URL to launch automated subscriber and view campaigns with real creator engagement.',
            side: isMobile ? 'top' : 'right',
            align: 'start',
          },
        },
        {
          element: walletElement as any,
          popover: {
            title: '💰 3. Coins, Wallet & Daily Rewards',
            description:
              'Keep track of your available coins balance, claim daily login bonuses (+20 daily streak), invite creator friends (+100 coins), or top-up instantly.',
            side: isMobile ? 'bottom' : 'bottom',
            align: 'end',
          },
        },
      ],
      onDestroyed: () => {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      },
    });

    driverObj.drive();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const hasSeen = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!hasSeen) {
      // Delay slightly for elements to mount and render smoothly
      const timer = setTimeout(() => {
        startTour(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [user, startTour]);

  return { startTour };
}

/**
 * Reusable Non-Intrusive Walkthrough Tour Trigger Button
 */
export const TourTriggerButton: React.FC<{ className?: string; variant?: 'badge' | 'button' | 'icon' }> = ({
  className = '',
  variant = 'button',
}) => {
  const { startTour } = useOnboardingTour();

  if (variant === 'badge') {
    return (
      <button
        onClick={() => startTour(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500 hover:text-stone-950 transition-all ${className}`}
        title="Start Interactive Walkthrough"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Quick Tour</span>
      </button>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={() => startTour(true)}
        className={`p-2 rounded-xl bg-stone-100 dark:bg-[#161310] border border-stone-200 dark:border-[#262018] text-stone-600 dark:text-stone-300 hover:text-amber-500 hover:border-amber-500/50 transition-colors ${className}`}
        title="App Walkthrough Guide"
        aria-label="Start Walkthrough"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={() => startTour(true)}
      className={`px-3 py-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-stone-700 transition-all shadow-sm ${className}`}
      title="Take an Interactive Tour"
    >
      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
      <span>Walkthrough Tour</span>
    </button>
  );
};
