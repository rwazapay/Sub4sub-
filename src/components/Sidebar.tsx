import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutGrid,
  Compass,
  Rocket,
  Gift,
  Wallet,
  Settings,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { TourTriggerButton } from './OnboardingWalkthrough';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  if (!user) return null;

  const navItems = [
    {
      label: 'Home',
      path: '/dashboard',
      icon: LayoutGrid,
      id: 'tour-sidebar-home',
      tooltip: 'Dashboard overview, analytics & quick actions',
    },
    {
      label: 'Earn Coins',
      path: '/earn',
      icon: Compass,
      id: 'tour-sidebar-earn',
      tooltip: 'Subscribe to channels & watch videos to earn free coins',
    },
    {
      label: 'Campaigns',
      path: '/campaigns',
      icon: Rocket,
      id: 'tour-sidebar-promote',
      tooltip: 'Create and track channel growth & promotion campaigns',
    },
    {
      label: 'Offers',
      path: '/offers',
      icon: Gift,
      id: 'tour-sidebar-offers',
      tooltip: 'Bonus tasks, video watching & high-reward coin offers',
    },
    {
      label: 'Wallet & Top-up',
      path: '/wallet',
      icon: Wallet,
      id: 'tour-sidebar-wallet',
      tooltip: 'Manage balance, coin packages, transactions & daily rewards',
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: Settings,
      id: 'tour-sidebar-settings',
      tooltip: 'Manage YouTube links, preferences & security',
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-30 w-64 bg-white dark:bg-[#0d0b09] border-r border-stone-200 dark:border-[#262018] p-4 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full justify-between">
          
          <div className="space-y-6">
            <div>
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-red-600 dark:text-red-500">
                Menu
              </p>
              <nav className="mt-2 space-y-1">
                {navItems.map((item) => (
                  <div key={item.path} className="relative group">
                    <NavLink
                      id={item.id}
                      to={item.path}
                      title={item.tooltip}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                          isActive
                            ? 'bg-red-600 text-white shadow-md shadow-red-600/25'
                            : 'text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#1a1612]'
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>

                    {/* Desktop Hover Tooltip */}
                    <div
                      role="tooltip"
                      className="hidden lg:group-hover:flex absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 items-center pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      <div className="bg-stone-900 dark:bg-[#1a1612] text-white dark:text-stone-200 text-[11px] font-medium py-1.5 px-3 rounded-xl border border-stone-700 dark:border-[#382f24] shadow-2xl shadow-black/80 whitespace-nowrap flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        <span>{item.tooltip}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {user.role === 'admin' && (
                  <div className="relative group mt-4">
                    <NavLink
                      to="/admin"
                      title="System moderation, user management & platform logs"
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                          isActive
                            ? 'bg-red-600 text-white'
                            : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'
                        }`
                      }
                    >
                      <Shield className="w-4 h-4 shrink-0" />
                      <span>Admin Panel</span>
                    </NavLink>

                    <div
                      role="tooltip"
                      className="hidden lg:group-hover:flex absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 items-center pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      <div className="bg-stone-900 dark:bg-[#1a1612] text-red-300 text-[11px] font-medium py-1.5 px-3 rounded-xl border border-red-500/30 shadow-2xl shadow-black/80 whitespace-nowrap flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        <span>System moderation, user management & platform logs</span>
                      </div>
                    </div>
                  </div>
                )}
              </nav>
            </div>
          </div>

          <div className="space-y-3">
            <TourTriggerButton className="w-full justify-center py-2" />

            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-[#161310] border border-stone-200 dark:border-[#262018] space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400">
                <HelpCircle className="w-4 h-4" />
                <span>Zero Anti-Cheat Tolerance</span>
              </div>
              <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                Real YouTube accounts only. Accounts faking subscriptions or unsubscribing will be permanently banned.
              </p>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
};

