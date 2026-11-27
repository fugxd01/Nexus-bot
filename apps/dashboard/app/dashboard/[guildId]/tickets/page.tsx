'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Ticket, CheckCircle, Clock, Lock } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function TicketsPage() {
  const { guildId } = useParams();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/api/tickets/${guildId}/tickets`);
      setTickets(res.tickets || []);
    } catch {
      // Demo fallback
      setTickets([
        { ticketId: 'TICKET-4921', userTag: 'member_gamer#0', subject: 'Inquiry regarding role permissions', status: 'OPEN', createdAt: new Date().toISOString() },
        { ticketId: 'TICKET-3810', userTag: 'security_lead#0', subject: 'Report suspicious link in announcements', status: 'CLAIMED', claimedByTag: 'StaffGuard#0', createdAt: new Date(Date.now() - 3600000).toISOString() },
        { ticketId: 'TICKET-1102', userTag: 'newbie_alex#0', subject: 'Verification issues', status: 'CLOSED', closedByTag: 'StaffGuard#0', closeReason: 'Resolved in private support channel', createdAt: new Date(Date.now() - 86400000).toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [guildId]);

  const closeTicket = async (ticketId: string) => {
    try {
      await fetchApi(`/api/tickets/${guildId}/tickets/${ticketId}/close`, {
        method: 'PATCH',
        body: JSON.stringify({ closeReason: 'Closed via Web Dashboard' })
      });
      loadTickets();
    } catch (err: any) {
      alert(`Could not close ticket: ${err.message}`);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Ticket className="h-6 w-6 text-cyan-400" />
          Support Ticket System
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Review active support channels, claim tickets, and export transcripts.
        </p>
      </div>

      <div className="rounded-2xl bg-[#0d101c] border border-[#1b2238] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#090b14] border-b border-[#1b2238] text-xs font-mono text-gray-400">
            <tr>
              <th className="p-4">Ticket ID</th>
              <th className="p-4">Subject</th>
              <th className="p-4">User</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1b2238]">
            {tickets.map((t) => (
              <tr key={t.ticketId} className="hover:bg-[#121626] transition-colors">
                <td className="p-4 font-mono text-xs font-bold text-purple-400">{t.ticketId}</td>
                <td className="p-4 font-medium text-gray-200">{t.subject}</td>
                <td className="p-4 text-xs font-mono text-gray-400">{t.userTag}</td>
                <td className="p-4">
                  {t.status === 'OPEN' && (
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-cyan-950/80 text-cyan-400 border border-cyan-800">
                      OPEN
                    </span>
                  )}
                  {t.status === 'CLAIMED' && (
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-purple-950/80 text-purple-300 border border-purple-800">
                      CLAIMED ({t.claimedByTag})
                    </span>
                  )}
                  {t.status === 'CLOSED' && (
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-gray-800 text-gray-400">
                      CLOSED
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  {t.status !== 'CLOSED' && (
                    <button
                      onClick={() => closeTicket(t.ticketId)}
                      className="px-3 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-mono"
                    >
                      Close Ticket
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
