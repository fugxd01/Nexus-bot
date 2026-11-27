import { NextRequest, NextResponse } from 'next/server';
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  if (error || !code) {
    return NextResponse.redirect(new URL('/login?error=cancelled', req.url));
  }
  const clientId = process.env.DISCORD_CLIENT_ID || process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '';
  const clientSecret = process.env.DISCORD_CLIENT_SECRET || '';
  const redirectUri = process.env.DISCORD_REDIRECT_URI || '';
  try {
    // 1. Exchange code for access token
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
      return NextResponse.redirect(new URL('/login?error=token_failed', req.url));
    }
    const tokenData = await tokenRes.json();
    const { access_token } = tokenData;
    // 2. Fetch user + guilds in parallel
    const [userRes, guildsRes] = await Promise.all([
      fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${access_token}` }
      }),
      fetch('https://discord.com/api/users/@me/guilds', {
        headers: { Authorization: `Bearer ${access_token}` }
      })
    ]);
    const discordUser = await userRes.json();
    const discordGuilds = await guildsRes.json();
    // 3. Store session in cookie
    const sessionPayload = {
