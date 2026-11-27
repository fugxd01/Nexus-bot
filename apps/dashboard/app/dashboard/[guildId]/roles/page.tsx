'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { KeyRound, ShieldAlert, Plus, Check } from 'lucide-react';

export default function RoleManagerPage() {
  const { guildId } = useParams();
  const [roles, setRoles] = useState([
    { id: '1', name: 'Nexus Administrator', color: '#7c3aed', position: 10, dangerous: true, admin: true, memberCount: 2 },
    { id: '2', name: 'Senior Moderator', color: '#00d2ff', position: 8, dangerous: true, admin: false, memberCount: 5 },
    { id: '3', name: 'Server Security Guard', color: '#10b981', position: 5, dangerous: false, admin: false, memberCount: 14 },
    { id: '4', name: 'Verified Member', color: '#94a3b8', position: 1, dangerous: false, admin: false, memberCount: 412 }
  ]);
  const [newRoleName, setNewRoleName] = useState('');

  const addRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setRoles([
      {
        id: String(Date.now()),
        name: newRoleName.trim(),
        color: '#6366f1',
        position: roles.length + 1,
        dangerous: false,
        admin: false,
        memberCount: 0
      },
      ...roles
    ]);
    setNewRoleName('');
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <KeyRound className="h-6 w-6 text-purple-400" />
          Role Manager & Hierarchy Guard
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Inspect dangerous permission escalations, role hierarchy ordering, and administrative privileges.
        </p>
      </div>

      {/* Create Role Input */}
      <form onSubmit={addRole} className="p-4 rounded-xl bg-[#0d101c] border border-[#1b2238] flex gap-3">
        <input
          type="text"
          placeholder="New role name..."
          value={newRoleName}
          onChange={(e) => setNewRoleName(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg bg-[#080a12] border border-[#232b47] text-white text-sm focus:outline-none focus:border-purple-500 font-mono"
        />
        <button
          type="submit"
          className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs font-mono flex items-center gap-1.5 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Create Role</span>
        </button>
      </form>

      {/* Role Hierarchy Table */}
      <div className="rounded-2xl bg-[#0d101c] border border-[#1b2238] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#090b14] border-b border-[#1b2238] text-xs font-mono text-gray-400">
            <tr>
              <th className="p-4">Position</th>
              <th className="p-4">Role Name</th>
              <th className="p-4">Members</th>
              <th className="p-4">Permission Risk</th>
              <th className="p-4 text-right">Administrator Bit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1b2238]">
            {roles.map((r) => (
              <tr key={r.id} className="hover:bg-[#121626] transition-colors">
                <td className="p-4 font-mono text-xs text-gray-500">#{r.position}</td>
                <td className="p-4 font-medium flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: r.color }} />
                  <span className="text-gray-100">{r.name}</span>
                </td>
                <td className="p-4 font-mono text-xs text-gray-400">{r.memberCount} members</td>
                <td className="p-4">
                  {r.dangerous ? (
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-rose-950/80 text-rose-400 border border-rose-800 flex items-center gap-1.5 w-fit">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      HIGH PRIVILEGE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800 w-fit">
                      STANDARD
                    </span>
                  )}
                </td>
                <td className="p-4 text-right font-mono text-xs">
                  {r.admin ? (
                    <span className="text-rose-400 font-bold">YES (0x8)</span>
                  ) : (
                    <span className="text-gray-500">NO</span>
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
