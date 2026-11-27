'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, AlertTriangle, Lock, Unlock, LogOut, ChevronDown, CheckCircle } from 'lucide-react';
import { fetchApi } from '@/lib/api';

interface HeaderProps {
  guildId?: string;
  guildName?: string;
  isLockedDown?: boolean;
}

export function Header({ guildId, guildName = 'Server Management', isLockedDown = false }: HeaderProps) {
  const router = useRouter();
  const [locked, setLocked] = useState(isLockedDown);
  const [loading, setLoading] = useState(false);

  const toggleEmergencyLockdown = async () => {
    if (!guildId) return;
    const action = locked ? 'DEACTIVATE' : 'ACTIVATE';
    const confirm = window.confirm(
      locked 
        ? 'Are you sure you want to lift the emergency server lockdown?' 
        : 'CRITICAL ACTION: Do you want to engage emergency lockdown on all public communication channels?'
    );
    if (!confirm) return;

    setLoading(true);
    try {
      const res = await fetchApi(`/api/security/${guildId}/lockdown`, {
        method: 'POST',
        body: JSON.stringify({ action, reason: 'Initiated via Header Quick Control' })
      });
      setLocked(res.isLockedDown);
      alert(res.message);
    } catch (err: any) {
      alert(`Lockdown action failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nexus_token');
    router.push('/login');
  };

  return (
    <header className="h-16 bg-[#0a0c14]/90 backdrop-blur border-b border-[#1a1f33] px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Current Context */}
      <div className="flex items-center gap-3">
        <div className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
        <h2 className="font-semibold text-gray-200 text-sm">{guildName}</h2>
        {guildId && (
          <span className="text-xs font-mono bg-purple-950/60 text-purple-300 border border-purple-800/40 px-2 py-0.5 rounded">
            ID: {guildId}
          </span>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Emergency Lockdown Toggle */}
        {guildId && (
          <button
            onClick={toggleEmergencyLockdown}
            disabled={loading}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
              locked
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-rose-600/30'
                : 'bg-[#151928] hover:bg-rose-950/40 text-gray-300 hover:text-rose-400 border border-[#232a45]'
            }`}
          >
            {locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5 text-rose-500" />}
            {locked ? 'LOCKDOWN ENGAGED' : 'EMERGENCY LOCKDOWN'}
          </button>
        )}

        {/* Server Switcher Button */}
        <Link
          href="/servers"
          className="text-xs bg-[#121626] hover:bg-[#1a2035] text-gray-300 px-3 py-1.5 rounded-lg border border-[#1e253d] transition-colors"
        >
          Switch Server
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-2 rounded-lg bg-[#121626] hover:bg-rose-950/30 text-gray-400 hover:text-rose-400 border border-[#1e253d] transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
