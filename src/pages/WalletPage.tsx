import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { CreditPackage, CreditTransaction } from '../types';
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
} from 'lucide-react';

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

      if (res.data.success) {
        setPurchaseSuccessMsg(`🎉 Successfully acquired +${selectedPackage.credits.toLocaleString()} Coins!`);
        if (user) {
          updateUser({
            ...user,
            credits: res.data.data.newBalance,
          });
        }
        setTimeout(() => {
          setSelectedPackage(null);
          fetchWalletData();
        }, 1800);
      }
    } catch (err: any) {
      setPurchaseSuccessMsg(err.response?.data?.message || 'Purchase failed.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleClaimDailyBonus = async () => {
    setIsClaimingDaily(true);
    setDailyClaimMsg(null);

    try {
      const res = await apiClient.post('/wallet/daily-claim');
      if (res.data.success) {
        setDailyClaimMsg(`🎉 ${res.data.message}`);
        if (res.data.data?.user) {
          updateUser(res.data.data.user);
        } else if (user) {
          updateUser({
            ...user,
            credits: res.data.data.newBalance,
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
      <div className="bg-gradient-to-r from-stone-900 via-amber-950/50 to-stone-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Coins className="w-4 h-4" />
            <span>Advanced Coin Management & Wallet</span>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
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
            className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition-all flex items-center gap-2 shadow-md active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>Gift / Transfer Coins</span>
          </button>
          
          <a
            href="#coin-store"
            className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-bold text-xs transition-all flex items-center gap-2 border border-stone-700 active:scale-95"
          >
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>Buy Coin Packages</span>
          </a>
        </div>
      </div>

      {/* Daily Check-in Card & Balance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Bonus Claim Card */}
        <div className="lg:col-span-1 p-6 rounded-3xl bg-gradient-to-br from-amber-500/15 via-stone-900 to-stone-900 border border-amber-500/40 text-stone-100 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Daily Check-in Reward
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-stone-950">
                Day {user.streakDays || 1} Streak
              </span>
            </div>

            <p className="text-sm font-semibold text-stone-300">
              Claim free bonus coins every day to boost your channel promotions!
            </p>

            {dailyClaimMsg && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{dailyClaimMsg}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleClaimDailyBonus}
            disabled={user.dailyRewardClaimedToday || isClaimingDaily}
            className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 font-black text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
          >
            <Gift className="w-4 h-4" />
            <span>
              {user.dailyRewardClaimedToday
                ? '✓ Claimed Today (Check back tomorrow)'
                : isClaimingDaily
                ? 'Claiming...'
                : `Claim +${Math.min(25 + (user.streakDays || 1) * 5, 100)} Bonus Coins`}
            </span>
          </button>
        </div>

        {/* Balance Metrics */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] space-y-2 shadow-sm">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
              Available Coins
            </span>
            <p className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-amber-300">
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
              <CreditCard className="w-5 h-5 text-amber-500" />
              Coin Top-Up Packages
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Boost your channel campaigns instantly with promotional coin bundles
            </p>
          </div>
          <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-stone-100 dark:bg-[#201b15] text-amber-600 dark:text-amber-400 border border-stone-200 dark:border-[#332b21] shrink-0">
            Instant Credit Fulfillment
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`p-6 rounded-3xl border flex flex-col justify-between space-y-6 transition-all ${
                pkg.isPopular
                  ? 'bg-gradient-to-b from-amber-500/10 via-stone-900 to-stone-900 border-amber-500/50 shadow-xl text-white'
                  : 'bg-stone-50 dark:bg-[#0d0b09] border-stone-200 dark:border-[#262018] hover:border-amber-500 dark:hover:border-amber-500/50'
              }`}
            >
              <div className="space-y-4">
                {pkg.isPopular && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500 text-stone-950 inline-block">
                    MOST POPULAR
                  </span>
                )}

                <div>
                  <h3 className="font-extrabold text-stone-900 dark:text-white text-lg">{pkg.name}</h3>
                  <p className="text-3xl font-black text-amber-500 dark:text-amber-300 mt-2">
                    {pkg.credits.toLocaleString()} <span className="text-xs font-normal text-stone-500 dark:text-stone-400">Coins</span>
                  </p>
                  <p className="text-xs font-bold text-stone-700 dark:text-stone-300 mt-1">${pkg.priceUsd} USD</p>
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">{pkg.description}</p>
              </div>

              <button
                onClick={() => setSelectedPackage(pkg)}
                className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Coins className="w-4 h-4 text-stone-950" />
                <span>Get {pkg.credits} Coins</span>
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
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
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
              <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
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
                  className="w-full bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] rounded-2xl px-4 py-3 text-stone-900 dark:text-white placeholder-stone-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="w-full bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] rounded-2xl px-4 py-3 text-stone-900 dark:text-white placeholder-stone-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="w-full bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] rounded-2xl px-4 py-2.5 text-stone-900 dark:text-white placeholder-stone-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isTransferring || user.credits < parseInt(transferAmount || '0', 10)}
                className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>{isTransferring ? 'Transferring Coins...' : `Confirm Transfer (${transferAmount} Coins)`}</span>
              </button>
            </form>

          </div>
        </div>
      )}

      {/* Checkout Top-Up Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative text-stone-900 dark:text-stone-100">
            
            <button
              onClick={() => setSelectedPackage(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-stone-100 dark:hover:bg-[#262018] text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                Checkout Test Mode
              </span>
              <h2 className="text-xl font-black text-stone-900 dark:text-white">
                Purchase {selectedPackage.name}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Instantly credit +{selectedPackage.credits.toLocaleString()} Coins to your wallet
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] flex items-center justify-between font-bold">
              <span>{selectedPackage.credits.toLocaleString()} Coins</span>
              <span className="text-amber-600 dark:text-amber-300 text-lg">${selectedPackage.priceUsd} USD</span>
            </div>

            {purchaseSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold text-center">
                {purchaseSuccessMsg}
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={handlePurchase}
                disabled={isPurchasing}
                className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Lock className="w-4 h-4" />
                <span>{isPurchasing ? 'Processing...' : `Confirm Payment ($${selectedPackage.priceUsd})`}</span>
              </button>

              <button
                onClick={() => setSelectedPackage(null)}
                className="w-full py-2 text-xs text-stone-500 dark:text-stone-400 hover:underline font-semibold"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
