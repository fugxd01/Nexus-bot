'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Zap, Save, CheckCircle } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function AntiRaidPage() {
  const { guildId } = useParams();
  const [config, setConfig] = useState<any>({
    enabled: true,
    maxJoinsPerInterval: 5,
    intervalSeconds: 10,
    minAccountAgeDays: 3,
    actionOnTrigger: 'KICK_NEW',
    autoLockdownDurationMinutes: 30,
    notifyOwner: true
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchApi(`/api/guilds/${guildId}/settings`);
        if (res.settings?.antiRaid) setConfig(res.settings.antiRaid);
      } catch {}
    }
    load();
  }, [guildId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await fetchApi(`/api/guilds/${guildId}/settings`, {
        method: 'PATCH',
        body: JSON.stringify({ antiRaid: config })
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Zap className="h-6 w-6 text-yellow-400" />
          Autonomous Anti-Raid Engine
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Detect rapid join velocity spikes and quarantine botnet influxes using sliding window heuristics.
        </p>
      </div>

      <form onSubmit={handleSave} className="p-8 rounded-2xl bg-[#0d101c] border border-[#1b2238] space-y-6">
        {/* Enable Switch */}
        <div className="flex items-center justify-between pb-6 border-b border-[#1b2238]">
          <div>
            <h3 className="font-semibold text-gray-100">Enable Anti-Raid Protection</h3>
            <p className="text-xs text-gray-400">Continuous join velocity monitoring & automated mitigation</p>
          </div>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            className="h-5 w-5 accent-purple-600 rounded cursor-pointer"
          />
        </div>

        {/* Join Velocity Thresholds */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-mono text-gray-300 mb-2">Max Member Joins Per Interval</label>
            <input
              type="number"
              min={2}
              max={100}
              value={config.maxJoinsPerInterval}
              onChange={(e) => setConfig({ ...config, maxJoinsPerInterval: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-lg bg-[#080a12] border border-[#232b47] text-white text-sm font-mono focus:outline-none focus:border-purple-500"
            />
            <span className="text-[11px] text-gray-500 mt-1 block">Default: 5 joins</span>
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-2">Time Interval Window (Seconds)</label>
            <input
              type="number"
              min={5}
              max={300}
              value={config.intervalSeconds}
              onChange={(e) => setConfig({ ...config, intervalSeconds: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-lg bg-[#080a12] border border-[#232b47] text-white text-sm font-mono focus:outline-none focus:border-purple-500"
            />
            <span className="text-[11px] text-gray-500 mt-1 block">Default: 10 seconds</span>
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-2">Minimum Account Age (Days)</label>
            <input
              type="number"
              min={0}
              max={365}
              value={config.minAccountAgeDays}
              onChange={(e) => setConfig({ ...config, minAccountAgeDays: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-lg bg-[#080a12] border border-[#232b47] text-white text-sm font-mono focus:outline-none focus:border-purple-500"
            />
            <span className="text-[11px] text-gray-500 mt-1 block">Younger accounts flagged during raid</span>
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-2">Automated Enforcement Action</label>
            <select
              value={config.actionOnTrigger}
              onChange={(e) => setConfig({ ...config, actionOnTrigger: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-[#080a12] border border-[#232b47] text-white text-sm font-mono focus:outline-none focus:border-purple-500"
            >
              <option value="KICK_NEW">KICK_NEW (Kick suspicious recent joins)</option>
              <option value="BAN_NEW">BAN_NEW (Ban suspicious recent joins)</option>
              <option value="LOCKDOWN">LOCKDOWN (Engage Server Containment)</option>
              <option value="ALERT_ONLY">ALERT_ONLY (Notify Admins Only)</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-6 border-t border-[#1b2238] flex items-center justify-between">
          {saved && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" />
              Configuration saved to MongoDB Atlas
            </span>
          )}
          <div className="ml-auto">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs font-mono transition-all flex items-center gap-2 shadow-md shadow-purple-600/30"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Anti-Raid Policy'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
