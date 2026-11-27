'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Settings, Save, CheckCircle } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function BotSettingsPage() {
  const { guildId } = useParams();
  const [settings, setSettings] = useState<any>({
    prefix: '!',
    securityAlertChannelId: '',
    modLogChannelId: '',
    logChannelId: ''
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchApi(`/api/guilds/${guildId}/settings`);
        if (res.settings) {
          setSettings({
            prefix: res.settings.prefix || '!',
            securityAlertChannelId: res.settings.securityAlertChannelId || '',
            modLogChannelId: res.settings.modLogChannelId || '',
            logChannelId: res.settings.logChannelId || ''
          });
        }
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
        body: JSON.stringify(settings)
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
          <Settings className="h-6 w-6 text-purple-400" />
          Bot & Channel Routing Settings
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Configure security alert routing, moderation log channels, and bot command prefix.
        </p>
      </div>

      <form onSubmit={handleSave} className="p-8 rounded-2xl bg-[#0d101c] border border-[#1b2238] space-y-6">
        <div>
          <label className="block text-xs font-mono text-gray-300 mb-1.5">Command Prefix</label>
          <input
            type="text"
            value={settings.prefix}
            onChange={(e) => setSettings({ ...settings, prefix: e.target.value })}
            className="w-32 px-4 py-2 rounded-lg bg-[#080a12] border border-[#232b47] text-white text-sm font-mono focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-gray-300 mb-1.5">Security Alert Channel ID</label>
          <input
            type="text"
            placeholder="e.g. 123456789012345678"
            value={settings.securityAlertChannelId}
            onChange={(e) => setSettings({ ...settings, securityAlertChannelId: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg bg-[#080a12] border border-[#232b47] text-white text-sm font-mono focus:outline-none focus:border-purple-500"
          />
          <span className="text-[11px] text-gray-500 mt-1 block">Anti-Raid, Anti-Nuke, and threat alerts are posted here.</span>
        </div>

        <div>
          <label className="block text-xs font-mono text-gray-300 mb-1.5">Moderation Log Channel ID</label>
          <input
            type="text"
            placeholder="e.g. 123456789012345678"
            value={settings.modLogChannelId}
            onChange={(e) => setSettings({ ...settings, modLogChannelId: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg bg-[#080a12] border border-[#232b47] text-white text-sm font-mono focus:outline-none focus:border-purple-500"
          />
          <span className="text-[11px] text-gray-500 mt-1 block">Audit trail of bans, kicks, warnings, and timeouts.</span>
        </div>

        <div className="pt-6 border-t border-[#1b2238] flex items-center justify-between">
          {saved && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" />
              Settings saved
            </span>
          )}
          <div className="ml-auto">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs font-mono transition-all flex items-center gap-2 shadow-md shadow-purple-600/30"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
