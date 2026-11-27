import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { guildId: string } }) {
  const { guildId } = params;

  return NextResponse.json({
    guild: {
      guildId,
      guildName: 'Nexus Defense Server'
    },
    metrics: {
      totalIncidents: 14,
      activeAlerts: 0,
      totalModerationCases: 32,
      openTickets: 2,
      isLockedDown: false,
      antiRaidStatus: true,
      antiNukeStatus: true,
      antiSpamStatus: true,
      antiBotStatus: true
    }
  });
}
