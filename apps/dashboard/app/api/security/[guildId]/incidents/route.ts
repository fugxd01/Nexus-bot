import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { guildId: string } }) {
  return NextResponse.json({
    incidents: [
      {
        _id: 'inc_101',
        type: 'RAID_DETECTED',
        severity: 'CRITICAL',
        status: 'ACTIVE',
        title: 'Mass Join Velocity Spike Detected',
        description: '6 members joined within 9 seconds with default avatars.',
        recommendedAction: 'Verify accounts in join log.',
        mitigationTaken: 'Auto-kicked 6 accounts.',
        createdAt: new Date().toISOString()
      },
      {
        _id: 'inc_102',
        type: 'SPAM_BURST',
        severity: 'MEDIUM',
        status: 'RESOLVED',
        title: 'Invite Link Flood Quarantined',
        description: 'User sent 5 identical invite links in under 3 seconds.',
        recommendedAction: 'Inspect recent user activity.',
        mitigationTaken: 'Timed out for 300s.',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ]
  });
}
