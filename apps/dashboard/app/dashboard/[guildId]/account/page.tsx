'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, LogOut, Shield, Key } from 'lucide-react';

export default function AccountSettingsPage() {
  const router = useRouter();

  const handleSignOut = () => {
    localStorage.removeItem('nexus_token');
    router.push('/login');
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <UserCheck className="h-6 w-6 text-purple-400" />
          Operator Account & Authentication Session
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Review authenticated Discord profile, session token state, and security permissions.
        </p>
      </div>

      <div className="p-8 rounded-2xl bg-[#0d101c] border border-[#1b2238] space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-[#1b2238]">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-purple-500/20">
            OP
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Authenticated Security Operator</h3>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
              Active Discord OAuth2 Session
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-gray-400">
          <div className="p-4 rounded-xl bg-[#080a12] border border-[#1b2238]">
            <span className="text-gray-500 block mb-1">Session Protocol</span>
            <span className="text-gray-200">HMAC-SHA256 Signed JWT</span>
          </div>
          <div className="p-4 rounded-xl bg-[#080a12] border border-[#1b2238]">
            <span className="text-gray-500 block mb-1">Permission Scope</span>
            <span className="text-gray-200">identify, email, guilds</span>
          </div>
        </div>

        <div className="pt-4 border-t border-[#1b2238]">
          <button
            onClick={handleSignOut}
            className="px-5 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 font-semibold text-xs font-mono transition-all flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Terminate Session & Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
