'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, Save, CheckCircle } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function WelcomeSystemPage() {
  const { guildId } = useParams();
  const [welcome, setWelcome] = useState<any>({
    enabled: true,
    welcomeMessage: 'Welcome {user} to {server}! Please review server rules.',
    goodbyeMessage: '{user} has left the server.',
    useEmbed: true,
    autoRoleId: ''
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchApi(`/api/guilds/${guildId}/settings`);
        if (res.settings?.welcome) setWelcome(res.settings.welcome);
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
        body: JSON.stringify({ welcome })
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
          <Sparkles className="h-6 w-6 text-purple-400" />
          Welcome & Onboarding Gate
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Configure automated welcome embeds, member departure logs, and auto-assigned new member roles.
        </p>
      </div>

      <form onSubmit={handleSave} className="p-8 rounded-2xl bg-[#0d101c] border border-[#1b2238] space-y-6">
        <div className="flex items-center justify-between pb-6 border-b border-[#1b2238]">
          <div>
            <h3 className="font-semibold text-gray-100">Enable Welcome Engine</h3>
            <p className="text-xs text-gray-400">Dispatch customized greeting on member join</p>
          </div>
          <input
            type="checkbox"
            checked={welcome.enabled}
            onChange={(e) => setWelcome({ ...welcome, enabled: e.target.checked })}
            className="h-5 w-5 accent-purple-600 rounded cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-gray-300 mb-1.5">Welcome Message Template</label>
          <textarea
            rows={3}
            value={welcome.welcomeMessage}
            onChange={(e) => setWelcome({ ...welcome, welcomeMessage: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg bg-[#080a12] border border-[#232b47] text-white text-sm focus:outline-none focus:border-purple-500 font-mono"
          />
          <span className="text-[11px] text-gray-500 mt-1 block">
            Variables: <code>{"{user}"}</code> (mention), <code>{"{username}"}</code>, <code>{"{server}"}</code>, <code>{"{memberCount}"}</code>
          </span>
        </div>

        <div>
          <label className="block text-xs font-mono text-gray-300 mb-1.5">Goodbye Message Template</label>
          <textarea
            rows={2}
            value={welcome.goodbyeMessage}
            onChange={(e) => setWelcome({ ...welcome, goodbyeMessage: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg bg-[#080a12] border border-[#232b47] text-white text-sm focus:outline-none focus:border-purple-500 font-mono"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#1b2238]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-gray-200">Format as Rich Embed</span>
              <p className="text-xs text-gray-500">Stylized futuristic card with avatar thumbnail</p>
            </div>
            <input
              type="checkbox"
              checked={welcome.useEmbed}
              onChange={(e) => setWelcome({ ...welcome, useEmbed: e.target.checked })}
              className="h-4 w-4 accent-purple-600 rounded cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1.5">Auto-Role ID (Assigned on Join)</label>
            <input
              type="text"
              placeholder="e.g. 112233445566778899"
              value={welcome.autoRoleId || ''}
              onChange={(e) => setWelcome({ ...welcome, autoRoleId: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg bg-[#080a12] border border-[#232b47] text-white text-xs font-mono focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-[#1b2238] flex items-center justify-between">
          {saved && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" />
              Welcome system configuration saved
            </span>
          )}
          <div className="ml-auto">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs font-mono transition-all flex items-center gap-2 shadow-md shadow-purple-600/30"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Welcome Configuration'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
