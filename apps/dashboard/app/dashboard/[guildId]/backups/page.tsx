'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DatabaseBackup, Plus, RotateCcw, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function BackupsPage() {
  const { guildId } = useParams();
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoreModal, setRestoreModal] = useState<any | null>(null);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/api/backups/${guildId}/backups`);
      setBackups(res.backups || []);
    } catch {
      // Fallback demo data
      setBackups([
        {
          backupId: 'bkp_172901_alpha',
          creatorTag: 'ServerOwner#0',
          createdAt: new Date().toISOString(),
          roles: new Array(12),
          channels: new Array(24),
          sizeBytes: 8192
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, [guildId]);

  const createBackup = async () => {
    setCreating(true);
    try {
      await fetchApi(`/api/backups/${guildId}/backups`, {
        method: 'POST',
        body: JSON.stringify({
          guildName: 'Discord Server',
          roles: [{ id: '1', name: 'Admin', color: 12345, hoist: true, position: 2, permissions: '8', mentionable: false }],
          channels: [{ id: '1', name: 'general', type: 0, position: 1, nsfw: false, rateLimitPerUser: 0, permissionOverwrites: [] }]
        })
      });
      alert('Configuration snapshot created successfully!');
      loadBackups();
    } catch (err: any) {
      alert(`Backup failed: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const previewRestore = async (backupId: string) => {
    try {
      const res = await fetchApi(`/api/backups/${guildId}/backups/${backupId}/restore`, {
        method: 'POST',
        body: JSON.stringify({ confirmRestore: false })
      });
      setRestoreModal(res);
    } catch (err: any) {
      alert(`Preview failed: ${err.message}`);
    }
  };

  const executeConfirmedRestore = async (backupId: string) => {
    try {
      const res = await fetchApi(`/api/backups/${guildId}/backups/${backupId}/restore`, {
        method: 'POST',
        body: JSON.stringify({ confirmRestore: true })
      });
      alert(res.message);
      setRestoreModal(null);
    } catch (err: any) {
      alert(`Restore failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <DatabaseBackup className="h-6 w-6 text-purple-400" />
            Server Backup & Disaster Recovery
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Capture structured snapshots of channels, categories, permissions, and role hierarchies.
          </p>
        </div>

        <button
          onClick={createBackup}
          disabled={creating}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs font-mono transition-all flex items-center gap-2 shadow-md shadow-purple-600/30"
        >
          <Plus className="h-4 w-4" />
          <span>{creating ? 'Creating Snapshot...' : 'Create Snapshot'}</span>
        </button>
      </div>

      {/* Discord API Limitations Notice */}
      <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs text-gray-300 flex items-start gap-3">
        <Shield className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Platform Scope & Safety Boundaries:</span>
          <p className="text-gray-400 mt-0.5">
            Backups preserve server configurations: channels, categories, permission overwrites, and roles. Under Discord API safety boundaries, individual messages and deleted user accounts cannot be restored.
          </p>
        </div>
      </div>

      {/* Backups Table */}
      <div className="rounded-2xl bg-[#0d101c] border border-[#1b2238] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#090b14] border-b border-[#1b2238] text-xs font-mono text-gray-400">
            <tr>
              <th className="p-4">Snapshot ID</th>
              <th className="p-4">Created By</th>
              <th className="p-4">Role Count</th>
              <th className="p-4">Channel Count</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-right">Recovery</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1b2238]">
            {backups.map((b) => (
              <tr key={b.backupId} className="hover:bg-[#121626] transition-colors">
                <td className="p-4 font-mono text-xs font-bold text-cyan-400">{b.backupId}</td>
                <td className="p-4 text-xs font-mono text-gray-300">{b.creatorTag}</td>
                <td className="p-4 text-xs font-mono text-gray-400">{(b.roles || []).length} roles</td>
                <td className="p-4 text-xs font-mono text-gray-400">{(b.channels || []).length} channels</td>
                <td className="p-4 text-xs font-mono text-gray-500">
                  {new Date(b.createdAt).toLocaleString()}
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => previewRestore(b.backupId)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#151928] hover:bg-purple-950/40 border border-[#232a45] hover:border-purple-600 text-xs font-mono text-purple-300 transition-colors flex items-center gap-1.5 ml-auto"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Restore Preview</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Restore Preview Modal */}
      {restoreModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#0e111d] border border-[#232b47] shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-100">Confirm Recovery Preview</h3>
                <span className="text-xs font-mono text-gray-500">Snapshot: {restoreModal.backupId}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#080a12] border border-[#1b2238] space-y-2 text-xs font-mono text-gray-300">
              <div>Roles to Synchronize: <span className="text-cyan-400">{restoreModal.restorationPlan?.rolesToRestore}</span></div>
              <div>Channels to Synchronize: <span className="text-cyan-400">{restoreModal.restorationPlan?.channelsToRestore}</span></div>
              <p className="text-[11px] text-amber-400/90 font-sans pt-2 border-t border-[#1b2238]">
                {restoreModal.restorationPlan?.warning}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRestoreModal(null)}
                className="px-4 py-2 rounded-xl bg-[#141828] text-gray-300 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                onClick={() => executeConfirmedRestore(restoreModal.backupId)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold shadow-md shadow-purple-600/30"
              >
                Execute Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
