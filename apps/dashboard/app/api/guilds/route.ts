import { NextRequest, NextResponse } from 'next/server';
const ADMINISTRATOR = BigInt(0x8);
const MANAGE_GUILD = BigInt(0x20);
export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get('nexus_session');
  if (!sessionCookie?.value) {
    return NextResponse.json({ error: 'Not authenticated', guilds: [] }, { status: 401 });
  }
  try {
    const session = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'));
    const rawGuilds: any[] = Array.isArray(session.guilds) ? session.guilds : [];
    // Filter only servers where user has Manage Server or Administrator
    const manageable = rawGuilds
      .filter((g) => {
        try {
          const perms = BigInt(g.permissions || '0');
          return (perms & ADMINISTRATOR) !== 0n || (perms & MANAGE_GUILD) !== 0n;
        } catch {
          return g.owner === true;
        }
      })
      .map((g) => ({
        id: g.id,
        name: g.name,
        icon: g.icon || null,
        owner: g.owner || false,
        hasBot: false, // Will be enhanced when bot is online
        permissions: g.permissions
      }));
    return NextResponse.json({ guilds: manageable });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid session', guilds: [] }, { status: 401 });
  }
}
