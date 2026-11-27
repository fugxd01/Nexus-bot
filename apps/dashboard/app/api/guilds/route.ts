import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Manageable servers list
  return NextResponse.json({
    guilds: [
      {
        id: '123456789012345678',
        name: 'Nexus Security Alpha',
        owner: true,
        hasBot: true,
        permissions: '8'
      },
      {
        id: '987654321098765432',
        name: 'Developer Sandbox',
        owner: true,
        hasBot: false,
        permissions: '32'
      }
    ]
  });
}
