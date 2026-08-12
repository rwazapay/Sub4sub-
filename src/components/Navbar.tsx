import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Coins,
  Bell,
  Sun,
  Moon,
  User as UserIcon,
  LogOut,
  Settings,
  Shield,
  Menu,
  X,
  Sparkles,
  Flame,
  Zap,
} from 'lucide-react';
import { apiClient } from '../services/api';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [notifItems, setNotifItems] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      apiClient
        .get('/notifications')
        .then((res) => {
          if (res.data.success) {
            setUnreadNotifsCount(res.data.data.unreadCount || 0);
            setNotifItems(res.data.data.notifications || []);
          }
        })
        .catch(() => {});
    }
  }, [user, location.pathname]);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-200/80 bg-white/95 text-slate-900 dark:border-slate-800/80 dark:bg-slate-950/90 dark:text-slate-100 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left: Brand Logo & Mobile Toggle */}
        <div className="flex items-center gap-3">
          {user && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-yellow-500 via-amber-400 to-yellow-300 shadow-md shadow-yellow-500/20 group-hover:scale-105 transition-transform">
              <Zap className="h-5 w-5 text-slate-950 fill-slate-950" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
                Sub<span className="text-yellow-600 dark:text-yellow-400">Loop</span>
              </span>
              <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 tracking-wider -mt-1 uppercase">
                Sub4Sub & Follow4Follow
              </span>
            </div>
          </Link>
        </div>

        {/* Center/Right Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <>
              {/* Daily Streak Indicator */}
              <Link
                to="/earn"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-xs hover:bg-amber-500/20 transition-all"
              >
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>{user.streakDays} Day Streak</span>
              </Link>

              {/* Wallet Credits Badge */}
              <Link
                to="/wallet"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-400/20 border border-yellow-500/40 text-amber-900 dark:text-yellow-300 font-bold text-xs hover:border-yellow-500 transition-all shadow-sm"
              >
                <Coins className="w-4 h-4 text-yellow-600 dark:text-yellow-400 fill-yellow-400/50" />
                <span>{user.credits.toLocaleString()} Credits</span>
              </Link>

              {/* Notifications Popover */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsNotifOpen(!isNotifOpen);
                    setIsProfileMenuOpen(false);
                  }}
                  className="relative p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-amber-100 dark:hover:bg-slate-800/60 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifsCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500 text-[10px] font-black text-slate-950 ring-2 ring-white dark:ring-slate-950 animate-pulse">
                      {unreadNotifsCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-800 shadow-2xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-amber-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white text-sm">
                        <Bell className="w-4 h-4 text-yellow-600" />
                        <span>Notifications</span>
                      </div>
                      <Link
                        to="/notifications"
                        onClick={() => setIsNotifOpen(false)}
                        className="text-[11px] font-bold text-yellow-700 hover:underline"
                      >
                        View All Center →
                      </Link>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-amber-100 dark:divide-slate-800/60">
                      {notifItems.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 text-xs font-medium">
                          No notifications found.
                        </div>
                      ) : (
                        notifItems.slice(0, 5).map((item) => (
                          <div
                            key={item.id}
                            className={`p-3.5 hover:bg-amber-50/50 dark:hover:bg-slate-800/50 transition-colors ${
                              !item.isRead ? 'bg-amber-50/80 font-semibold' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-extrabold text-slate-900 dark:text-white text-xs">{item.title}</p>
                              {!item.isRead && (
                                <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                              {item.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar Menu Button */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-amber-100 dark:hover:bg-slate-800/60 transition-colors border border-amber-200 dark:border-slate-800"
                >
                  <img
                    src={user.avatar}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-yellow-400"
                  />
                  <span className="hidden md:inline-block text-xs font-bold text-slate-800 dark:text-slate-200">
                    {user.displayName}
                  </span>
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-800 shadow-2xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-amber-100 dark:border-slate-800">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{user.displayName}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate">@{user.username}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-400/20 text-yellow-800 dark:text-yellow-300 border border-yellow-400/40">
                        Level {user.level} Creator
                      </span>
                    </div>

                    <Link
                      to={`/creators/${user.username}`}
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>View Public Profile</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Account Settings</span>
                    </Link>

                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-amber-500/10 font-bold"
                      >
                        <Shield className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <div className="border-t border-amber-100 dark:border-slate-800 my-1" />

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        logout();
                        navigate('/login');
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-left font-bold"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Start Growing</span>
              </Link>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
