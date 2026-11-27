'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, LogIn, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [devUserId, setDevUserId] = useState('');

  const handleDiscordOAuth = () => {
    setLoading(true);
    try {
      const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '';
      const redirectUri = encodeURIComponent(
        typeof window !== 'undefined'
          ? `${window.location.origin}/api/auth/callback`
          : ''
      );
      const scope = encodeURIComponent('identify email guilds');
      const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
      window.location.href = discordUrl;
    } catch (err: any) {
      alert(`Could not redirect to Discord: ${err.message}`);
      setLoading(false);
    }
  };

  const handleDevLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/servers');
  };

  return (
    <div className="min-h-screen bg-[#08090f] flex items-center justify-center px-4">
      <div className="max-w-md w-full p-8 rounded-2xl bg-[#0e111d] border border-[#1b2238] shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Authenticate to Console</h2>
          <p className="text-xs text-gray-400 mt-1 font-mono">NEXUS GUARD SECURE OAUTH GATEWAY</p>
        </div>

        <button
          onClick={handleDiscordOAuth}
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-3 mb-6"
        >
          <LogIn className="h-4 w-4" />
          <span>{loading ? 'Redirecting...' : 'Continue with Discord'}</span>
        </button>
      </div>
    </div>
  );
}
