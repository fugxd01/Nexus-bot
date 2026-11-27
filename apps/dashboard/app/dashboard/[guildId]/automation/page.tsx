'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Cpu, Plus, Play, Trash2 } from 'lucide-react';

export default function AutomationWorkflowsPage() {
  const { guildId } = useParams();
  const [workflows, setWorkflows] = useState([
    { id: '1', name: 'Scheduled Security Bulletin', trigger: 'SCHEDULED_INTERVAL', action: 'SEND_ANNOUNCEMENT', enabled: true },
    { id: '2', name: 'Welcome DM Dispatcher', trigger: 'MEMBER_JOIN', action: 'SEND_DM', enabled: true },
    { id: '3', name: 'High Threat Auto-Lockdown', trigger: 'SECURITY_ALERT', action: 'LOCKDOWN_CHANNEL', enabled: true }
  ]);

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Cpu className="h-6 w-6 text-cyan-400" />
          Server Automation & Scheduled Workflows
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Create automated event-triggered or cron-scheduled workflows without writing custom code.
        </p>
      </div>

      <div className="rounded-2xl bg-[#0d101c] border border-[#1b2238] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#090b14] border-b border-[#1b2238] text-xs font-mono text-gray-400">
            <tr>
              <th className="p-4">Workflow Name</th>
              <th className="p-4">Trigger</th>
              <th className="p-4">Dispatched Action</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Execute</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1b2238]">
            {workflows.map((wf) => (
              <tr key={wf.id} className="hover:bg-[#121626] transition-colors">
                <td className="p-4 font-semibold text-gray-200">{wf.name}</td>
                <td className="p-4 font-mono text-xs text-purple-300">{wf.trigger}</td>
                <td className="p-4 font-mono text-xs text-cyan-300">{wf.action}</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                    ENABLED
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => alert(`Triggered automation workflow: ${wf.name}`)}
                    className="px-3 py-1 rounded-lg bg-[#151928] hover:bg-[#1e243a] border border-[#232a45] text-xs font-mono text-cyan-400 flex items-center gap-1.5 ml-auto"
                  >
                    <Play className="h-3 w-3" />
                    <span>Run Now</span>
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
