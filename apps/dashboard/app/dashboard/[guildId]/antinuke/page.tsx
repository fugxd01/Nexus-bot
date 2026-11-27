'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Bomb, Save, CheckCircle, ShieldAlert } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function AntiNukePage() {
  const { guildId } = useParams();
  const [config, setConfig] = useState<any>({
    enabled: true,
    maxChannelDeletions: 3,
    maxChannelCreations: 5,
    maxRoleDeletions: 3,
    maxRoleCreations: 5,
    maxBans: 3,
    maxKicks: 3,
    timeWindowSeconds: 10,
    quarantineOffenderRoles: true,
    stripAdminOnTrigger: true,
    whitelistedUserIds: [],
    whitelistedRoleIds: []
  });
  const [whitelistInput, setWhitelistInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchApi(`/api/guilds/${guildId}/settings`);
        if (res.settings?.antiNuke) {
          setConfig(res.settings.antiNuke);
          setWhitelistInput((res.settings.antiNuke.whitelistedUserIds || []).join(', '));
        }
      } catch {}
    }
    load();
  }, [guildId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const userIds = whitelistInput
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 5);

    try {
      await fetchApi(`/api/guilds/${guildId}/settings`, {
        method: 'PATCH',
        body: JSON.stringify({
          antiNuke: {
            ...config,
            whitelistedUserIds: userIds
          }
        })
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
          <Bomb className="h-6 w-6 text-rose-500" />
          Autonomous Anti-Nuke Engine
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Detect mass channel/role deletions, unauthorized administrator escalations, and rogue admin activity via Discord Audit Logs.
        </p>
      </div>

      <form onSubmit={handleSave} className="p-8 rounded-2xl bg-[#0d101c] border border-[#1b2238] space-y-6">
        {/* Master Switch */}
        <div className="flex items-center justify-between pb-6 border-b border-[#1b2238]">
          <div>
            <h3 className="font-semibold text-gray-100">Enable Anti-Nuke Guardian</h3>
            <p className="text-xs text-gray-400">Continuous audit log attribution and rogue admin quarantine</p>
          </div>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            className="h-5 w-5 accent-purple-600 rounded cursor-pointer"
          />
        </div>

        {/* Rate Limits */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-mono text-gray-300 mb-2">Max Channel Deletions</label>
            <input
              type="number"
              min={1}
              max={20}
              value={config.maxChannelDeletions}
              onChange={(e) => setConfig({ ...config, maxChannelDeletions: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-lg bg-[#080a12] border border-[#232b47] text-white text-sm font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-2">Max Role Deletions</label>
            <input
              type="number"
              min={1}
              max={20}
              value={config.maxRoleDeletions}
              onChange={(e) => setConfig({ ...config, maxRoleDeletions: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-lg bg-[#080a12] border border-[#232b47] text-white text-sm font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-2">Max Member Bans / Kicks</label>
            <input
              type="number"
              min={1}
              max={20}
              value={config.maxBans}
              onChange={(e) => setConfig({ ...config, maxBans: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-lg bg-[#080a12] border border-[#232b47] text-white text-sm font-mono focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Mitigation Options */}
        <div className="space-y-4 pt-4 border-t border-[#1b2238]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-gray-200">Strip Administrator Roles on Violation</span>
              <p className="text-xs text-gray-500">Automatically remove administrative and dangerous permissions from the actor</p>
            </div>
            <input
              type="checkbox"
              checked={config.stripAdminOnTrigger}
              onChange={(e) => setConfig({ ...config, stripAdminOnTrigger: e.target.checked })}
              className="h-4 w-4 accent-purple-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-gray-200">Quarantine Offender in Maximum Timeout</span>
              <p className="text-xs text-gray-500">Immediately mute and isolate actor to prevent further discord api modifications</p>
            </div>
            <input
              type="checkbox"
              checked={config.quarantineOffenderRoles}
              onChange={(e) => setConfig({ ...config, quarantineOffenderRoles: e.target.checked })}
              className="h-4 w-4 accent-purple-600 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Whitelist */}
        <div className="pt-4 border-t border-[#1b2238]">
          <label className="block text-xs font-mono text-gray-300 mb-2">
            Whitelisted User IDs (Comma-separated)
          </label>
          <input
            type="text"
            value={whitelistInput}
            onChange={(e) => setWhitelistInput(e.target.value)}
            placeholder="e.g. 123456789012345678, 234567890123456789"
            className="w-full px-4 py-2.5 rounded-lg bg-[#080a12] border border-[#232b47] text-white text-sm font-mono focus:outline-none focus:border-purple-500"
          />
          <span className="text-[11px] text-gray-500 mt-1 block">
            Note: The Server Owner is always intrinsically immune and excluded from false-positive enforcement.
          </span>
        </div>

        {/* Save */}
        <div className="pt-6 border-t border-[#1b2238] flex items-center justify-between">
          {saved && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" />
              Anti-Nuke policies updated
            </span>
          )}
          <div className="ml-auto">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs font-mono transition-all flex items-center gap-2 shadow-md shadow-purple-600/30"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Anti-Nuke Policy'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
