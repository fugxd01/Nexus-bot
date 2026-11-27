import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 });
    }

    const clientId = process.env.DISCORD_CLIENT_ID || process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '';
    const clientSecret = process.env.DISCORD_CLIENT_SECRET || '';
    const redirectUri = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/api/auth/callback';

    // 1. Exchange code with Discord
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      return NextResponse.json({ error: 'Failed to exchange authorization code with Discord.', details: err }, { status: 400 });
    }

    const tokenData = await tokenRes.json();
    const { access_token } = tokenData;

    // 2. Fetch User Identity
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const discordUser = await userRes.json();

    // 3. Fetch User Guilds
    const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const userGuilds = await guildsRes.json();

    // 4. Return Session
    const mockToken = `nexus_jwt_${discordUser.id}_${Date.now()}`;

    return NextResponse.json({
      token: mockToken,
      user: {
        id: discordUser.id,
        username: discordUser.username,
        avatar: discordUser.avatar,
        guilds: userGuilds || []
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'OAuth callback error', message: error.message }, { status: 500 });
  }
}
