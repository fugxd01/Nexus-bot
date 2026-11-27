'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Lock, Activity, Server, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#07080d] text-gray-100 flex flex-col justify-between selection:bg-purple-600">
      {/* Top Navbar */}
      <header className="border-b border-[#181d2e] px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-white">
            NEXUS GUARD
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-medium text-sm transition-all shadow-md shadow-purple-500/20 flex items-center gap-2"
          >
            <span>Launch Console</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-20 text-center flex-1 flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/50 text-cyan-400 text-xs font-mono mb-6">
          <Zap className="h-3.5 w-3.5 text-yellow-400" />
          <span>CYBERSECURITY ENGINE v1.0 — REAL-TIME SHIELD ENGAGED</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
          Advanced Discord Server <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-indigo-300">
            Defense & Management Platform
          </span>
        </h1>

        <p className="max-w-2xl text-gray-400 text-lg mb-10 leading-relaxed">
          Autonomous Anti-Raid velocity gating, Anti-Nuke audit log attribution, proactive Anti-Spam filters, configuration backups and real-time cybersecurity telemetry.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/servers"
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white font-semibold text-base hover:opacity-95 transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2"
          >
            <Server className="h-5 w-5" />
            <span>Manage My Servers</span>
          </Link>
          <Link
            href="/login"
            className="px-8 py-3.5 rounded-xl bg-[#121626] hover:bg-[#1a2035] text-gray-200 font-semibold text-base border border-[#222a45] transition-all"
          >
            Discord OAuth2 Login
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full text-left">
          <div className="p-6 rounded-2xl bg-[#0e111c] border border-[#1b2238] hover:border-purple-500/40 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
              <Zap className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="font-bold text-lg text-gray-100 mb-2">Autonomous Anti-Raid</h3>
            <p className="text-gray-400 text-sm">
              Monitors join spikes with sliding-window algorithms and account age heuristics. Auto-quarantines botnet raids in seconds.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0e111c] border border-[#1b2238] hover:border-cyan-500/40 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
              <Lock className="h-5 w-5 text-cyan-400" />
            </div>
            <h3 className="font-bold text-lg text-gray-100 mb-2">Proactive Anti-Nuke</h3>
            <p className="text-gray-400 text-sm">
              Inspects rapid channel/role deletions and unauthorized admin privileges via audit logs. Strips offending roles instantaneously.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0e111c] border border-[#1b2238] hover:border-indigo-500/40 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4">
              <Activity className="h-5 w-5 text-indigo-400" />
            </div>
            <h3 className="font-bold text-lg text-gray-100 mb-2">Server Snapshots & Recovery</h3>
            <p className="text-gray-400 text-sm">
              Captures structured backups of channels, categories, permission overwrites and role hierarchies with preview verification.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#181d2e] py-6 text-center text-xs text-gray-500 font-mono">
        NEXUS GUARD PLATFORM — PRODUCTION READY CYBERSECURITY ECOSYSTEM
      </footer>
    </div>
  );
}
