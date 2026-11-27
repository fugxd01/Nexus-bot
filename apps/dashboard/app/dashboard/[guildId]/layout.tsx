'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const guildId = (params.guildId as string) || '';

  return (
    <div className="flex min-h-screen bg-[#07080d]">
      <Sidebar guildId={guildId} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header guildId={guildId} />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
