import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Return test/current session
  return NextResponse.json({
    id: 'operator_demo_id',
    username: 'SecurityOperator',
    discriminator: '0',
    avatar: null,
    guilds: [
      {
        id: '123456789012345678',
        name: 'Nexus Security Alpha',
        owner: true,
        permissions: '8'
      }
    ]
  });
}
