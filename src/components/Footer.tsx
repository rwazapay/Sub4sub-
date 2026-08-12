import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-12 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <Zap className="h-4 w-4 text-white fill-white" />
              </div>
              <span className="text-lg font-black tracking-tight text-white">
                Sub<span className="text-indigo-400">Loop</span>
              </span>
            </Link>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              SubLoop is a creator-powered discovery and promotion network helping independent creators discover new channels, gain authentic visibility, and grow together.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[10px] tracking-wider">Platform</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link to="/discover" className="hover:text-white transition-colors">Creator Discovery</Link></li>
              <li><Link to="/promote" className="hover:text-white transition-colors">Promote Channel</Link></li>
              <li><Link to="/leaderboard" className="hover:text-white transition-colors">Top Creators</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">Pro Pricing</Link></li>
            </ul>
          </div>

          {/* Legal & Safety */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[10px] tracking-wider">Legal & Trust</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/community-guidelines" className="hover:text-white transition-colors">Community Guidelines</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
              <li><Link to="/account-deletion" className="hover:text-white transition-colors">Account Deletion</Link></li>
            </ul>
          </div>

          {/* Rule Notice */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Legitimate Organic Exposure</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              SubLoop provides creator discovery and promotional exposure. We do not promise, require, or verify external subscriptions, likes, comments, or views.
            </p>
          </div>

        </div>

        <div className="pt-6 border-t border-slate-900 text-center text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} SubLoop Creator Network Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
