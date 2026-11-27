'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  LayoutDashboard,
  Server,
  Shield,
  Zap,
  Bomb,
  MessageSquareWarning,
  Users,
  KeyRound,
  Hash,
  Gavel,
  Ticket,
  Sparkles,
  Bot,
  Cpu,
  History,
  DatabaseBackup,
  Settings,
  Activity,
  UserCheck
} from 'lucide-react';

interface SidebarProps {
  guildId: string;
}

export function Sidebar({ guildId }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: '1. Overview', href: `/dashboard/${guildId}`, icon: LayoutDashboard },
    { name: '2. Server Selector', href: '/servers', icon: Server },
    { name: '3. Security Center', href: `/dashboard/${guildId}/security`, icon: ShieldAlert, badge: 'Live' },
    { name: '4. Anti-Raid', href: `/dashboard/${guildId}/antiraid`, icon: Zap },
    { name: '5. Anti-Nuke', href: `/dashboard/${guildId}/antinuke`, icon: Bomb },
    { name: '6. Anti-Spam', href: `/dashboard/${guildId}/antispam`, icon: MessageSquareWarning },
    { name: '7. Member Management', href: `/dashboard/${guildId}/members`, icon: Users },
    { name: '8. Role Manager', href: `/dashboard/${guildId}/roles`, icon: KeyRound },
    { name: '9. Channel Manager', href: `/dashboard/${guildId}/channels`, icon: Hash },
    { name: '10. Moderation', href: `/dashboard/${guildId}/moderation`, icon: Gavel },
    { name: '11. Ticket System', href: `/dashboard/${guildId}/tickets`, icon: Ticket },
    { name: '12. Welcome System', href: `/dashboard/${guildId}/welcome`, icon: Sparkles },
    { name: '13. Auto Moderation', href: `/dashboard/${guildId}/automod`, icon: Bot },
    { name: '14. Automation', href: `/dashboard/${guildId}/automation`, icon: Cpu },
    { name: '15. Audit Logs', href: `/dashboard/${guildId}/audit-logs`, icon: History },
    { name: '16. Backup & Recovery', href: `/dashboard/${guildId}/backups`, icon: DatabaseBackup },
    { name: '17. Bot Settings', href: `/dashboard/${guildId}/settings`, icon: Settings },
    { name: '18. API Status', href: `/dashboard/${guildId}/api-status`, icon: Activity },
    { name: '19. Account Settings', href: `/dashboard/${guildId}/account`, icon: UserCheck }
  ];

  return (
    <aside className="w-72 bg-[#0a0c14] border-r border-[#1a1f33] flex flex-col h-screen sticky top-0 overflow-y-auto">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1a1f33] flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-white">
            NEXUS GUARD
          </h1>
          <p className="text-xs text-gray-400 tracking-widest font-mono">CYBER DEFENSE v1.0</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-900/60 to-purple-800/20 text-cyan-300 border border-purple-500/40 shadow-sm shadow-purple-500/10'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-[#121626]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-gray-500'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-[#1a1f33] text-xs text-gray-500 font-mono">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Shield Online
          </span>
          <span>Atlas M0</span>
        </div>
      </div>
    </aside>
  );
}
