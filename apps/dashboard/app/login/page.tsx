'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, LogIn, ArrowRight } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [devUserId, setDevUserId] = useState('');

  const handleDiscordOAuth = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ url: string }>('/api/auth/login');
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      alert(`Could not redirect to Discord: ${err.message}. If running in offline test mode, use the Direct Session Access below.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const id = devUserId.trim() || '123456789012345678';
    // Generate simulated test session token
    localStorage.setItem('nexus_token', `dev_session_${id}`);
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

        {/* Primary Discord Login */}
        <button
          onClick={handleDiscordOAuth}
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-3 mb-6"
        >
          <LogIn className="h-4 w-4" />
          <span>Continue with Discord</span>
        </button>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-[#1f263e]"></div>
          <span className="flex-shrink mx-4 text-xs text-gray-500 uppercase font-mono">Or Console Access</span>
          <div className="flex-grow border-t border-[#1f263e]"></div>
        </div>

        {/* Direct Session Access for Testing / Local Deployment */}
        <form onSubmit={handleDevLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1.5">Direct Operator ID</label>
            <input
              type="text"
              placeholder="e.g. 987654321012345678"
              value={devUserId}
              onChange={(e) => setDevUserId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#090b14] border border-[#232b47] text-gray-200 text-sm focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-lg bg-[#141828] hover:bg-[#1b2238] border border-[#273152] text-gray-300 hover:text-white text-xs font-mono transition-colors flex items-center justify-center gap-2"
          >
            <span>Enter Dashboard</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
