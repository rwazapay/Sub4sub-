import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Compass,
  Gift,
  Megaphone,
  Wallet,
  User,
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const tabs = [
    { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Discover', path: '/discover', icon: Compass },
    { label: 'Earn', path: '/earn', icon: Gift },
    { label: 'Promote', path: '/promote', icon: Megaphone },
    { label: 'Wallet', path: '/wallet', icon: Wallet },
    { label: 'Profile', path: `/creators/${user.username}`, icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-around h-16 px-1">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-all ${
                isActive
                  ? 'text-indigo-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <tab.icon className="w-5 h-5 mb-0.5" />
            <span className="truncate max-w-[60px] text-center">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
