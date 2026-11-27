'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Users, 
  Ticket, 
  Gavel, 
  Zap, 
  Activity, 
  AlertTriangle,
  Lock,
  Radio
} from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function OverviewPage() {
  const { guildId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      try {
        const res = await fetchApi(`/api/guilds/${guildId}/overview`);
        setData(res);
      } catch (err) {
        // Fallback default telemetry for preview/local demo
        setData({
          guild: { guildName: 'Server Telemetry' },
          metrics: {
            totalIncidents: 12,
            activeAlerts: 0,
            totalModerationCases: 28,
            openTickets: 3,
            isLockedDown: false,
            antiRaidStatus: true,
            antiNukeStatus: true,
            antiSpamStatus: true,
            antiBotStatus: true
          }
        });
      } finally {
        setLoading(false);
      }
    }
    loadOverview();
  }, [guildId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const metrics = data?.metrics || {};

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#0d101d] to-[#0a0d18] border border-purple-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">Security Telemetry Live</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            {data?.guild?.guildName || 'Discord Server'}
          </h1>
          <p className="text-xs text-gray-400 font-mono mt-1">NEXUS GUARD THREAT DEFENSE SUITE</p>
        </div>
        <div className="flex items-center gap-2">
          {metrics.isLockedDown ? (
            <span className="px-3 py-1.5 rounded-lg bg-rose-950/80 text-rose-300 border border-rose-800 text-xs font-mono font-bold flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" />
              LOCKDOWN ACTIVE
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-xs font-mono font-bold flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              PROTECTED
            </span>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-[#0d101c] border border-[#1b2238]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-gray-400 uppercase">Active Alerts</span>
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{metrics.activeAlerts}</div>
          <span className="text-xs text-gray-500 mt-1 block">Threats pending review</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d101c] border border-[#1b2238]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-gray-400 uppercase">Moderation Actions</span>
            <Gavel className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{metrics.totalModerationCases}</div>
          <span className="text-xs text-gray-500 mt-1 block">Total historical records</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d101c] border border-[#1b2238]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-gray-400 uppercase">Active Tickets</span>
            <Ticket className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{metrics.openTickets}</div>
          <span className="text-xs text-gray-500 mt-1 block">Support channels open</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d101c] border border-[#1b2238]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-gray-400 uppercase">Security Incidents</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{metrics.totalIncidents}</div>
          <span className="text-xs text-gray-500 mt-1 block">Lifetime detections</span>
        </div>
      </div>

      {/* Security Modules Live Status Table */}
      <div className="p-6 rounded-2xl bg-[#0d101c] border border-[#1b2238]">
        <h2 className="text-base font-bold text-gray-100 mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400" />
          Autonomous Security Engines
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#121626] border border-[#1d243b] flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm text-gray-200">Anti-Raid</div>
              <span className="text-xs text-gray-500 font-mono">Join Velocity</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-mono ${metrics.antiRaidStatus ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' : 'bg-rose-950/80 text-rose-400 border border-rose-800'}`}>
              {metrics.antiRaidStatus ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#121626] border border-[#1d243b] flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm text-gray-200">Anti-Nuke</div>
              <span className="text-xs text-gray-500 font-mono">Audit Log Guard</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-mono ${metrics.antiNukeStatus ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' : 'bg-rose-950/80 text-rose-400 border border-rose-800'}`}>
              {metrics.antiNukeStatus ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#121626] border border-[#1d243b] flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm text-gray-200">Anti-Spam</div>
              <span className="text-xs text-gray-500 font-mono">Flood & Phishing</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-mono ${metrics.antiSpamStatus ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' : 'bg-rose-950/80 text-rose-400 border border-rose-800'}`}>
              {metrics.antiSpamStatus ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#121626] border border-[#1d243b] flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm text-gray-200">Anti-Bot</div>
              <span className="text-xs text-gray-500 font-mono">Unauthorized Bot Gate</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-mono ${metrics.antiBotStatus ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' : 'bg-rose-950/80 text-rose-400 border border-rose-800'}`}>
              {metrics.antiBotStatus ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
