import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Gift, Sparkles, Check, Flame, ArrowRight, ShieldCheck, Play, Users } from 'lucide-react';
import { apiClient } from '../services/api';

export const OffersPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [channelUrl, setChannelUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const offers = [
    {
      id: 'combo_380',
      badge: '+380%',
      subscribers: 13,
      views: 69,
      priceInr: '₹29.00',
      priceUsd: '$0.99',
      popular: false,
    },
    {
      id: 'combo_395',
      badge: '+395%',
      subscribers: 49,
      views: 245,
      priceInr: '₹99.00',
      priceUsd: '$2.99',
      popular: true,
    },
    {
      id: 'combo_420',
      badge: '+420%',
      subscribers: 129,
      views: 647,
      priceInr: '₹249.00',
      priceUsd: '$6.99',
      popular: false,
    },
    {
      id: 'combo_450',
      badge: '+450%',
      subscribers: 274,
      views: 1400,
      priceInr: '₹499.00',
      priceUsd: '$12.99',
      popular: false,
    },
  ];

  const handleBuyClick = (offer: any) => {
    setSelectedOffer(offer);
    setMessage(null);
  };

  const handleActivateCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelUrl) {
      alert('Please enter your YouTube Channel URL.');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await apiClient.post('/sub4sub/buy-combo', {
        offerId: selectedOffer.id,
        priceInr: selectedOffer.priceInr,
        priceUsd: selectedOffer.priceUsd,
        subscribersCount: selectedOffer.subscribers,
        viewsCount: selectedOffer.views,
        channelUrl,
        videoUrl,
      });

      if (res.data.success) {
        setMessage(`🎉 Combo Pack Activated! Launched campaign for ${selectedOffer.subscribers} Subscribers + ${selectedOffer.views} Views.`);
        refreshProfile();
        setTimeout(() => {
          setSelectedOffer(null);
          setChannelUrl('');
          setVideoUrl('');
        }, 2000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to activate combo offer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0b09] text-stone-100 pb-24 pt-4 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Title Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Gift className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-sans">
              Offers
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-400">
            Combo packs — pick one, add your channel & video, pay once. We launch both campaigns for you instantly.
          </p>
        </div>

        {/* Grid of Offers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className={`relative bg-[#161310] border ${
                offer.popular ? 'border-amber-500/80 shadow-xl shadow-amber-500/10' : 'border-[#262018]'
              } rounded-3xl p-5 space-y-4 flex flex-col justify-between hover:border-amber-500/50 transition-all group`}
            >
              {/* Badge Ribbon */}
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 font-extrabold text-xs border border-amber-500/30">
                  {offer.badge}
                </span>
                {offer.popular && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <Flame className="w-3 h-3 fill-stone-950" /> Most Popular
                  </span>
                )}
              </div>

              {/* Offer Features */}
              <div className="space-y-3 my-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#201b16] rounded-2xl text-amber-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-white">{offer.subscribers} Subscribers</p>
                    <p className="text-[11px] text-stone-400">Real active subscribers</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#201b16] rounded-2xl text-amber-400">
                    <Play className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-white">{offer.views} Views</p>
                    <p className="text-[11px] text-stone-400">Watch & earn real view duration</p>
                  </div>
                </div>
              </div>

              {/* Price & Action */}
              <div className="pt-3 border-t border-[#262018] flex items-center justify-between gap-3">
                <div>
                  <p className="text-2xl font-black text-white">{offer.priceInr}</p>
                  <p className="text-[10px] text-stone-400">{offer.priceUsd}</p>
                </div>

                <button
                  onClick={() => handleBuyClick(offer)}
                  className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <span>Buy Combo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Guarantees Box */}
        <div className="bg-[#161310] border border-[#262018] rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>Sub4Sub Pro Guarantee</span>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed">
            All combo pack campaigns are fulfilled by verified active Google/YouTube accounts on our network. No passwords required, zero risk of channel strike or drop.
          </p>
        </div>

      </div>

      {/* Buy Combo Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[#161310] border border-[#262018] rounded-3xl p-6 text-stone-100 space-y-5 relative shadow-2xl">
            <button
              onClick={() => setSelectedOffer(null)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-full bg-[#201b16]"
            >
              ✕
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">
                Activate Combo Offer ({selectedOffer.subscribers} Subs + {selectedOffer.views} Views)
              </h3>
              <p className="text-xs text-stone-400">
                Total Price: <span className="text-amber-400 font-bold">{selectedOffer.priceInr} ({selectedOffer.priceUsd})</span>
              </p>
            </div>

            {message && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs rounded-xl font-bold">
                {message}
              </div>
            )}

            <form onSubmit={handleActivateCombo} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300">
                  YouTube Channel URL (For Subscribers) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="e.g. https://youtube.com/@mychannel"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#0d0b09] border border-[#262018] text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300">
                  YouTube Video URL (For Views) *
                </label>
                <input
                  type="url"
                  placeholder="e.g. https://youtu.be/watch?v=xyz"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#0d0b09] border border-[#262018] text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loading ? 'Activating Campaign...' : `Pay ${selectedOffer.priceInr} & Launch Campaigns`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
