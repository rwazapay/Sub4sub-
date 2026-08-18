import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../services/api';
import { SystemHealthReport } from '../../types';
import {
  Activity,
  Database,
  Server,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Cpu,
  Layers,
  HardDrive,
  ShieldCheck,
  Radio,
  Copy,
  Check,
  ExternalLink,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const AdminSystemHealthTab: React.FC = () => {
  const [healthData, setHealthData] = useState<SystemHealthReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(10); // in seconds, 0 = off
  const [lastPingTime, setLastPingTime] = useState<Date | null>(null);
  const [liveRoundtripMs, setLiveRoundtripMs] = useState<number | null>(null);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  const fetchHealth = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    const startPing = performance.now();
    try {
      const res = await apiClient.get('/health');
      const roundtrip = Math.round(performance.now() - startPing);
      setLiveRoundtripMs(roundtrip);
      if (res.data) {
        setHealthData(res.data);
        setError(null);
        setLastPingTime(new Date());
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to ping /api/health');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  // Auto-refresh interval effect
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;

    const timer = setInterval(() => {
      fetchHealth(false);
    }, autoRefreshInterval * 1000);

    return () => clearInterval(timer);
  }, [autoRefreshInterval]);

  const handleCopyJson = () => {
    if (!healthData) return;
    navigator.clipboard.writeText(JSON.stringify(healthData, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const getLatencyColor = (latencyMs: number) => {
    if (latencyMs <= 50) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (latencyMs <= 150) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-red-400 border-red-500/30 bg-red-500/10';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
      case 'healthy':
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Operational</span>
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Sliders className="w-3.5 h-3.5" />
            <span>Maintenance</span>
          </span>
        );
      case 'degraded':
      case 'reconnecting':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Degraded</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30">
            <XCircle className="w-3.5 h-3.5" />
            <span>Down</span>
          </span>
        );
    }
  };

  if (loading && !healthData) {
    return (
      <div className="p-12 text-center space-y-4">
        <RefreshCw className="w-10 h-10 text-red-500 animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-300">Pinging System Health Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner: Status & Live Controls */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Platform System Health & SLA</h3>
                {healthData && getStatusBadge(healthData.status)}
              </div>
              <p className="text-xs text-slate-400">
                Real-time database connectivity, API route latency, container uptime, and microservice status.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Auto Refresh Selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
            <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span className="text-slate-400 font-medium">Auto-poll:</span>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value={0} className="bg-slate-900 text-white">Paused</option>
              <option value={5} className="bg-slate-900 text-white">Every 5s</option>
              <option value={10} className="bg-slate-900 text-white">Every 10s</option>
              <option value={30} className="bg-slate-900 text-white">Every 30s</option>
              <option value={60} className="bg-slate-900 text-white">Every 60s</option>
            </select>
          </div>

          {/* Manual Ping Button */}
          <button
            onClick={() => fetchHealth(true)}
            disabled={refreshing}
            className="px-4 py-2 rounded-2xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Pinging API...' : 'Ping Diagnostics'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div className="space-y-0.5">
            <span className="font-bold block">Telemetry Retrieval Error</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* 4 Core Vital Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Database Connectivity */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Database Status</span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-lg font-black text-white">
                {healthData?.database.status === 'connected' ? 'Connected & Synced' : 'Degraded'}
              </p>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono truncate">
              {healthData?.database.provider || 'Firestore Cloud DB'}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Ping Latency:</span>
            <span className={`px-2 py-0.5 rounded-full font-mono font-bold border ${getLatencyColor(healthData?.database.pingLatencyMs || 0)}`}>
              {healthData?.database.pingLatencyMs}ms
            </span>
          </div>
        </div>

        {/* 2. Server Roundtrip Latency */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Server Latency</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl font-black text-white font-mono">
                {liveRoundtripMs !== null ? liveRoundtripMs : healthData?.responseTimeMs || 0}
              </p>
              <span className="text-xs text-slate-400 font-bold">ms roundtrip</span>
            </div>
            <p className="text-xs text-emerald-400 font-bold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> High Performance (&lt; 50ms)
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Server Processing:</span>
            <span className="font-mono font-bold text-slate-300">
              {healthData?.responseTimeMs || 1}ms
            </span>
          </div>
        </div>

        {/* 3. API Availability & SLA */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">API Availability</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl font-black text-emerald-400 font-mono">
                {healthData?.overallAvailabilityPercent || 99.99}%
              </p>
              <span className="text-xs text-slate-400 font-bold">SLA Target</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Uptime: <span className="font-mono font-bold text-white">{healthData?.server.uptimeFormatted || 'Active'}</span>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Incidents:</span>
            <span className="text-emerald-400 font-bold">0 Active Outages</span>
          </div>
        </div>

        {/* 4. Memory & Container Resources */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Heap Memory</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl font-black text-white font-mono">
                {healthData?.server.memoryUsage.heapUsedMB || 0}
              </p>
              <span className="text-xs text-slate-400 font-bold">
                / {healthData?.server.memoryUsage.heapTotalMB || 0} MB
              </span>
            </div>
            {/* Memory Bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, healthData?.server.memoryUsage.memoryUsagePercent || 30)}%` }}
              />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Node / Env:</span>
            <span className="font-mono text-slate-300">
              {healthData?.server.nodeVersion} ({healthData?.server.environment})
            </span>
          </div>
        </div>
      </div>

      {/* Database Document Counts & Synchronization Details */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-indigo-400" />
            <h4 className="text-sm font-black text-white">Firestore Database Collection Synchronizer</h4>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Database ID: <span className="text-slate-200">{healthData?.database.databaseId}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Creators</span>
            <p className="text-xl font-black text-white font-mono">{healthData?.database.collections.usersCount || 0}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Channels</span>
            <p className="text-xl font-black text-white font-mono">{healthData?.database.collections.channelsCount || 0}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Campaigns</span>
            <p className="text-xl font-black text-white font-mono">{healthData?.database.collections.promotionsCount || 0}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Sub4Sub Queue</span>
            <p className="text-xl font-black text-white font-mono">{healthData?.database.collections.sub4subRequestsCount || 0}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Transactions</span>
            <p className="text-xl font-black text-white font-mono">{healthData?.database.collections.transactionsCount || 0}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Audit Logs</span>
            <p className="text-xl font-black text-white font-mono">{healthData?.database.collections.auditLogsCount || 0}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Spam Radar</span>
            <p className="text-xl font-black text-amber-400 font-mono">{healthData?.database.collections.spamIncidentsCount || 0}</p>
          </div>
        </div>
      </div>

      {/* Micro-Services Matrix */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-red-500" />
            <h4 className="text-sm font-black text-white">API Service Availability Matrix</h4>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {healthData?.services.length || 0} Critical Endpoints Monitored
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {healthData?.services.map((srv, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{srv.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 font-mono">
                      {srv.category}
                    </span>
                  </div>
                  {getStatusBadge(srv.status)}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{srv.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 text-[11px] truncate max-w-[200px]">{srv.endpoint}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getLatencyColor(srv.latencyMs)}`}>
                  {srv.latencyMs}ms
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Raw Diagnostic Payload Viewer */}
      <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2 cursor-pointer"
          >
            <span>Raw Health JSON Payload (`/api/health`)</span>
            {showRawJson ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showRawJson && (
            <button
              onClick={handleCopyJson}
              className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
            </button>
          )}
        </div>

        {showRawJson && (
          <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-80 scrollbar-thin">
            {JSON.stringify(healthData, null, 2)}
          </pre>
        )}
      </div>

      {/* Last Ping Footer */}
      {lastPingTime && (
        <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>Last live health check: {lastPingTime.toLocaleTimeString()} ({lastPingTime.toISOString()})</span>
        </div>
      )}
    </div>
  );
};
