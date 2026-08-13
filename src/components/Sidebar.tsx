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

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  if (!user) return null;

  const navItems = [
    { label: 'Home', path: '/dashboard', icon: LayoutGrid },
    { label: 'Earn Coins', path: '/earn', icon: Compass },
    { label: 'Campaigns', path: '/campaigns', icon: Rocket },
    { label: 'Offers', path: '/offers', icon: Gift },
    { label: 'Wallet & Top-up', path: '/wallet', icon: Wallet },
    { label: 'Settings', path: '/settings', icon: Settings },
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
        className={`fixed top-16 bottom-0 left-0 z-30 w-64 bg-[#0d0b09] border-r border-[#262018] p-4 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full justify-between">
          
          <div className="space-y-6">
            <div>
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-amber-500">
                Menu
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
                          ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                          : 'text-stone-300 hover:text-white hover:bg-[#1a1612]'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}

                {user.role === 'admin' && (
                  <NavLink
                    to="/admin"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all mt-4 ${
                        isActive
                          ? 'bg-amber-500 text-stone-950'
                          : 'text-amber-400 hover:bg-amber-500/10'
                      }`
                    }
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Panel</span>
                  </NavLink>
                )}
              </nav>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#161310] border border-[#262018] space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <HelpCircle className="w-4 h-4" />
              <span>Zero Anti-Cheat Tolerance</span>
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              Real YouTube accounts only. Accounts faking subscriptions or unsubscribing will be permanently banned.
            </p>
          </div>

        </div>
      </aside>
    </>
  );
};

