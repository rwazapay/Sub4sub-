import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Compass,
  Gift,
  Megaphone,
  ShieldCheck,
  TrendingUp,
  Award,
  Smartphone,
  ChevronRight,
  Zap,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Globe2,
} from 'lucide-react';
import { Footer } from '../components/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-600 selection:text-slate-900">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-28 md:pb-32 bg-gradient-to-b from-amber-500/10 via-yellow-100/30 to-slate-50">
        
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/15 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/30 border border-yellow-500/40 text-yellow-900 font-extrabold text-xs sm:text-sm">
            <Sparkles className="w-4 h-4 text-yellow-600" />
            <span>Real Sub4Sub & Follow4Follow Creator Network</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-900 leading-tight max-w-4xl mx-auto">
            Sub4Sub & Follow4Follow. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-yellow-600 via-amber-600 to-yellow-700 bg-clip-text text-transparent">
              Sub to Grow Together.
            </span>
          </h1>

          <p className="text-slate-700 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
            SubLoop is the ultimate Sub4Sub and Follow4Follow exchange network. Subscribe to other creators on YouTube, TikTok, Instagram, and X to get real subscribers and followers back instantly!
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-base shadow-xl shadow-red-600/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Join Sub4Sub Network Free</span>
              <ChevronRight className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </Link>

            <Link
              to="/discover"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-amber-50 text-slate-900 font-bold text-base border border-amber-300 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Compass className="w-5 h-5 text-yellow-600" />
              <span>Browse Sub4Sub Feed</span>
            </Link>
          </div>

          {/* Social Proof Bar */}
          <div className="pt-12 flex flex-wrap items-center justify-center gap-8 text-xs font-extrabold text-slate-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Instant Reciprocal Sub Backs</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-red-600" />
              <span>YouTube, TikTok, Instagram, X & Facebook</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-yellow-600" />
              <span>Anti-Unsub Guarantee & Credit Protection</span>
            </div>
          </div>

        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white border-y border-amber-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-yellow-700">How Sub4Sub & Follow4Follow Works</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900">Simple 3-Step Sub4Sub Engine</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="bg-amber-50/50 border border-amber-200 rounded-3xl p-8 space-y-4 hover:border-yellow-400 transition-all group shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-red-600/30 text-slate-950 flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-yellow-600" /> Subscribe / Follow Creator
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Choose creators from the Sub4Sub feed, subscribe or follow their channel, and earn +20 Credits.
              </p>
            </div>

            <div className="bg-amber-50/50 border border-amber-200 rounded-3xl p-8 space-y-4 hover:border-red-400 transition-all group shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-red-500/30 text-slate-950 flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Gift className="w-5 h-5 text-red-600" /> Creator Subscribes Back
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                The creator receives an instant alert to Sub Back to your channel to earn +30 Credits and form a mutual partnership.
              </p>
            </div>

            <div className="bg-amber-50/50 border border-amber-200 rounded-3xl p-8 space-y-4 hover:border-yellow-400 transition-all group shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-red-600/30 text-slate-950 flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-yellow-600" /> Rapid Audience Growth
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Use earned credits to feature your channel at the top of the Sub4Sub queue and gain hundreds of real subscribers daily!
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        <div className="text-center space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-yellow-700">Everything Creators Need</h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900">Built for Independent Content Creators</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="p-6 rounded-2xl bg-white border border-amber-200 space-y-3 shadow-sm">
            <Compass className="w-8 h-8 text-yellow-600" />
            <h4 className="font-bold text-slate-900 text-base">Creator Discovery</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Find creators in Gaming, Tech, Music, Lifestyle, and Education from Africa and around the globe.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-amber-200 space-y-3 shadow-sm">
            <Megaphone className="w-8 h-8 text-red-600" />
            <h4 className="font-bold text-slate-900 text-base">Promotion Campaigns</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Target specific categories and platforms with customizable promotion budgets and durations.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-amber-200 space-y-3 shadow-sm">
            <BarChart3 className="w-8 h-8 text-emerald-600" />
            <h4 className="font-bold text-slate-900 text-base">Real-time Analytics</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Track impressions, unique discovery visits, clicks, and credit efficiency with visual charts.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-amber-200 space-y-3 shadow-sm">
            <Award className="w-8 h-8 text-yellow-600" />
            <h4 className="font-bold text-slate-900 text-base">Gamified Leaderboards</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Climb the ranks, unlock daily streak multipliers, and earn reputation badges in the community.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-amber-200 space-y-3 shadow-sm">
            <ShieldCheck className="w-8 h-8 text-teal-600" />
            <h4 className="font-bold text-slate-900 text-base">Safe Community</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              No artificial engagement exchanges or channel password requirements. 100% compliant and safe.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-amber-200 space-y-3 shadow-sm">
            <Smartphone className="w-8 h-8 text-pink-600" />
            <h4 className="font-bold text-slate-900 text-base">Mobile Optimized</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Designed mobile-first to run fast on low-bandwidth networks and mobile devices.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-amber-200 space-y-3 shadow-sm">
            <Gift className="w-8 h-8 text-orange-600" />
            <h4 className="font-bold text-slate-900 text-base">Daily Rewards & Streaks</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Claim daily login bonuses and referral rewards to power your creator promotional campaigns.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-amber-200 space-y-3 shadow-sm">
            <Globe2 className="w-8 h-8 text-red-600" />
            <h4 className="font-bold text-slate-900 text-base">Global & African Focus</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Highlighting emerging African digital creators while remaining globally scalable worldwide.
            </p>
          </div>

        </div>

      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white border-t border-amber-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-yellow-700">Got Questions?</h2>
            <p className="text-3xl font-extrabold text-slate-900">Frequently Asked Questions</p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            
            <div className="p-6 rounded-2xl bg-amber-50/40 border border-amber-200 space-y-2">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-yellow-600" />
                Does SubLoop sell subscribers or views?
              </h3>
              <p className="text-slate-700 leading-relaxed">
                <strong>No. Never.</strong> SubLoop provides creator discovery and promotional exposure. We do not sell, guarantee, or mandate subscribers, likes, comments, or views on external platforms. Credits are used only for internal platform visibility.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-amber-50/40 border border-amber-200 space-y-2">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-yellow-600" />
                Is SubLoop free to use?
              </h3>
              <p className="text-slate-700 leading-relaxed">
                Yes! Every creator receives 100 bonus credits upon registration. You can earn unlimited credits by completing daily discovery activities, maintaining streaks, and inviting other creators.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-amber-50/40 border border-amber-200 space-y-2">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-yellow-600" />
                Which platforms are supported?
              </h3>
              <p className="text-slate-700 leading-relaxed">
                SubLoop supports YouTube channels, TikTok profiles, Instagram accounts, Facebook pages, and X handles.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Footer */}
      <Footer />

    </div>
  );
};
