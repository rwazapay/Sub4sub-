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
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const tabs = [
    { label: 'Home', path: '/dashboard', icon: LayoutGrid },
    { label: 'Earn', path: '/earn', icon: Compass },
    { label: 'Campaigns', path: '/campaigns', icon: Rocket },
    { label: 'Wallet', path: '/wallet', icon: Wallet },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d0b09] border-t border-[#262018] backdrop-blur-lg">
      <div className="flex items-center justify-around h-16 max-w-2xl mx-auto px-1">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold transition-all ${
                isActive
                  ? 'text-amber-500 font-bold scale-105'
                  : 'text-[#9c8e80] hover:text-stone-200'
              }`
            }
          >
            <tab.icon className="w-5 h-5 mb-0.5" />
            <span className="truncate text-center">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

