import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { isServerManager } from '@nexus-guard/security';
import { GuildModel } from '@nexus-guard/database';

export function requireGuildPermission(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const guildId = req.params.guildId || req.body?.guildId;
  if (!guildId) {
    res.status(400).json({ error: 'Missing guildId parameter.' });
    return;
  }

  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Unauthorized: User not authenticated.' });
    return;
  }

  // Look up guild in user's known guilds
  const userGuild = user.guilds?.find(g => g.id === guildId);

  // If user is guild owner, permission granted
  if (userGuild?.owner) {
    return next();
  }

  // Check if permissions include MANAGE_GUILD or ADMINISTRATOR
  if (userGuild && isServerManager(userGuild.permissions)) {
    return next();
  }

  res.status(403).json({
    error: 'Forbidden: You must have "Manage Server" or "Administrator" permissions to access this guild.'
  });
}
