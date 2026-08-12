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
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

export const WalletPage: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Purchase modal
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccessMsg, setPurchaseSuccessMsg] = useState<string | null>(null);

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
        setPurchaseSuccessMsg(`🎉 Successfully acquired +${selectedPackage.credits.toLocaleString()} Credits!`);
        if (user) {
          updateUser({
            ...user,
            credits: res.data.data.newBalance,
          });
        }
        setTimeout(() => {
          setSelectedPackage(null);
          fetchWalletData();
        }, 2000);
      }
    } catch (err: any) {
      setPurchaseSuccessMsg(err.response?.data?.message || 'Purchase failed.');
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xl">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
          <Coins className="w-4 h-4" />
          <span>Wallet & Credit Marketplace</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Manage Credits & Power Promotion Campaigns
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
          Platform credits fuel your channel promotion campaigns. Earn credits by discovering creators or buy credit packages to scale faster.
        </p>
      </div>

      {/* Credit Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 space-y-2">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Current Balance</span>
          <p className="text-4xl font-black text-amber-300">{user.credits.toLocaleString()} <span className="text-sm font-semibold">Credits</span></p>
          <p className="text-[11px] text-slate-400">Ready for active promotion campaigns</p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Total Earned</span>
          <p className="text-3xl font-black text-white">+{user.totalCreditsEarned.toLocaleString()} <span className="text-sm font-semibold">Credits</span></p>
          <p className="text-[11px] text-slate-400">Earned via discovery & login streaks</p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Total Promoted</span>
          <p className="text-3xl font-black text-white">{user.totalCreditsSpent.toLocaleString()} <span className="text-sm font-semibold">Credits</span></p>
          <p className="text-[11px] text-slate-400">Spent on channel promotion campaigns</p>
        </div>

      </div>

      {/* Credit Store Packages */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-400" />
            Credit Store Packages
          </h2>
          <p className="text-xs text-slate-400">
            Boost your channel campaigns instantly with promotional credit bundles.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`p-6 rounded-3xl border flex flex-col justify-between space-y-6 transition-all ${
                pkg.isPopular
                  ? 'bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-900 border-amber-500/50 shadow-xl'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-4">
                {pkg.isPopular && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500 text-slate-950 inline-block">
                    MOST POPULAR
                  </span>
                )}

                <div>
                  <h3 className="font-extrabold text-white text-lg">{pkg.name}</h3>
                  <p className="text-3xl font-black text-amber-300 mt-2">
                    {pkg.credits.toLocaleString()} <span className="text-xs font-normal text-slate-400">Credits</span>
                  </p>
                  <p className="text-xs font-bold text-slate-300 mt-1">${pkg.priceUsd} USD</p>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{pkg.description}</p>
              </div>

              <button
                onClick={() => setSelectedPackage(pkg)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Coins className="w-4 h-4" />
                <span>Buy {pkg.credits} Credits</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Immutable Transaction Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" />
          Immutable Credit Ledger
        </h2>

        {transactions.length === 0 ? (
          <p className="text-xs text-slate-400">No transactions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-950/50">
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate">{tx.description}</td>
                    <td className="py-3.5 px-4 text-right font-extrabold whitespace-nowrap">
                      <span className={tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Credits
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Simulated Checkout Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative text-slate-100">
            
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Checkout Test Sandbox
              </span>
              <h2 className="text-xl font-black text-white">
                Purchase {selectedPackage.name}
              </h2>
              <p className="text-xs text-slate-400">
                Instantly credit +{selectedPackage.credits.toLocaleString()} Credits for test mode.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between font-bold">
              <span>{selectedPackage.credits.toLocaleString()} Credits</span>
              <span className="text-amber-300 text-lg">${selectedPackage.priceUsd} USD</span>
            </div>

            {purchaseSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center">
                {purchaseSuccessMsg}
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={handlePurchase}
                disabled={isPurchasing}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{isPurchasing ? 'Processing...' : `Confirm Payment ($${selectedPackage.priceUsd})`}</span>
              </button>

              <button
                onClick={() => setSelectedPackage(null)}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-white font-semibold"
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
