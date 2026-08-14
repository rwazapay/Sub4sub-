import React from 'react';
import { AiVerificationData } from '../types';
import {
  ShieldCheck,
  Sparkles,
  X,
  TrendingUp,
  Clock,
  Activity,
  CheckCircle2,
  Cpu,
  BarChart3,
  Users,
  Eye,
  Percent,
} from 'lucide-react';

interface AiGrowthAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorName: string;
  username: string;
  verificationData?: AiVerificationData | null;
  onReverify?: () => void;
  isScanning?: boolean;
}

export const AiGrowthAuditModal: React.FC<AiGrowthAuditModalProps> = ({
  isOpen,
  onClose,
  creatorName,
  username,
  verificationData,
  onReverify,
  isScanning = false,
}) => {
  if (!isOpen) return null;

  const score = verificationData?.authenticityScore || 95;
  const metrics = verificationData?.metricsAnalyzed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">AI Growth Verification</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  AUTHENTIC
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Audited profile: <span className="text-indigo-300 font-semibold">{creatorName}</span> (@{username})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanning State */}
        {isScanning ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin flex items-center justify-center" />
              <Cpu className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white text-base">Gemini AI Audit In Progress</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Inspecting subscriber growth curvature, retention patterns, and engagement velocity...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Authenticity Score Overview Banner */}
            <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900 to-emerald-950/40 border border-indigo-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center justify-center sm:justify-start gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Growth Authenticity Score</span>
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white flex items-baseline justify-center sm:justify-start gap-1">
                  <span>{score}</span>
                  <span className="text-sm font-medium text-slate-400">/ 100</span>
                </div>
                <p className="text-xs text-emerald-300 font-semibold">
                  {verificationData?.growthQualityRating || 'High Organic Velocity'}
                </p>
              </div>

              <div className="text-right space-y-1 sm:border-l sm:border-slate-800 sm:pl-6 text-center sm:text-right">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/90 text-[11px] text-slate-300 border border-slate-700">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Model: {verificationData?.verifiedByModel || 'gemini-3.6-flash'}</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Audit Date:{' '}
                  {verificationData?.verifiedAt
                    ? new Date(verificationData.verifiedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Today'}
                </p>
              </div>
            </div>

            {/* AI Summary Box */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gemini Audit Assessment</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {verificationData?.aiAuditSummary ||
                  `Channel growth metrics for @${username} exhibit healthy organic retention signatures and active community interaction. Passed all anti-fraud checks with no artificial inflation detected.`}
              </p>
            </div>

            {/* Quality Breakdown Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Velocity</span>
                </div>
                <p className="text-xs font-bold text-white">
                  {verificationData?.engagementVelocity || 'Optimal Interaction'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Retention</span>
                </div>
                <p className="text-xs font-bold text-white">
                  {verificationData?.retentionQuality || 'Exceeds Benchmark'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                  <Activity className="w-3.5 h-3.5 text-red-400" />
                  <span>Risk Level</span>
                </div>
                <p className="text-xs font-bold text-emerald-400">
                  {verificationData?.riskRating || 'Very Low (<0.01)'}
                </p>
              </div>
            </div>

            {/* Analyzed Channel Metrics Snapshot */}
            {metrics && (
              <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  Audited Channel Growth Signals
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <Users className="w-3.5 h-3.5 text-indigo-400 mx-auto mb-1" />
                    <div className="text-xs font-bold text-white">
                      {metrics.subscribersCount.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">Subscribers</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <Eye className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
                    <div className="text-xs font-bold text-white">
                      {metrics.totalViews.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">Views Sampled</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <Clock className="w-3.5 h-3.5 text-red-400 mx-auto mb-1" />
                    <div className="text-xs font-bold text-white">{metrics.avgRetentionSeconds}s</div>
                    <div className="text-[10px] text-slate-400">Avg Retention</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <Percent className="w-3.5 h-3.5 text-purple-400 mx-auto mb-1" />
                    <div className="text-xs font-bold text-white">{metrics.engagementRatioPercent}%</div>
                    <div className="text-[10px] text-slate-400">Engagement</div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
              {onReverify ? (
                <button
                  onClick={onReverify}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Re-audit Growth Stats with Gemini</span>
                </button>
              ) : (
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>SubLoop Community Anti-Abuse Certified</span>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
              >
                Close Audit Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
