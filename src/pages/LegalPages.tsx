import React from 'react';
import { ShieldCheck, Lock, BookOpen, Mail, Trash2, RotateCcw } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 text-stone-800 dark:text-stone-300 py-6 text-xs sm:text-sm leading-relaxed">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <h1 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-amber-500" />
          Terms of Service & Disclaimer
        </h1>
        <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">Last Updated: February 2026</p>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] space-y-4 shadow-sm">
        <h2 className="text-base font-bold text-stone-900 dark:text-white">1. Acceptance of Terms</h2>
        <p>
          By creating an account or accessing Sub4Sub Pro, you agree to comply with and be bound by these Terms of Service. Sub4Sub Pro is a promotional discovery platform designed for independent content creators to discover and share channel content.
        </p>

        <h2 className="text-base font-bold text-base text-stone-900 dark:text-white">2. Creator Fair Exchange & Anti-Bot Policy</h2>
        <p>
          Sub4Sub Pro strictly prohibits automated bots, fake interaction scripts, macro recorders, or fraudulent claims. All discovery activities must be performed organically by real humans. Accounts caught using automated tools or attempting to manipulate coins will be permanently banned with total coin forfeiture.
        </p>

        <h2 className="text-base font-bold text-stone-900 dark:text-white">3. Coin System & Purchases</h2>
        <p>
          Coins earned or purchased on Sub4Sub Pro have no cash value outside the platform and cannot be redeemed for fiat currency. Coins represent promotional utility on the Sub4Sub Pro discovery network.
        </p>

        <h2 className="text-base font-bold text-stone-900 dark:text-white">4. Platform Disclaimer</h2>
        <p>
          Sub4Sub Pro operates independently and is not affiliated with, endorsed by, or sponsored by YouTube, Google, TikTok, Instagram, X, or Meta.
        </p>
      </div>
    </div>
  );
};

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 text-stone-800 dark:text-stone-300 py-6 text-xs sm:text-sm leading-relaxed">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <h1 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2">
          <Lock className="w-6 h-6 text-emerald-500" />
          Privacy Policy
        </h1>
        <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">Last Updated: February 2026</p>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] space-y-4 shadow-sm">
        <h2 className="text-base font-bold text-stone-900 dark:text-white">1. Information We Collect</h2>
        <p>
          We collect basic profile information required to operate the Sub4Sub Pro network: your chosen username, email address, display name, public channel URLs, and transaction history on Sub4Sub Pro.
        </p>

        <h2 className="text-base font-bold text-stone-900 dark:text-white">2. How We Use Information</h2>
        <p>
          Your information is used strictly to provide creator discovery, prevent fraud, maintain coin ledger integrity, send security notifications, and personalize your experience. We NEVER sell or rent your personal information to third-party data brokers.
        </p>

        <h2 className="text-base font-bold text-stone-900 dark:text-white">3. Security & Encryption</h2>
        <p>
          Passwords are hashed using industry-standard algorithms. All API communications are secured via HTTPS/TLS encryption.
        </p>
      </div>
    </div>
  );
};

export const RefundPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 text-stone-800 dark:text-stone-300 py-6 text-xs sm:text-sm leading-relaxed">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <h1 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2">
          <RotateCcw className="w-6 h-6 text-amber-500" />
          Refund Policy
        </h1>
        <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">Satisfaction Guarantee & Refund Eligibility</p>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] space-y-4 shadow-sm">
        <h2 className="text-base font-bold text-stone-900 dark:text-white">1. Unused Coin Package Refunds</h2>
        <p>
          If you purchased a coin pack or combo bundle on Sub4Sub Pro and have NOT spent any of the coins on active campaigns, you are eligible for a full refund within 7 days of purchase.
        </p>

        <h2 className="text-base font-bold text-stone-900 dark:text-white">2. Unfulfilled Campaigns</h2>
        <p>
          If a campaign fails to deliver promised subscriber or view completions due to technical errors or system maintenance, unused coins will be automatically re-credited to your account balance.
        </p>

        <h2 className="text-base font-bold text-stone-900 dark:text-white">3. Requesting a Refund</h2>
        <p>
          To request a refund, please email <code className="text-amber-600 dark:text-amber-400 font-mono">support@sub4subpro.com</code> with your order ID, account email, and reason for request. Refunds are processed within 3–5 business days to the original payment method.
        </p>
      </div>
    </div>
  );
};

export const CommunityGuidelinesPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 text-stone-800 dark:text-stone-300 py-6 text-xs sm:text-sm leading-relaxed">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <h1 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-amber-500" />
          Community Guidelines
        </h1>
        <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">Building an Authentic Creator Community</p>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] space-y-4 shadow-sm">
        <h2 className="text-base font-bold text-stone-900 dark:text-white">1. Respect Fellow Creators</h2>
        <p>
          Sub4Sub Pro thrives on mutual support between independent creators. Harassment, hate speech, or derogatory comments towards other creators will result in immediate suspension.
        </p>

        <h2 className="text-base font-bold text-stone-900 dark:text-white">2. Authentic Discovery</h2>
        <p>
          Do not engage in rapid click-and-quit loops. Discover content that genuinely interests you and connect with creators in your niche for meaningful long-term growth.
        </p>
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 text-stone-800 dark:text-stone-300 py-6 text-xs sm:text-sm leading-relaxed">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <h1 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2">
          <Mail className="w-6 h-6 text-amber-500" />
          Contact & Support
        </h1>
        <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">Get in touch with the Sub4Sub Pro team</p>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] space-y-4 shadow-sm">
        <p>
          Need help with your account, coin transactions, or campaign setup? Our support team is here to assist you 24/7.
        </p>
        <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] font-mono text-xs text-amber-600 dark:text-amber-400 space-y-2">
          <p>📧 Email Support: support@sub4subpro.com</p>
          <p>🛡️ Moderation & Appeals: safety@sub4subpro.com</p>
        </div>
      </div>
    </div>
  );
};

export const AccountDeletionPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 text-stone-800 dark:text-stone-300 py-6 text-xs sm:text-sm leading-relaxed">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <h1 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2">
          <Trash2 className="w-6 h-6 text-red-500" />
          Account Deletion Instructions
        </h1>
        <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">How to permanently delete your Sub4Sub Pro account</p>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] space-y-4 shadow-sm">
        <h2 className="text-base font-bold text-stone-900 dark:text-white">Right to Erasure (GDPR / CCPA)</h2>
        <p>
          You have the full right to delete your Sub4Sub Pro profile and associated personal data at any time.
        </p>
        <ol className="list-decimal pl-5 space-y-2 text-stone-700 dark:text-stone-300">
          <li>Log in to your Sub4Sub Pro account.</li>
          <li>Navigate to <strong className="text-stone-900 dark:text-white">Settings</strong> from the menu.</li>
          <li>Scroll to the <strong className="text-red-500">Danger Zone</strong> section at the bottom.</li>
          <li>Click <strong className="text-stone-900 dark:text-white">Delete Account & Purge Data</strong> and confirm your password.</li>
        </ol>
        <p className="text-xs text-stone-500 dark:text-slate-400">
          Alternatively, email <code className="text-amber-600 dark:text-amber-400">privacy@sub4subpro.com</code> with the subject "Account Deletion Request".
        </p>
      </div>
    </div>
  );
};

