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
      <Link to="/promotions" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Campaigns</span>
      </Link>

      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                {promotion.platform}
              </span>
              <span className="text-xs text-slate-400">Campaign #{promotion.id}</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">{promotion.title}</h1>
            <a
              href={promotion.channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:underline flex items-center gap-1 mt-1"
            >
              <span>{promotion.channelUrl}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
            {promotion.status}
          </span>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Impressions</span>
            <Eye className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white">{promotion.impressions.toLocaleString()}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Unique Discoveries</span>
            <MousePointer className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white">{promotion.uniqueDiscoveries.toLocaleString()}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Click-Through Rate</span>
            <BarChart2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">{analytics?.ctr || '0.0%'}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Remaining Budget</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white">{analytics?.remainingCredits || 0} Credits</p>
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
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-400" />
            Daily Performance Trend
          </h2>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.dailyAnalytics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Line type="monotone" dataKey="impressions" stroke="#6366f1" strokeWidth={2} name="Impressions" />
                <Line type="monotone" dataKey="clicks" stroke="#a855f7" strokeWidth={2} name="Discoveries" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
};
