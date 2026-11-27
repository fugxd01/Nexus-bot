'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Users, Gavel, UserX, Clock, Edit2, ShieldAlert } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function MemberManagementPage() {
  const { guildId } = useParams();
  const [targetId, setTargetId] = useState('');
  const [targetTag, setTargetTag] = useState('');
  const [action, setAction] = useState('WARN');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState(300);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId.trim()) {
      alert('Please enter target User ID');
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    try {
      await fetchApi(`/api/moderation/${guildId}/cases`, {
        method: 'POST',
        body: JSON.stringify({
          action,
          targetId: targetId.trim(),
          targetTag: targetTag.trim() || targetId.trim(),
          reason: reason.trim() || 'Moderation action taken from Web Dashboard',
          durationSeconds: action === 'TIMEOUT' ? duration : undefined
        })
      });
      setStatusMessage(`Successfully executed ${action} on ${targetId}.`);
      setTargetId('');
      setTargetTag('');
      setReason('');
    } catch (err: any) {
      alert(`Moderation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Users className="h-6 w-6 text-cyan-400" />
          Member Management & Moderation
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Perform administrative sanctions with role-hierarchy verification and audit logging.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Card */}
        <form onSubmit={handleSubmit} className="md:col-span-2 p-8 rounded-2xl bg-[#0d101c] border border-[#1b2238] space-y-5">
          <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
            <Gavel className="h-4 w-4 text-purple-400" />
            Issue Member Sanction
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Target Discord User ID *</label>
              <input
                type="text"
                placeholder="e.g. 123456789012345678"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#080a12] border border-[#232b47] text-white text-sm font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Username / Tag</label>
              <input
                type="text"
                placeholder="e.g. rogueuser"
                value={targetTag}
                onChange={(e) => setTargetTag(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#080a12] border border-[#232b47] text-white text-sm font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1.5">Action Type</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#080a12] border border-[#232b47] text-white text-sm font-mono focus:outline-none focus:border-purple-500"
            >
              <option value="WARN">Formal Warning (WARN)</option>
              <option value="TIMEOUT">Timeout / Quarantine (TIMEOUT)</option>
              <option value="KICK">Kick from Server (KICK)</option>
              <option value="BAN">Ban from Server (BAN)</option>
              <option value="UNBAN">Remove Ban (UNBAN)</option>
              <option value="REMOVE_TIMEOUT">Remove Timeout (REMOVE_TIMEOUT)</option>
            </select>
          </div>

          {action === 'TIMEOUT' && (
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Timeout Duration (Seconds)</label>
              <input
                type="number"
                min={60}
                max={2419200}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#080a12] border border-[#232b47] text-white text-sm font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1.5">Sanction Reason</label>
            <textarea
              rows={3}
              placeholder="State clear infraction or security alert reference..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#080a12] border border-[#232b47] text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          {statusMessage && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-mono">
              {statusMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs font-mono transition-all shadow-md shadow-purple-600/30"
          >
            {loading ? 'Executing Sanction...' : `Confirm & Apply ${action}`}
          </button>
        </form>

        {/* Hierarchy Information Box */}
        <div className="p-6 rounded-2xl bg-[#0d101c] border border-[#1b2238] space-y-4">
          <h3 className="font-semibold text-sm text-gray-200 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            Hierarchy Rules
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Nexus Guard validates Discord role hierarchy before executing administrative actions. You cannot moderate the Server Owner or members with roles higher than your highest role.
          </p>
          <div className="p-3 rounded-xl bg-[#080a12] border border-[#1e253d] text-[11px] font-mono text-gray-400 space-y-1">
            <div>• Server Owner: Immune</div>
            <div>• Hierarchy Violations: Blocked</div>
            <div>• Audit Trail: Immutable</div>
          </div>
        </div>
      </div>
    </div>
  );
}
