import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { guildId: string } }) {
  return NextResponse.json({
    settings: {
      prefix: '!',
      antiRaid: {
        enabled: true,
        maxJoinsPerInterval: 5,
        intervalSeconds: 10,
        minAccountAgeDays: 3,
        actionOnTrigger: 'KICK_NEW'
      },
      antiNuke: {
        enabled: true,
        maxChannelDeletions: 3,
        maxRoleDeletions: 3,
        maxBans: 3,
        stripAdminOnTrigger: true,
        quarantineOffenderRoles: true,
        whitelistedUserIds: []
      },
      antiSpam: {
        enabled: true,
        maxMessagesPerInterval: 5,
        intervalSeconds: 5,
        maxDuplicates: 3,
        maxMentions: 5,
        blockInvites: true,
        blockSuspiciousLinks: true,
        timeoutDurationSeconds: 300
      },
      welcome: {
        enabled: true,
        welcomeMessage: 'Welcome {user} to {server}!',
        useEmbed: true
      }
    }
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { guildId: string } }) {
  const body = await req.json();
  return NextResponse.json({
    success: true,
    message: 'Settings updated successfully.',
    updated: body
  });
}
