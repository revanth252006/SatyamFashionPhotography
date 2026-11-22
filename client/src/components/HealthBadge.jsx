import React, { useState, useEffect } from 'react';
import { Activity, Database, HardDrive, CheckCircle2, AlertCircle } from 'lucide-react';
import { getHealthStatus } from '../services/api';

export default function HealthBadge() {
  const [health, setHealth] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    getHealthStatus().then((data) => {
      if (mounted) setHealth(data);
    });
    return () => { mounted = false; };
  }, []);

  const isHealthy = health?.status === 'ok';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 px-2.5 py-1 text-xs rounded-full border border-stone-200 bg-white/80 hover:bg-white text-stone-600 transition shadow-sm"
        title="Backend Health & Service Connection"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
          }`}
        />
        <span className="font-medium text-stone-700">API Status</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 p-3 bg-white rounded-xl shadow-xl border border-stone-200 text-xs text-stone-700 z-50">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100">
            <span className="font-semibold text-stone-900">Backend Health Check</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isHealthy ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {health?.status || 'connecting...'}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-1 text-stone-500">
                <Database className="w-3.5 h-3.5" />
                <span>Supabase DB:</span>
              </span>
              <span className="font-mono text-[11px] text-stone-800">
                {health?.services?.supabase || 'unconfigured'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-1 text-stone-500">
                <HardDrive className="w-3.5 h-3.5" />
                <span>Google Drive:</span>
              </span>
              <span className="font-mono text-[11px] text-stone-800">
                {health?.services?.googleDrive || 'unconfigured'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-1 text-stone-500">
                <Activity className="w-3.5 h-3.5" />
                <span>In-Memory Cache:</span>
              </span>
              <span className="font-mono text-[11px] text-stone-800">
                {health?.cacheStats?.size ?? 0} items ({health?.cacheStats?.hitRate ?? '0%'})
              </span>
            </div>

            {health?.uptimeSeconds !== undefined && (
              <div className="pt-2 mt-2 border-t border-stone-100 text-[10px] text-stone-400 text-right">
                Uptime: {health.uptimeSeconds}s | v{health.version || '1.0'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
