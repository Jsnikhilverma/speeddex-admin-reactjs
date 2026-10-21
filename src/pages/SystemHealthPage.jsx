import React from 'react';
import { HealthMetrics } from '../components/health/HealthMetrics';
import { Activity, ShieldCheck, Cpu } from 'lucide-react';

export const SystemHealthPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
          <Activity className="w-4 h-4" />
          <span>Real-time Telemetry & Diagnostics</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight font-['Outfit']">
          System Diagnostics & Server Health
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Live monitoring of MongoDB database connectivity, Node.js memory heaps, API latency, and regional timezone telemetry
        </p>
      </div>

      {/* Main Health Metrics View */}
      <HealthMetrics />
    </div>
  );
};
