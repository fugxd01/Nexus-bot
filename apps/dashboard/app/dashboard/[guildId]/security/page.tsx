'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ShieldAlert, CheckCircle, Clock, AlertTriangle, Filter } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function SecurityCenterPage() {
  const { guildId } = useParams();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const url = filterStatus === 'ALL' 
        ? `/api/security/${guildId}/incidents` 
        : `/api/security/${guildId}/incidents?status=${filterStatus}`;
      const res = await fetchApi(url);
      setIncidents(res.incidents || []);
    } catch {
      // Demo fallback
      setIncidents([
        {
          _id: 'inc_1',
          type: 'RAID_DETECTED',
          severity: 'CRITICAL',
          status: 'ACTIVE',
          title: 'Mass Member Join Spike Detected',
          description: '6 members joined within 8 seconds with accounts younger than 2 days.',
          recommendedAction: 'Enable temporary member verification and inspect join logs.',
          mitigationTaken: 'Kicked 6 joining accounts.',
          createdAt: new Date().toISOString()
        },
        {
          _id: 'inc_2',
          type: 'SPAM_BURST',
          severity: 'MEDIUM',
          status: 'RESOLVED',
          title: 'Repeated Message Spam Quarantined',
          description: 'User sent 8 identical discord invite links in #general.',
          recommendedAction: 'Verify if member token was compromised.',
          mitigationTaken: 'Timed out for 5 minutes and messages deleted.',
          createdAt: new Date(Date.now() - 3600000).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [guildId, filterStatus]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await fetchApi(`/api/security/${guildId}/incidents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      loadIncidents();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-rose-950/80 text-rose-400 border border-rose-800';
      case 'HIGH': return 'bg-orange-950/80 text-orange-400 border border-orange-800';
      case 'MEDIUM': return 'bg-amber-950/80 text-amber-400 border border-amber-800';
      default: return 'bg-blue-950/80 text-blue-400 border border-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <ShieldAlert className="h-6 w-6 text-purple-400" />
            Security Incident Center
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time cybersecurity threats, audit log alerts and automated mitigation records.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 bg-[#0e111d] p-1.5 rounded-xl border border-[#1b2238]">
          {['ALL', 'ACTIVE', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                filterStatus === st
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents Table / List */}
      <div className="space-y-4">
        {incidents.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#0d101c] border border-[#1b2238] text-gray-500 font-mono text-sm">
            No incidents found matching this status filter.
          </div>
        ) : (
          incidents.map((inc) => (
            <div
              key={inc._id}
              className="p-6 rounded-2xl bg-[#0d101c] border border-[#1b2238] hover:border-purple-500/30 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${getSeverityBadge(inc.severity)}`}>
                    {inc.severity}
                  </span>
                  <span className="text-xs font-mono text-gray-400">{inc.type}</span>
                  <span className="text-xs text-gray-500 font-mono">
                    {new Date(inc.createdAt).toLocaleString()}
                  </span>
                </div>
                <h3 className="font-semibold text-base text-gray-100">{inc.title}</h3>
                <p className="text-xs text-gray-400">{inc.description}</p>
                {inc.mitigationTaken && (
                  <div className="text-xs font-mono text-cyan-400 bg-cyan-950/30 border border-cyan-800/40 px-2.5 py-1 rounded inline-block">
                    Mitigation: {inc.mitigationTaken}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {inc.status === 'ACTIVE' ? (
                  <>
                    <button
                      onClick={() => updateStatus(inc._id, 'ACKNOWLEDGED')}
                      className="px-3.5 py-1.5 rounded-lg bg-[#151928] hover:bg-[#1e243a] border border-[#232a45] text-xs font-mono text-amber-400"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => updateStatus(inc._id, 'RESOLVED')}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold shadow-sm"
                    >
                      Resolve
                    </button>
                  </>
                ) : (
                  <span className="px-3 py-1 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-xs font-mono flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5" />
                    RESOLVED
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
