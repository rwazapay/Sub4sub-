import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../services/api';
import { Promotion } from '../types';
import { ExchangeRetentionTimer } from '../components/ExchangeRetentionTimer';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  BarChart2,
  Eye,
  MousePointer,
  Coins,
  ArrowLeft,
  ExternalLink,
  Globe2,
  Tv,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const PromotionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      apiClient
        .get(`/promotions/${id}`)
        .then((res) => {
          if (res.data.success) {
            setPromotion(res.data.data.promotion);
            setAnalytics(res.data.data.analytics);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400">Loading campaign analytics...</div>;
  }

  if (!promotion) {
    return <div className="p-12 text-center text-slate-400">Campaign not found.</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Back Link */}
      <Link to="/promotions" className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 dark:hover:text-white">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Campaigns</span>
      </Link>

      {/* Header Info */}
      <div className="bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600/10 text-red-600 dark:text-red-400 uppercase">
                {promotion.platform}
              </span>
              <span className="text-xs text-stone-500">Campaign #{promotion.id}</span>
            </div>
            <h1 className="text-2xl font-black text-stone-900 dark:text-white mt-1">{promotion.title}</h1>
            <a
              href={promotion.channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 mt-1 font-medium"
            >
              <span>{promotion.channelUrl}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
            {promotion.status}
          </span>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-3xl bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Impressions</span>
            <Eye className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-stone-900 dark:text-white">{promotion.impressions.toLocaleString()}</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Unique Discoveries</span>
            <MousePointer className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-stone-900 dark:text-white">{promotion.uniqueDiscoveries.toLocaleString()}</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Click-Through Rate</span>
            <BarChart2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-stone-900 dark:text-white">{analytics?.ctr || '0.0%'}</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Remaining Budget</span>
            <Coins className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-stone-900 dark:text-white">{analytics?.remainingCredits || 0} Credits</p>
        </div>

      </div>

      {/* Required Active Stay Retention Countdown Timer & Video Player */}
      <ExchangeRetentionTimer
        requiredSeconds={promotion.requiredStaySeconds || 60}
        promotionTitle={promotion.title}
        channelUrl={promotion.channelUrl}
        videoEmbedUrl={promotion.videoEmbedUrl || 'https://www.youtube.com/embed/aqz-KE-bpKQ'}
        rewardCoins={promotion.rewardPerDiscovery || 10}
        isCreativeCommons={promotion.isCreativeCommons ?? true}
        licenseType={promotion.licenseType || 'CC BY 4.0 International'}
      />

      {/* Recharts Analytics Daily Performance Line Chart */}
      {analytics?.dailyAnalytics && (
        <div className="bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-6 space-y-4 shadow-xs">
          <h2 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-red-500" />
            Daily Performance Trend
          </h2>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.dailyAnalytics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#332b21" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161310', borderColor: '#262018', borderRadius: '16px', color: '#fff' }}
                />
                <Line type="monotone" dataKey="impressions" stroke="#ef4444" strokeWidth={2} name="Impressions" />
                <Line type="monotone" dataKey="clicks" stroke="#f87171" strokeWidth={2} name="Discoveries" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
};
