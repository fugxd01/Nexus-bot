import { Router, Request, Response } from 'express';
import { loadConfig } from '@nexus-guard/config';
import { UserModel, SessionModel } from '@nexus-guard/database';
import { signAuthToken } from '@nexus-guard/security';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const authRouter = Router();

// 1. GET LOGIN URL
authRouter.get('/login', (req: Request, res: Response) => {
  const config = loadConfig();
  const params = new URLSearchParams({
    client_id: config.DISCORD_CLIENT_ID,
    redirect_uri: config.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify email guilds'
  });

  const oauthUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  res.json({ url: oauthUrl });
});

// 2. OAUTH CALLBACK
authRouter.post('/callback', async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) {
    res.status(400).json({ error: 'Authorization code is required.' });
    return;
  }

  const config = loadConfig();

  try {
    // Exchange Code for Access Token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.DISCORD_CLIENT_ID,
        client_secret: config.DISCORD_CLIENT_SECRET || '',
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.DISCORD_REDIRECT_URI
      })
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      res.status(400).json({ error: 'Failed to exchange authorization code with Discord.', details: errBody });
      return;
    }

    const tokenData = await tokenResponse.json() as any;
    const { access_token, refresh_token, expires_in } = tokenData;

    // Fetch User Identity
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const discordUser = await userRes.json() as any;

    // Fetch User Guilds
    const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const userGuilds = await guildsRes.json() as any[];

    // Save/Update in Database
    const tokenExpiresAt = new Date(Date.now() + (expires_in || 604800) * 1000);
    const updatedUser = await UserModel.findOneAndUpdate(
      { discordId: discordUser.id },
      {
        discordId: discordUser.id,
        username: discordUser.username,
        discriminator: discordUser.discriminator || '0',
        avatar: discordUser.avatar,
        email: discordUser.email,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt,
        guilds: (userGuilds || []).map(g => ({
          id: g.id,
          name: g.name,
          icon: g.icon,
          owner: g.owner,
          permissions: g.permissions
        }))
      },
      { upsert: true, new: true }
    );

    // Create Session
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await SessionModel.create({
      sessionId,
      userId: discordUser.id,
      userTag: `${discordUser.username}#${discordUser.discriminator || '0'}`,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: tokenExpiresAt,
      ipAddress: req.ip
    });

    // Sign JWT
    const jwtToken = signAuthToken({ userId: discordUser.id, sessionId }, config.JWT_SECRET, '7d');

    res.json({
      token: jwtToken,
      user: {
        id: updatedUser.discordId,
        username: updatedUser.username,
        avatar: updatedUser.avatar,
        guilds: updatedUser.guilds
      }
    });
  } catch (err: any) {
    console.error('[AUTH ERROR] Discord OAuth failed:', err);
    res.status(500).json({ error: 'Internal authentication server error.' });
  }
});

// 3. GET CURRENT USER PROFILE
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  res.json({
    id: user.discordId,
    username: user.username,
    discriminator: user.discriminator,
    avatar: user.avatar,
    guilds: user.guilds || []
  });
});

// 4. LOGOUT
authRouter.post('/logout', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  res.json({ message: 'Successfully logged out.' });
});
