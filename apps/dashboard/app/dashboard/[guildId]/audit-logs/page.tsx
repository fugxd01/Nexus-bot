'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { History, Shield, CheckCircle } from 'lucide-react';

export default function AuditLogsPage() {
  const { guildId } = useParams();
  const [logs] = useState([
    { id: '1', action: 'EMERGENCY_LOCKDOWN_ACTIVATED', executor: 'Administrator#0', target: 'Server Text Channels', time: '10 minutes ago' },
    { id: '2', action: 'INCIDENT_UPDATE_RESOLVED', executor: 'SecurityMod#0', target: 'Incident #inc_1', time: '1 hour ago' },
    { id: '3', action: 'BACKUP_CREATED', executor: 'Owner#0', target: 'Snapshot bkp_172901', time: '3 hours ago' },
    { id: '4', action: 'SECURITY_INCIDENT_RAID_DETECTED', executor: 'NEXUS-GUARD-SYSTEM', target: 'Join Velocity Guard', time: '4 hours ago' }
  ]);

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <History className="h-6 w-6 text-purple-400" />
          Security Audit Trail
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Cryptographically recorded actions, administrative overrides, and system mitigation logs.
        </p>
      </div>

      <div className="rounded-2xl bg-[#0d101c] border border-[#1b2238] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#090b14] border-b border-[#1b2238] text-xs font-mono text-gray-400">
            <tr>
              <th className="p-4">Action</th>
              <th className="p-4">Executor</th>
              <th className="p-4">Target / Entity</th>
              <th className="p-4 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1b2238]">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-[#121626] transition-colors">
                <td className="p-4 font-mono text-xs text-cyan-400 font-bold">{l.action}</td>
                <td className="p-4 font-mono text-xs text-gray-300">{l.executor}</td>
                <td className="p-4 text-xs text-gray-400">{l.target}</td>
                <td className="p-4 text-right font-mono text-xs text-gray-500">{l.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
