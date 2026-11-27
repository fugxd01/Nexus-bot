'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Bot, Plus, Trash2, Check } from 'lucide-react';

export default function AutoModPage() {
  const { guildId } = useParams();
  const [rules, setRules] = useState([
    { id: '1', name: 'Anti-Phishing Token Links', type: 'PHISHING_LINKS', enabled: true, action: 'TIMEOUT_MEMBER' },
    { id: '2', name: 'Server Invite Suppression', type: 'INVITE_LINKS', enabled: true, action: 'DELETE_MESSAGE' },
    { id: '3', name: 'Excessive Caps Lock Filter', type: 'CAPS_FLOOD', enabled: true, action: 'WARN_MEMBER' },
    { id: '4', name: 'Banned Profanity List', type: 'BANNED_WORDS', enabled: true, action: 'DELETE_MESSAGE' }
  ]);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleType, setNewRuleType] = useState('BANNED_WORDS');

  const addRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;
    setRules([
      ...rules,
      {
        id: String(Date.now()),
        name: newRuleName.trim(),
        type: newRuleType,
        enabled: true,
        action: 'DELETE_MESSAGE'
      }
    ]);
    setNewRuleName('');
  };

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Bot className="h-6 w-6 text-purple-400" />
          Auto Moderation Engine
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Configurable rule-based content inspection, word blacklists, and automated disciplinary actions.
        </p>
      </div>

      {/* Add New Rule */}
      <form onSubmit={addRule} className="p-4 rounded-xl bg-[#0d101c] border border-[#1b2238] flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="New rule identifier..."
          value={newRuleName}
          onChange={(e) => setNewRuleName(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg bg-[#080a12] border border-[#232b47] text-white text-sm focus:outline-none focus:border-purple-500 font-mono"
        />
        <select
          value={newRuleType}
          onChange={(e) => setNewRuleType(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#080a12] border border-[#232b47] text-white text-xs font-mono"
        >
          <option value="BANNED_WORDS">Banned Words Blacklist</option>
          <option value="INVITE_LINKS">Server Invites</option>
          <option value="PHISHING_LINKS">Phishing / Malicious URLs</option>
          <option value="CAPS_FLOOD">Caps Lock Flood</option>
          <option value="MENTION_LIMIT">Mass Mentions</option>
        </select>
        <button
          type="submit"
          className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Rule</span>
        </button>
      </form>

      {/* Rules Table */}
      <div className="rounded-2xl bg-[#0d101c] border border-[#1b2238] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#090b14] border-b border-[#1b2238] text-xs font-mono text-gray-400">
            <tr>
              <th className="p-4">Rule Name</th>
              <th className="p-4">Pattern Type</th>
              <th className="p-4">Automated Action</th>
              <th className="p-4">State</th>
              <th className="p-4 text-right">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1b2238]">
            {rules.map((r) => (
              <tr key={r.id} className="hover:bg-[#121626] transition-colors">
                <td className="p-4 font-semibold text-gray-200">{r.name}</td>
                <td className="p-4 font-mono text-xs text-purple-300">{r.type}</td>
                <td className="p-4 font-mono text-xs text-gray-400">{r.action}</td>
                <td className="p-4">
                  <button
                    onClick={() => toggleRule(r.id)}
                    className={`px-2.5 py-0.5 rounded text-xs font-mono ${
                      r.enabled
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950/80 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {r.enabled ? 'ACTIVE' : 'DISABLED'}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => removeRule(r.id)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
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
