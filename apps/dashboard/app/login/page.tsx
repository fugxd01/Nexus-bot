'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { fetchApi } from '@/lib/api';

interface GuildItem {
  id: string;
  name: string;
  icon?: string;
  owner: boolean;
  hasBot: boolean;
  permissions: string;
}

export default function ServerSelectorPage() {
  const router = useRouter();
  const [guilds, setGuilds] = useState<GuildItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadServers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApi<{ guilds: GuildItem[] }>('/api/guilds');
      setGuilds(data.guilds || []);
      if (!data.guilds || data.guilds.length === 0) {
        setError('No servers found with Manage Server permissions.');
      }
    } catch (err: any) {
      if (err.message?.includes('401')) {
        router.push('/login');
        return;
      }
      setError('Failed to load servers. Please login again.');
      setGuilds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadServers(); }, []);

  return (
    <div className="min-h-screen bg-[#07080e] text-gray-100 flex flex-col">
      <header className="border-b border-[#181d2e] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            NEXUS GUARD
          </span>
        </div>
        <button onClick={loadServers} className="p-2 rounded-lg bg-[#111422] border border-[#1e253d] text-gray-400 hover:text-white transition-colors" title="Refresh">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>
      <main className="max-w-5xl mx-auto w-full px-6 py-12 flex-1">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-wide">Select Server to Manage</h1>
          <p className="text-sm text-gray-400 mt-1">Servers where you have Administrator or Manage Server permissions.</p>
        </div>
        {error && (
          <div className="p-4 mb-6 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
        {loading && <div className="text-center text-gray-500 py-20 text-sm">Loading your servers...</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guilds.map((g) => (
            <div key={g.id} className="p-6 rounded-2xl bg-[#0d101a] border border-[#1c2236] hover:border-purple-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-[#151928] border border-[#232a42] flex items-center justify-center font-bold text-lg text-purple-400">
                    {g.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-100 text-base">{g.name}</h3>
                    <span className="text-xs font-mono text-gray-500">ID: {g.id}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-6">
                  {g.hasBot ? (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">Protected by Bot</span>
                  ) : (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">Bot Not Present</span>
                  )}
                  {g.owner && <span className="text-[11px] px-2 py-0.5 rounded bg-purple-950/60 text-purple-400 border border-purple-800/40">Owner</span>}
                </div>
              </div>
              {g.hasBot ? (
                <Link href={`/dashboard/${g.id}`} className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium text-sm text-center transition-all block">
                  Open Dashboard
                </Link>
              ) : (
                <a href={`https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`} target="_blank" rel="noreferrer" className="w-full py-2.5 px-4 rounded-xl bg-[#151928] border border-[#242c47] text-cyan-400 font-medium text-sm text-center flex items-center justify-center gap-2">
                  <span>Invite Nexus Guard</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

