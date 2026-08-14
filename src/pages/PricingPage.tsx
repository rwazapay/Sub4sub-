import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Check, Zap, Coins } from 'lucide-react';
import { Footer } from '../components/Footer';

export const PricingPage: React.FC = () => {
  return (
    <div className="space-y-12 animate-fade-in pb-12 font-sans">
      
      {/* Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3 pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold text-xs">
          <Sparkles className="w-3.5 h-3.5 text-red-300" />
          <span>Transparent Creator Plans</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Choose Your Creator Growth Pace
        </h1>
        <p className="text-slate-300 text-sm sm:text-base">
          Start 100% free with welcome bonus credits or upgrade to Pro Creator for boosted discovery reach and priority feed placement.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        
        {/* Free Plan */}
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-800 text-slate-300">
              Free Creator
            </span>

            <div>
              <h2 className="text-3xl font-black text-white">$0 <span className="text-sm font-normal text-slate-400">/ forever</span></h2>
              <p className="text-xs text-slate-400 mt-1">Perfect for new creators getting discovered.</p>
            </div>

            <ul className="space-y-3 text-xs text-slate-300 pt-2">
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> 100 Welcome Bonus Credits</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Earn unlimited credits via discovery</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Daily login streak bonuses</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Connect up to 3 social handles</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Standard feed ranking</li>
            </ul>
          </div>

          <Link
            to="/register"
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs text-center transition-all"
          >
            Get Started Free
          </Link>
        </div>

        {/* Pro Plan */}
        <div className="p-8 rounded-3xl bg-gradient-to-b from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/50 space-y-6 flex flex-col justify-between shadow-2xl relative">
          <span className="absolute -top-3.5 right-8 px-3.5 py-1 rounded-full text-[10px] font-black uppercase bg-indigo-500 text-white shadow-lg">
            RECOMMENDED
          </span>

          <div className="space-y-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-indigo-500/20 text-indigo-300">
              Pro Creator
            </span>

            <div>
              <h2 className="text-3xl font-black text-white">$9.99 <span className="text-sm font-normal text-slate-400">/ month</span></h2>
              <p className="text-xs text-indigo-300 mt-1">Accelerate your channel discovery and reach.</p>
            </div>

            <ul className="space-y-3 text-xs text-slate-300 pt-2">
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> +1,500 Monthly Bonus Credits</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Priority discovery feed placement</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> 2x Daily login streak bonus multiplier</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Unlimited connected social handles</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Advanced analytics & CTR breakdowns</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Verified Pro Creator Badge</li>
            </ul>
          </div>

          <Link
            to="/wallet"
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs text-center shadow-lg shadow-indigo-600/30 transition-all"
          >
            Upgrade to Pro Creator
          </Link>
        </div>

      </div>

    </div>
  );
};
