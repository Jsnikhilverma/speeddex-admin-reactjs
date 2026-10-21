import React, { useState, useEffect } from 'react';
import { healthApi } from '../../api/healthApi';
import {
  Activity,
  Database,
  Cpu,
  Server,
  Clock,
  MapPin,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';

export const HealthMetrics = () => {
  const [health, setHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pingLatency, setPingLatency] = useState(null);
  const [isPinging, setIsPinging] = useState(false);

  const fetchHealth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await healthApi.getHealth();
      setHealth(res.data);
    } catch (err) {
      setError(err.message || 'Failed to communicate with Speeddex backend');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePingTest = async () => {
    try {
      setIsPinging(true);
      const t0 = performance.now();
      await healthApi.ping();
      const t1 = performance.now();
      setPingLatency(Math.round(t1 - t0));
    } catch (e) {
      setPingLatency(-1);
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds) => {
    if (!seconds) return '0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  if (isLoading && !health) {
    return (
      <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mx-auto mb-2" />
        <span className="text-sm text-slate-400">Querying live backend diagnostics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-200">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
          <div>
            <h4 className="font-bold">Backend Diagnostics Unreachable</h4>
            <p className="text-xs text-rose-300 mt-0.5">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchHealth}
          className="mt-4 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
        >
          Retry Diagnostic Probe
        </button>
      </div>
    );
  }

  const dbConnected = health?.database?.status === 'connected';

  // Memory calculation
  const heapUsedMB = parseFloat(health?.system?.memory?.heapUsed) || 0;
  const heapTotalMB = parseFloat(health?.system?.memory?.heapTotal) || 1;
  const memoryPercent = Math.min(Math.round((heapUsedMB / heapTotalMB) * 100), 100);

  return (
    <div className="space-y-6">
      {/* Top Health Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              dbConnected
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
            }`}
          >
            <Activity className="w-7 h-7" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white font-['Outfit']">
                {health?.service || 'Speeddex Construction CRM + HRMS'}
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${
                  dbConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}
              >
                {health?.status || 'Unknown'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>Environment: <b className="text-slate-300 font-mono uppercase">{health?.environment}</b></span>
              <span>•</span>
              <span>Version: <b className="text-slate-300 font-mono">{health?.version}</b></span>
              <span>•</span>
              <span className="flex items-center gap-1 text-amber-400">
                <MapPin className="w-3 h-3" />
                {health?.location?.city}, {health?.location?.state}
              </span>
            </p>
          </div>
        </div>

        {/* Diagnostic Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePingTest}
            disabled={isPinging}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-all"
          >
            <Zap className={`w-3.5 h-3.5 text-amber-400 ${isPinging ? 'animate-bounce' : ''}`} />
            <span>
              {isPinging ? 'Pinging...' : pingLatency !== null ? `${pingLatency} ms ping` : 'Ping Probe'}
            </span>
          </button>

          <button
            onClick={fetchHealth}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
            title="Refresh Diagnostic Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Database Status Card */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase mb-3">
            <span className="flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-400" />
              MongoDB Database
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                dbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
          </div>
          <p className="text-2xl font-bold text-white font-['Outfit']">
            {health?.database?.name || 'speeddex_crm_dev'}
          </p>
          <div className="mt-3 space-y-1 text-xs text-slate-400 font-mono">
            <div className="flex justify-between">
              <span>Host:</span>
              <span className="text-slate-200">{health?.database?.host}</span>
            </div>
            <div className="flex justify-between">
              <span>Ping Latency:</span>
              <span className="text-emerald-400 font-semibold">{health?.database?.pingTimeMs} ms</span>
            </div>
            <div className="flex justify-between">
              <span>Replica Set:</span>
              <span className="text-slate-300">{health?.database?.replicaSet ? 'Active' : 'Standalone Dev'}</span>
            </div>
          </div>
        </div>

        {/* Server Process & Uptime */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase mb-3">
            <span className="flex items-center gap-1.5">
              <Server className="w-4 h-4 text-blue-400" />
              Node.js Process
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              PID {health?.system?.pid}
            </span>
          </div>
          <p className="text-2xl font-bold text-white font-['Outfit']">
            {formatUptime(health?.system?.uptimeSeconds)}
          </p>
          <div className="mt-3 space-y-1 text-xs text-slate-400 font-mono">
            <div className="flex justify-between">
              <span>Node Engine:</span>
              <span className="text-slate-200">{health?.system?.nodeVersion}</span>
            </div>
            <div className="flex justify-between">
              <span>API Response:</span>
              <span className="text-blue-400 font-semibold">{health?.responseTimeMs} ms</span>
            </div>
            <div className="flex justify-between">
              <span>API Prefix:</span>
              <span className="text-slate-300">/api/v1</span>
            </div>
          </div>
        </div>

        {/* RAM & Heap Usage */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase mb-3">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-amber-400" />
              RAM Heap Usage
            </span>
            <span className="text-xs font-bold text-amber-400 font-mono">
              {memoryPercent}%
            </span>
          </div>
          <p className="text-2xl font-bold text-white font-['Outfit']">
            {health?.system?.memory?.heapUsed}
          </p>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3 mb-2">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${memoryPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>Heap Total: {health?.system?.memory?.heapTotal}</span>
            <span>RSS: {health?.system?.memory?.rss}</span>
          </div>
        </div>

        {/* Business Context & Timezone */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase mb-3">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-400" />
              Indian Business Time
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
              IST (UTC+5:30)
            </span>
          </div>
          <p className="text-sm font-bold text-white leading-snug">
            {health?.timestamps?.indianStandardTime || '—'}
          </p>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
            <span className="block text-[11px] uppercase tracking-wider text-slate-500">
              Company Location
            </span>
            <span className="text-slate-200 font-medium">
              Speeddex Construction • Indore, MP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
