'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Hash, Volume2, Lock, Unlock, Clock, Plus } from 'lucide-react';

export default function ChannelManagerPage() {
  const { guildId } = useParams();
  const [channels, setChannels] = useState([
    { id: '1', name: 'announcements', type: 'text', slowmode: 0, locked: false },
    { id: '2', name: 'general-chat', type: 'text', slowmode: 5, locked: false },
    { id: '3', name: 'security-alerts', type: 'text', slowmode: 0, locked: true },
    { id: '4', name: 'General Voice', type: 'voice', slowmode: 0, locked: false }
  ]);
  const [channelName, setChannelName] = useState('');

  const toggleChannelLock = (id: string) => {
    setChannels(channels.map(c => c.id === id ? { ...c, locked: !c.locked } : c));
  };

  const updateSlowmode = (id: string, seconds: number) => {
    setChannels(channels.map(c => c.id === id ? { ...c, slowmode: seconds } : c));
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Hash className="h-6 w-6 text-cyan-400" />
          Channel Manager & Slowmode Control
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Configure channel messaging limits, slowmode throttling, and emergency channel isolation.
        </p>
      </div>

      {/* Channel List */}
      <div className="rounded-2xl bg-[#0d101c] border border-[#1b2238] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#090b14] border-b border-[#1b2238] text-xs font-mono text-gray-400">
            <tr>
              <th className="p-4">Channel</th>
              <th className="p-4">Type</th>
              <th className="p-4">Slowmode (Cooldown)</th>
              <th className="p-4">State</th>
              <th className="p-4 text-right">Quick Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1b2238]">
            {channels.map((c) => (
              <tr key={c.id} className="hover:bg-[#121626] transition-colors">
                <td className="p-4 font-medium flex items-center gap-2 text-gray-100">
                  {c.type === 'voice' ? <Volume2 className="h-4 w-4 text-gray-400" /> : <Hash className="h-4 w-4 text-cyan-400" />}
                  <span>{c.name}</span>
                </td>
                <td className="p-4 font-mono text-xs text-gray-400 uppercase">{c.type}</td>
                <td className="p-4">
                  {c.type === 'text' ? (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-gray-500" />
                      <select
                        value={c.slowmode}
                        onChange={(e) => updateSlowmode(c.id, parseInt(e.target.value))}
                        className="px-2 py-1 rounded bg-[#080a12] border border-[#232b47] text-xs font-mono text-gray-200"
                      >
                        <option value={0}>Off</option>
                        <option value={5}>5s</option>
                        <option value={15}>15s</option>
                        <option value={60}>1m</option>
                        <option value={300}>5m</option>
                      </select>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 font-mono">N/A</span>
                  )}
                </td>
                <td className="p-4">
                  {c.locked ? (
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-rose-950/80 text-rose-400 border border-rose-800">
                      LOCKED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                      OPEN
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => toggleChannelLock(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                      c.locked 
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                        : 'bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300'
                    }`}
                  >
                    {c.locked ? 'Unlock' : 'Lock Channel'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
