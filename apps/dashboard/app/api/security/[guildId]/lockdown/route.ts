import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { guildId: string } }) {
  const { action, reason } = await req.json();
  const isLockdown = action === 'ACTIVATE';

  return NextResponse.json({
    success: true,
    isLockedDown: isLockdown,
    message: isLockdown 
      ? 'Emergency server containment engaged on all public communication channels.' 
      : 'Lockdown lifted. Normal permissions restored.'
  });
}
