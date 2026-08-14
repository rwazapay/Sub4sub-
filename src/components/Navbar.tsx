import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Coins,
  Plus,
  Menu,
  X,
  UserPlus,
  Mail,
  ShieldCheck,
  FileText,
  RotateCcw,
  Moon,
  Sun,
  LogOut,
  Shield,
  Copy,
  Check,
  Settings,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const copyInvite = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user.referralCode}`);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#262018] dark:border-[#262018] bg-white dark:bg-[#0d0b09]/95 text-stone-900 dark:text-stone-100 backdrop-blur-md transition-colors">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
          
          {/* Left: Sub4Sub Pro Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-stone-950 font-black shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Coins className="h-5 w-5 text-stone-950 fill-stone-950" />
              </div>
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-stone-900 dark:text-white font-sans">
                Sub4Sub <span className="text-amber-500">Pro</span>
              </span>
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                {/* Plus Button - Create Campaign */}
                <Link
                  id="tour-create-btn"
                  to="/campaigns"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-stone-950 transition-all font-black text-sm"
                  title="Create Campaign"
                >
                  <Plus className="w-4 h-4" />
                </Link>

                {/* Settings Button */}
                <Link
                  to="/settings"
                  className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 dark:bg-[#1c1813] border border-stone-200 dark:border-[#332b21] text-stone-700 dark:text-stone-300 hover:text-amber-500 hover:border-amber-500/60 transition-all"
                  title="Settings & Profile"
                >
                  <Settings className="w-4 h-4" />
                </Link>

                {/* Coin Balance Pill */}
                <Link
                  id="tour-wallet-pill"
                  to="/wallet"
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-stone-100 dark:bg-[#1c1813] border border-stone-200 dark:border-[#332b21] text-amber-600 dark:text-amber-400 font-extrabold text-xs hover:border-amber-500/60 transition-all"
                  title="Coins & Wallet"
                >
                  <Coins className="w-4 h-4 text-amber-500 fill-amber-500/30" />
                  <span>{user.credits.toLocaleString()}</span>
                </Link>

                {/* Hamburger / Menu Icon Button representing Drawer Menu on Mobile & Desktop */}
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="flex items-center justify-center p-2 rounded-xl bg-stone-100 dark:bg-[#161310] border border-stone-200 dark:border-[#262018] text-stone-800 dark:text-stone-200 hover:text-amber-500 hover:border-amber-500/50 transition-colors shadow-xs"
                  aria-label="Open Navigation Menu"
                  title="Navigation Menu"
                >
                  <Menu className="w-5 h-5 sm:w-5 sm:h-5 text-stone-800 dark:text-stone-200" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Slide-over Drawer Overlay */}
      {isDrawerOpen && user && (
        <div className="fixed inset-0 z-50 flex justify-start">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Content Side Panel */}
          <div className="relative w-full max-w-xs bg-white dark:bg-[#0d0b09] text-stone-900 dark:text-stone-100 h-full shadow-2xl flex flex-col justify-between z-10 border-r border-stone-200 dark:border-[#262018] animate-in slide-in-from-left duration-200">
            
            <div className="p-5 space-y-6 overflow-y-auto">
              
              {/* Profile Header in Drawer */}
              <div className="flex items-start justify-between pb-4 border-b border-stone-200 dark:border-[#262018]">
                <Link
                  to="/settings"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-3 group"
                >
                  <img
                    src={user.avatar}
                    alt={user.displayName}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-500 group-hover:scale-105 transition-transform"
                  />
                  <div>
                    <h3 className="font-bold text-stone-900 dark:text-white text-sm group-hover:text-amber-500 transition-colors flex items-center gap-1">
                      <span>{user.displayName}</span>
                      <Settings className="w-3.5 h-3.5 text-amber-500 opacity-70" />
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate max-w-[170px]">{user.email}</p>
                  </div>
                </Link>

                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-lg hover:bg-stone-100 dark:hover:bg-[#1a1612]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Links */}
              <nav className="space-y-1 text-sm font-semibold">
                
                <Link
                  to="/settings"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-3.5 px-3 py-3 rounded-xl text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#161310] transition-colors"
                >
                  <Settings className="w-4 h-4 text-amber-500" />
                  <span>Settings & Profile</span>
                </Link>

                <Link
                  to="/wallet"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-3.5 px-3 py-3 rounded-xl text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#161310] transition-colors"
                >
                  <Plus className="w-4 h-4 text-amber-500" />
                  <span>Buy coins</span>
                </Link>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setShowInviteModal(true);
                  }}
                  className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#161310] transition-colors text-left"
                >
                  <UserPlus className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                  <span>Invite friends</span>
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setShowContactModal(true);
                  }}
                  className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#161310] transition-colors text-left"
                >
                  <Mail className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                  <span>Contact us</span>
                </button>

                <Link
                  to="/privacy"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-3.5 px-3 py-3 rounded-xl text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#161310] transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                  <span>Privacy Policy</span>
                </Link>

                <Link
                  to="/terms"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-3.5 px-3 py-3 rounded-xl text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#161310] transition-colors"
                >
                  <FileText className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                  <span>Terms & Disclaimer</span>
                </Link>

                <Link
                  to="/refund"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-3.5 px-3 py-3 rounded-xl text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#161310] transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                  <span>Refund Policy</span>
                </Link>

                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center gap-3.5 px-3 py-3 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 font-bold"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Control Panel</span>
                  </Link>
                )}

              </nav>

            </div>

            {/* Bottom Controls: Theme Toggle & Logout */}
            <div className="p-5 border-t border-stone-200 dark:border-[#262018] space-y-2 text-sm font-semibold">
              <button
                onClick={() => {
                  toggleTheme();
                }}
                className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#161310] transition-colors text-left"
              >
                {isDark ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Switch to light mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-stone-700" />
                    <span>Switch to dark mode</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-6 text-stone-900 dark:text-stone-100 relative space-y-4 shadow-2xl">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-full bg-stone-100 dark:bg-[#201b16]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">Invite Friends & Earn Coins</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Share your invite link with other content creators. Get 100 free coins when they join!
              </p>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-[#0d0b09] rounded-2xl border border-stone-200 dark:border-[#262018] flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-mono text-amber-600 dark:text-amber-400 font-bold">
                {window.location.origin}/register?ref={user.referralCode}
              </span>
              <button
                onClick={copyInvite}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1 shrink-0"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-6 text-stone-900 dark:text-stone-100 relative space-y-4 shadow-2xl">
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-full bg-stone-100 dark:bg-[#201b16]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">Contact Sub4Sub Pro Support</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Need help with campaign credits, order fulfillment, or account issues?
              </p>
            </div>

            <div className="p-4 bg-stone-50 dark:bg-[#0d0b09] rounded-2xl border border-stone-200 dark:border-[#262018] space-y-2 text-xs">
              <p className="font-bold text-stone-900 dark:text-white">Email Support:</p>
              <p className="text-amber-600 dark:text-amber-400 font-mono">support@sub4subpro.com</p>
              <p className="text-stone-500 dark:text-stone-400 text-[11px] pt-1">
                Average response time: 15–30 minutes (24/7 Creator Care)
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

