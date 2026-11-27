'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Gavel, Search, Shield, Filter } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function ModerationCasesPage() {
  const { guildId } = useParams();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCases() {
      try {
        const res = await fetchApi(`/api/moderation/${guildId}/cases`);
        setCases(res.cases || []);
      } catch {
        // Fallback demo data
        setCases([
          { caseNumber: 28, action: 'WARN', targetTag: 'user_spammer#0', moderatorTag: 'NexusMod#0', reason: 'Excessive caps spam in chat', createdAt: new Date().toISOString() },
          { caseNumber: 27, action: 'TIMEOUT', targetTag: 'adbot_alpha#0', moderatorTag: 'Nexus Guard System', reason: 'Anti-Spam: Unsolicited Discord server invite', createdAt: new Date(Date.now() - 7200000).toISOString() },
          { caseNumber: 26, action: 'BAN', targetTag: 'raider_99#0', moderatorTag: 'Nexus Guard System', reason: 'Anti-Raid: Join velocity spike participant', createdAt: new Date(Date.now() - 86400000).toISOString() }
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadCases();
  }, [guildId]);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Gavel className="h-6 w-6 text-purple-400" />
            Moderation Case Records
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Complete disciplinary records, automated AutoMod actions, and manual staff enforcement history.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-[#0d101c] border border-[#1b2238] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#090b14] border-b border-[#1b2238] text-xs font-mono text-gray-400">
            <tr>
              <th className="p-4">Case</th>
              <th className="p-4">Action</th>
              <th className="p-4">Target Member</th>
              <th className="p-4">Moderator</th>
              <th className="p-4">Reason</th>
              <th className="p-4 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1b2238]">
            {cases.map((c) => (
              <tr key={c.caseNumber} className="hover:bg-[#121626] transition-colors">
                <td className="p-4 font-mono text-xs font-bold text-cyan-400">#{c.caseNumber}</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-purple-950/80 text-purple-300 border border-purple-800">
                    {c.action}
                  </span>
                </td>
                <td className="p-4 font-medium text-gray-200">{c.targetTag}</td>
                <td className="p-4 text-xs font-mono text-gray-400">{c.moderatorTag}</td>
                <td className="p-4 text-xs text-gray-300 max-w-xs truncate">{c.reason}</td>
                <td className="p-4 text-right font-mono text-xs text-gray-500">
                  {new Date(c.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
