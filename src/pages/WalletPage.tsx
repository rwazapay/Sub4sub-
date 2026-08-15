import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { CreditPackage, CreditTransaction } from '../types';
import { Link } from 'react-router-dom';
import {
  Coins,
  CreditCard,
  History,
  CheckCircle2,
  Sparkles,
  Zap,
  Lock,
  Send,
  Gift,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Snowflake,
  ShieldAlert,
  Tv,
  Users,
  Info,
} from 'lucide-react';
import { DailyRewardCard } from '../components/DailyRewardCard';

export const WalletPage: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [txFilter, setTxFilter] = useState<'all' | 'bonus' | 'purchase' | 'spent'>('all');

  // Purchase modal
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccessMsg, setPurchaseSuccessMsg] = useState<string | null>(null);

  // Transfer Modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('50');
  const [transferNote, setTransferNote] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferStatus, setTransferStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Refund Modal (Frozen / Under active development)
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [isCheckingRefund, setIsCheckingRefund] = useState(false);
  const [refundResponseMsg, setRefundResponseMsg] = useState<string | null>(null);

  // Daily Claim State
  const [isClaimingDaily, setIsClaimingDaily] = useState(false);
  const [dailyClaimMsg, setDailyClaimMsg] = useState<string | null>(null);

  const fetchWalletData = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/wallet');
      if (res.data.success) {
        setPackages(res.data.data.packages || []);
        setTransactions(res.data.data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to load wallet data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setIsPurchasing(true);
    setPurchaseSuccessMsg(null);

    try {
      const res = await apiClient.post('/wallet/purchase', {
        packageId: selectedPackage.id,
      });

      if (res.data?.message) {
        setPurchaseSuccessMsg(res.data.message);
      } else {
        setPurchaseSuccessMsg(
          'Coin purchases via payment gateway are coming soon! While live payment integration is being finalized, coin packages are available to preview only. To get free coins right now, please subscribe to channels and watch video views on Discover!'
        );
      }
    } catch (err: any) {
      setPurchaseSuccessMsg(
        err.response?.data?.message ||
          'Coin purchases via payment gateway are currently under active development and coming soon. To get free coins right now, please subscribe to channels and watch video views on Discover!'
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleClaimDailyBonus = async () => {
    setIsClaimingDaily(true);
    setDailyClaimMsg(null);

    try {
      let res;
      try {
        res = await apiClient.post('/wallet/daily-claim');
      } catch {
        res = await apiClient.post('/auth/daily-streak-claim');
      }

      if (res.data?.success) {
        setDailyClaimMsg(`🎉 ${res.data.message}`);
        if (res.data.data?.user) {
          updateUser(res.data.data.user);
        } else if (user) {
          updateUser({
            ...user,
            credits: res.data.data?.newBalance ?? user.credits + (res.data.data?.bonusCoins || 25),
            dailyRewardClaimedToday: true,
          });
        }
        fetchWalletData();
      }
    } catch (err: any) {
      setDailyClaimMsg(err.response?.data?.message || 'Failed to claim daily reward.');
    } finally {
      setIsClaimingDaily(false);
    }
  };

  const handleOpenRefundModal = async () => {
    setShowRefundModal(true);
    setIsCheckingRefund(true);
    setRefundResponseMsg(null);
    try {
      const res = await apiClient.post('/wallet/refund-request');
      if (res.data) {
        setRefundResponseMsg(res.data.message);
      }
    } catch {
      setRefundResponseMsg(
        'Coin token refunds are temporarily unavailable and frozen while our live payment gateway integration is being finalized. In the meantime, you can easily earn 100% free coins by subscribing to channels, watching videos, and completing daily streaks!'
      );
    } finally {
      setIsCheckingRefund(false);
    }
  };

  const handleTransferCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferRecipient || !transferAmount) return;

    setIsTransferring(true);
    setTransferStatus(null);

    try {
      const res = await apiClient.post('/wallet/transfer', {
        recipientUsername: transferRecipient,
        amount: parseInt(transferAmount, 10),
        note: transferNote,
      });

      if (res.data.success) {
        setTransferStatus({ type: 'success', msg: res.data.message });
        if (user) {
          updateUser({
            ...user,
            credits: res.data.data.newBalance,
          });
        }
        setTimeout(() => {
          setShowTransferModal(false);
          setTransferRecipient('');
          setTransferAmount('50');
          setTransferNote('');
          setTransferStatus(null);
          fetchWalletData();
        }, 2000);
      }
    } catch (err: any) {
      setTransferStatus({
        type: 'error',
        msg: err.response?.data?.message || 'Coin transfer failed.',
      });
    } finally {
      setIsTransferring(false);
    }
  };

  if (!user) return null;

  const filteredTransactions = transactions.filter((tx) => {
    if (txFilter === 'all') return true;
    return tx.type === txFilter;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950/50 to-stone-900 border border-red-500/30 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
            <Coins className="w-4 h-4" />
            <span>Advanced Coin Management & Wallet</span>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-red-600/15 text-red-300 border border-red-500/30">
            Real-Time Balance
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Manage Coins & Power Creator Campaigns
        </h1>
        <p className="text-stone-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
          Platform coins fuel your channel promotion campaigns, reward engagement, and allow peer gifting across creators globally.
        </p>

        {/* Quick Actions */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowTransferModal(true)}
            className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs transition-all flex items-center gap-2 shadow-md active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>Gift / Transfer Coins</span>
          </button>
          
          <a
            href="#coin-store"
            className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-bold text-xs transition-all flex items-center gap-2 border border-stone-700 active:scale-95"
          >
            <CreditCard className="w-4 h-4 text-red-400" />
            <span>Buy Coin Packages</span>
          </a>

          <button
            onClick={handleOpenRefundModal}
            className="py-2.5 px-4 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 font-bold text-xs transition-all flex items-center gap-2 border border-blue-500/30 active:scale-95"
          >
            <Snowflake className="w-4 h-4 text-blue-400" />
            <span>Coin Refund</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Frozen / Soon
            </span>
          </button>
        </div>
      </div>

      {/* Coin Refund & Cashout Status Banner (Under Active Development) */}
      <div className="bg-gradient-to-r from-blue-950/40 via-stone-900 to-stone-900 border border-blue-500/30 rounded-3xl p-6 sm:p-7 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shrink-0 mt-0.5 sm:mt-0">
              <Snowflake className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-stone-900 dark:text-white text-base">
                  Coin Refund & Token Cashout
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Temporarily Frozen (In Development)
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1 max-w-xl leading-relaxed">
                We are currently integrating automated live payment gateways. Coin token refund is paused during this upgrade and will be enabled soon.
              </p>
            </div>
          </div>
          
          <button
            onClick={handleOpenRefundModal}
            className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs border border-stone-700 hover:border-blue-500/40 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-blue-400" />
            <span>Refund Info & Status</span>
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-xs text-stone-300">
              <strong className="text-white">How to get coins freely right now:</strong> Subscribe to channels, watch video views on Discover & Earn, and claim your daily streak rewards!
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/discover"
              className="py-2 px-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Subscribe & Earn</span>
            </Link>
            <Link
              to="/offers"
              className="py-2 px-3.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs border border-stone-700 transition-all flex items-center gap-1.5"
            >
              <Tv className="w-3.5 h-3.5 text-red-400" />
              <span>Watch Views</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Daily Check-in Card & Balance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Bonus Claim Card */}
        <div className="lg:col-span-1">
          <DailyRewardCard onRewardClaimed={() => fetchWalletData()} />
        </div>

        {/* Balance Metrics */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] space-y-2 shadow-sm">
            <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block">
              Available Coins
            </span>
            <p className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-red-300">
              {user.credits.toLocaleString()}{' '}
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Coins</span>
            </p>
            <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">Ready for campaigns & gifts</p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] space-y-2 shadow-sm">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Total Earned
            </span>
            <p className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white">
              +{user.totalCreditsEarned.toLocaleString()}{' '}
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Coins</span>
            </p>
            <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">Discoveries & bonuses</p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] space-y-2 shadow-sm">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
              Total Promoted
            </span>
            <p className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white">
              {user.totalCreditsSpent.toLocaleString()}{' '}
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Coins</span>
            </p>
            <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">Campaign growth spent</p>
          </div>
        </div>

      </div>

      {/* Credit Store Packages */}
      <div id="coin-store" className="bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-red-500" />
              Coin Top-Up Packages
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Boost your channel campaigns instantly with promotional coin bundles
            </p>
          </div>
          <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-blue-500/10 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/30 shrink-0 flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            Payment Gateway Coming Soon
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`p-6 rounded-3xl border flex flex-col justify-between space-y-6 transition-all ${
                pkg.isPopular
                  ? 'bg-gradient-to-b from-amber-500/10 via-stone-900 to-stone-900 border-red-500/50 shadow-xl text-white'
                  : 'bg-stone-50 dark:bg-[#0d0b09] border-stone-200 dark:border-[#262018] hover:border-red-500 dark:hover:border-red-500/50'
              }`}
            >
              <div className="space-y-4">
                {pkg.isPopular && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-red-600 text-stone-950 inline-block">
                    MOST POPULAR
                  </span>
                )}

                <div>
                  <h3 className="font-extrabold text-stone-900 dark:text-white text-lg">{pkg.name}</h3>
                  <p className="text-3xl font-black text-red-500 dark:text-red-300 mt-2">
                    {pkg.credits.toLocaleString()} <span className="text-xs font-normal text-stone-500 dark:text-stone-400">Coins</span>
                  </p>
                  <p className="text-xs font-bold text-stone-700 dark:text-stone-300 mt-1">${pkg.priceUsd} USD</p>
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">{pkg.description}</p>
              </div>

              <button
                onClick={() => setSelectedPackage(pkg)}
                className="w-full py-3 px-4 rounded-2xl bg-stone-800 hover:bg-stone-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-stone-700 hover:border-red-500/50"
              >
                <Coins className="w-4 h-4 text-amber-400" />
                <span>{pkg.name} (${pkg.priceUsd})</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History & Filterable Ledger */}
      <div className="bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" />
            Coin Transaction Ledger
          </h2>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 dark:bg-[#0d0b09] p-1 rounded-2xl border border-stone-200 dark:border-[#262018]">
            {(['all', 'bonus', 'purchase', 'spent'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTxFilter(filter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold capitalize transition-all ${
                  txFilter === filter
                    ? 'bg-red-600 text-stone-950 shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <p className="text-xs text-stone-500 dark:text-stone-400 py-6 text-center">
            No transactions found for filter "{txFilter}".
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300">
              <thead className="bg-stone-50 dark:bg-[#0d0b09] text-stone-500 dark:text-stone-400 uppercase text-[10px] font-bold border-b border-stone-200 dark:border-[#262018]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Coins</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-[#262018]">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-stone-50 dark:hover:bg-[#1a1612]">
                    <td className="py-3.5 px-4 text-stone-500 dark:text-stone-400 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-stone-200 dark:bg-[#201b15] text-stone-800 dark:text-stone-200">
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate font-medium">{tx.description}</td>
                    <td className="py-3.5 px-4 text-right font-extrabold whitespace-nowrap">
                      <span className={tx.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}>
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Coins
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Gift / Transfer Coins Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative text-stone-900 dark:text-stone-100">
            
            <button
              onClick={() => setShowTransferModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-stone-100 dark:hover:bg-[#262018] text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-wider">
                <Gift className="w-4 h-4" />
                <span>Peer Coin Transfer</span>
              </div>
              <h2 className="text-xl font-black text-stone-900 dark:text-white">Gift Coins to Creator</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Send platform coins directly to support another creator's channel promotions
              </p>
            </div>

            {transferStatus && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                  transferStatus.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{transferStatus.msg}</span>
              </div>
            )}

            <form onSubmit={handleTransferCoins} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
                  Recipient Username
                </label>
                <input
                  type="text"
                  required
                  value={transferRecipient}
                  onChange={(e) => setTransferRecipient(e.target.value)}
                  placeholder="e.g. tech_rwanda or alex"
                  className="w-full bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] rounded-2xl px-4 py-3 text-stone-900 dark:text-white placeholder-stone-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
                  Coins Amount (Your Balance: {user.credits} Coins)
                </label>
                <input
                  type="number"
                  min="1"
                  max={user.credits}
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] rounded-2xl px-4 py-3 text-stone-900 dark:text-white placeholder-stone-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
                  Gift Note (Optional)
                </label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="e.g. Keep up the great YouTube videos!"
                  className="w-full bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] rounded-2xl px-4 py-2.5 text-stone-900 dark:text-white placeholder-stone-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <button
                type="submit"
                disabled={isTransferring || user.credits < parseInt(transferAmount || '0', 10)}
                className="w-full py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-stone-950 font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>{isTransferring ? 'Transferring Coins...' : `Confirm Transfer (${transferAmount} Coins)`}</span>
              </button>
            </form>

          </div>
        </div>
      )}

      {/* Checkout Top-Up Modal (Packages Available / Payment Gateway Coming Soon) */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-[#161310] border border-blue-500/30 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative text-stone-900 dark:text-stone-100">
            
            <button
              onClick={() => setSelectedPackage(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-stone-100 dark:hover:bg-[#262018] text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Payment Gateway Coming Soon
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-800 text-stone-300">
                  Preview Mode
                </span>
              </div>
              <h2 className="text-xl font-black text-stone-900 dark:text-white">
                {selectedPackage.name}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Package bundle containing {selectedPackage.credits.toLocaleString()} Coins
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] flex items-center justify-between font-bold">
              <span className="text-amber-500 dark:text-amber-400 flex items-center gap-1.5">
                <Coins className="w-4 h-4" />
                {selectedPackage.credits.toLocaleString()} Coins
              </span>
              <span className="text-stone-900 dark:text-white text-lg">${selectedPackage.priceUsd} USD</span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-2">
              <p className="text-xs text-stone-300 leading-relaxed font-medium">
                <strong className="text-blue-400">Payment Gateway In Progress:</strong> Direct checkout with credit cards & mobile payment is coming soon. 
              </p>
              <p className="text-xs text-amber-300/90 leading-relaxed">
                👉 <strong>To get coins right now:</strong> Subscribe to channels and watch video views on Discover & Earn!
              </p>
            </div>

            {purchaseSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-bold text-center">
                {purchaseSuccessMsg}
              </div>
            )}

            <div className="space-y-2.5">
              <Link
                to="/discover"
                onClick={() => setSelectedPackage(null)}
                className="w-full py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 text-center"
              >
                <Users className="w-4 h-4" />
                <span>Earn Free Coins (Subscribe & View)</span>
              </Link>

              <button
                onClick={handlePurchase}
                disabled={isPurchasing}
                className="w-full py-2.5 px-4 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs border border-stone-700 transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5 text-stone-400" />
                <span>{isPurchasing ? 'Checking...' : 'Payment Gateway Status (Coming Soon)'}</span>
              </button>

              <button
                onClick={() => setSelectedPackage(null)}
                className="w-full py-1 text-xs text-stone-500 dark:text-stone-400 hover:underline font-semibold"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Coin Refund / Token Cashout Status Modal (Frozen / Under Active Development) */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-[#161310] border border-blue-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-6 shadow-2xl relative text-stone-900 dark:text-stone-100">
            
            <button
              onClick={() => setShowRefundModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-stone-100 dark:hover:bg-[#262018] text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center gap-1.5">
                  <Snowflake className="w-3.5 h-3.5" />
                  Feature Frozen
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Coming Soon
                </span>
              </div>
              <h2 className="text-xl font-black text-stone-900 dark:text-white">
                Coin Refund & Token Cashout
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Payment Gateway Integration in Progress
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5 text-xs leading-relaxed text-stone-300">
                  <p className="font-bold text-white">
                    Direct coin refund & token cashouts are temporarily paused.
                  </p>
                  <p className="text-stone-400">
                    We are currently completing the integration of real automated payment gateways and merchant clearance channels. Token refunds and monetary cashouts will be unlocked as soon as this phase is finalized.
                  </p>
                </div>
              </div>
            </div>

            {/* How to get coins right now banner */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-red-500 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                How to get coins 100% free right now:
              </h4>
              <ul className="text-xs text-stone-600 dark:text-stone-300 space-y-1.5 list-disc list-inside font-medium">
                <li><strong className="text-stone-900 dark:text-white">Subscribe</strong> to other creators' channels on the Discover page (+Coins)</li>
                <li><strong className="text-stone-900 dark:text-white">Watch videos</strong> on the Offers & Earn page (+Coins per view duration)</li>
                <li><strong className="text-stone-900 dark:text-white">Claim Daily Check-in</strong> rewards & build your consecutive streak bonus</li>
                <li><strong className="text-stone-900 dark:text-white">Invite friends</strong> with your referral link for perpetual commission coins</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Link
                to="/discover"
                onClick={() => setShowRefundModal(false)}
                className="w-full py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 text-center"
              >
                <Users className="w-4 h-4" />
                <span>Earn Coins: Subscribe & View</span>
              </Link>
              
              <button
                onClick={() => setShowRefundModal(false)}
                className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs border border-stone-700 transition-all text-center"
              >
                Got It
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
