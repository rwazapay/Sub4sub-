import React from 'react';
import { ShieldCheck, Lock, BookOpen, Mail, Trash2 } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 text-slate-300 py-6 text-xs sm:text-sm leading-relaxed">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-400" />
          Terms of Service
        </h1>
        <p className="text-xs text-slate-400 mt-1">Last Updated: February 2026</p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white">1. Acceptance of Terms</h2>
        <p>
          By creating an account or accessing the SubLoop Creator Network, you agree to comply with and be bound by these Terms of Service. SubLoop is a platform designed for independent content creators to discover and share promotional content.
        </p>

        <h2 className="text-base font-bold text-white">2. Creator Fair Exchange & Anti-Bot Policy</h2>
        <p>
          SubLoop strictly prohibits automated bots, fake interaction scripts, macro recorders, or fraudulent claims. All discovery activities must be performed organically by real humans. Accounts caught using automated tools or attempting to manipulate credits will be permanently banned with total credit forfeiture.
        </p>

        <h2 className="text-base font-bold text-white">3. Credit System & Purchases</h2>
        <p>
          Credits earned or purchased on SubLoop have no cash value outside the platform and cannot be redeemed for fiat currency. Credits represent promotional utility on the SubLoop discovery network. Purchases of credit packages are non-refundable except in cases of campaign rejection by moderators.
        </p>

        <h2 className="text-base font-bold text-white">4. Content Ownership & Responsibility</h2>
        <p>
          Creators retain full ownership of their channel content, videos, and social profiles. You represent that you have the right to promote any channel submitted to SubLoop and that your content complies with applicable platform guidelines (YouTube, TikTok, Instagram, X, Facebook).
        </p>
      </div>
    </div>
  );
};

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 text-slate-300 py-6 text-xs sm:text-sm leading-relaxed">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Lock className="w-6 h-6 text-emerald-400" />
          Privacy Policy
        </h1>
        <p className="text-xs text-slate-400 mt-1">Last Updated: February 2026</p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white">1. Information We Collect</h2>
        <p>
          We collect basic profile information required to operate the SubLoop network: your chosen username, email address, display name, public channel URLs, and transaction history on SubLoop.
        </p>

        <h2 className="text-base font-bold text-white">2. How We Use Information</h2>
        <p>
          Your information is used strictly to provide creator discovery, prevent fraud, maintain credit ledger integrity, send security notifications, and personalize your experience. We NEVER sell or rent your personal information to third-party data brokers.
        </p>

        <h2 className="text-base font-bold text-white">3. Security & Encryption</h2>
        <p>
          Passwords are hashed using industry-standard bcrypt algorithms. All API communications are secured via HTTPS/TLS encryption. JWT tokens are verified server-side on every request.
        </p>
      </div>
    </div>
  );
};

export const CommunityGuidelinesPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 text-slate-300 py-6 text-xs sm:text-sm leading-relaxed">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-amber-400" />
          Community Guidelines
        </h1>
        <p className="text-xs text-slate-400 mt-1">Building an Authentic Creator Community</p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white">1. Respect Fellow Creators</h2>
        <p>
          SubLoop thrives on mutual support between independent creators. Harassment, hate speech, or derogatory comments towards other creators will result in immediate suspension.
        </p>

        <h2 className="text-base font-bold text-white">2. Authentic Discovery</h2>
        <p>
          Do not engage in rapid click-and-quit loops. Discover content that genuinely interests you and connect with creators in your niche for meaningful long-term growth.
        </p>
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 text-slate-300 py-6 text-xs sm:text-sm leading-relaxed">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Mail className="w-6 h-6 text-indigo-400" />
          Contact & Support
        </h1>
        <p className="text-xs text-slate-400 mt-1">Get in touch with the SubLoop team</p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <p>
          Need help with your account, credit transactions, or creator promotions? Our support team is here to assist you.
        </p>
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-300 space-y-2">
          <p>📧 Email Support: support@subloop.co</p>
          <p>🛡️ Moderation & Appeals: safety@subloop.co</p>
          <p>🌐 Creator Community: discord.gg/subloop</p>
        </div>
      </div>
    </div>
  );
};

export const AccountDeletionPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 text-slate-300 py-6 text-xs sm:text-sm leading-relaxed">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Trash2 className="w-6 h-6 text-red-400" />
          Account Deletion Instructions
        </h1>
        <p className="text-xs text-slate-400 mt-1">How to permanently delete your SubLoop account</p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white">Right to Erasure (GDPR / CCPA)</h2>
        <p>
          You have the full right to delete your SubLoop profile and associated personal data at any time.
        </p>
        <ol className="list-decimal pl-5 space-y-2 text-slate-300">
          <li>Log in to your SubLoop account.</li>
          <li>Navigate to <strong className="text-white">Settings</strong> from the sidebar menu.</li>
          <li>Scroll to the <strong className="text-red-400">Danger Zone</strong> section at the bottom.</li>
          <li>Click <strong className="text-white">Delete Account & Purge Data</strong> and confirm your password.</li>
        </ol>
        <p className="text-xs text-slate-400">
          Alternatively, you can send an email from your registered address to <code className="text-indigo-300">privacy@subloop.co</code> with the subject "Account Deletion Request".
        </p>
      </div>
    </div>
  );
};
