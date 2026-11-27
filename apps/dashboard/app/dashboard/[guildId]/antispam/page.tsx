'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MessageSquareWarning, Save, CheckCircle } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function AntiSpamPage() {
  const { guildId } = useParams();
  const [config, setConfig] = useState<any>({
    enabled: true,
    maxMessagesPerInterval: 5,
    intervalSeconds: 5,
    maxDuplicates: 3,
    maxMentions: 5,
    blockInvites: true,
    blockSuspiciousLinks: true,
    warnThreshold: 2,
    timeoutDurationSeconds: 300
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchApi(`/api/guilds/${guildId}/settings`);
        if (res.settings?.antiSpam) setConfig(res.settings.antiSpam);
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
        body: JSON.stringify({ antiSpam: config })
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
          <MessageSquareWarning className="h-6 w-6 text-purple-400" />
          Anti-Spam & Phishing Defense Engine
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Automated message rate limits, duplicate burst suppression, malicious link interception and progressive timeouts.
        </p>
      </div>

      <form onSubmit={handleSave} className="p-8 rounded-2xl bg-[#0d101c] border border-[#1b2238] space-y-6">
        <div className="flex items-center justify-between pb-6 border-b border-[#1b2238]">
          <div>
            <h3 className="font-semibold text-gray-100">Enable Anti-Spam Filtering</h3>
            <p className="text-xs text-gray-400">Real-time message inspection on Discord gateway messages</p>
          </div>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            className="h-5 w-5 accent-purple-600 rounded cursor-pointer"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-mono text-gray-300 mb-2">Message Rate Limit (Per Interval)</label>
            <input
              type="number"
              min={2}
              max={20}
              value={config.maxMessagesPerInterval}
              onChange={(e) => setConfig({ ...config, maxMessagesPerInterval: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-lg bg-[#080a12] border border-[#232b47] text-white text-sm font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-2">Max Repeated Duplicate Messages</label>
            <input
              type="number"
              min={2}
              max={10}
              value={config.maxDuplicates}
              onChange={(e) => setConfig({ ...config, maxDuplicates: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-lg bg-[#080a12] border border-[#232b47] text-white text-sm font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-2">Max Mentions Allowed in Message</label>
            <input
              type="number"
              min={1}
              max={20}
              value={config.maxMentions}
              onChange={(e) => setConfig({ ...config, maxMentions: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-lg bg-[#080a12] border border-[#232b47] text-white text-sm font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-2">Penalty Timeout (Seconds)</label>
            <input
              type="number"
              min={60}
              max={86400}
              value={config.timeoutDurationSeconds}
              onChange={(e) => setConfig({ ...config, timeoutDurationSeconds: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-lg bg-[#080a12] border border-[#232b47] text-white text-sm font-mono focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-[#1b2238]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-gray-200">Block Unsolicited Discord Invites</span>
              <p className="text-xs text-gray-500">Auto-delete discord.gg and invite links from non-staff</p>
            </div>
            <input
              type="checkbox"
              checked={config.blockInvites}
              onChange={(e) => setConfig({ ...config, blockInvites: e.target.checked })}
              className="h-4 w-4 accent-purple-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-gray-200">Block Phishing & Nitro Scam Links</span>
              <p className="text-xs text-gray-500">Detect deceptive homoglyph domains and known token grabbers</p>
            </div>
            <input
              type="checkbox"
              checked={config.blockSuspiciousLinks}
              onChange={(e) => setConfig({ ...config, blockSuspiciousLinks: e.target.checked })}
              className="h-4 w-4 accent-purple-600 rounded cursor-pointer"
            />
          </div>
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
              <span>{saving ? 'Saving...' : 'Save Anti-Spam Policy'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
