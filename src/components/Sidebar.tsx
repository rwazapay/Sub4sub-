import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Compass,
  Gift,
  Megaphone,
  Users,
  Trophy,
  Wallet,
  Bell,
  Settings,
  Shield,
  HelpCircle,
  Repeat,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  if (!user) return null;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Sub4Sub Network 🔁', path: '/discover', icon: Repeat },
    { label: 'Earn Credits', path: '/earn', icon: Gift },
    { label: 'Promote Profile', path: '/promote', icon: Megaphone },
    { label: 'My Promotions', path: '/promotions', icon: Users },
    { label: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { label: 'Wallet & Credits', path: '/wallet', icon: Wallet },
    { label: 'Notifications', path: '/notifications', icon: Bell },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-30 w-64 bg-white dark:bg-slate-950 border-r border-amber-200/80 dark:border-slate-800/80 p-4 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full justify-between">
          
          <div className="space-y-6">
            {/* Navigation Section Header */}
            <div>
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Main Menu
              </p>
              <nav className="mt-2 space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                        isActive
                          ? 'bg-yellow-400 text-slate-950 shadow-md shadow-yellow-500/20'
                          : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-amber-100 dark:hover:bg-slate-900'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 stroke-[2]" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}

                {/* Admin Link if Admin */}
                {user.role === 'admin' && (
                  <NavLink
                    to="/admin"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all mt-4 ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'text-amber-400 hover:bg-amber-500/10'
                      }`
                    }
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Control Center</span>
                  </NavLink>
                )}
              </nav>
            </div>
          </div>

          {/* Bottom Card - Safe Community Rules */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-indigo-400">
              <HelpCircle className="w-4 h-4" />
              <span>Safe Discovery Rules</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              SubLoop provides organic creator exposure. Artificial bots or engagement trades are strictly forbidden.
            </p>
          </div>

        </div>
      </aside>
    </>
  );
};
