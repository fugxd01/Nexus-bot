import { Request, Response, NextFunction } from 'express';
import { verifyAuthToken } from '@nexus-guard/security';
import { loadConfig } from '@nexus-guard/config';
import { UserModel, IUser } from '@nexus-guard/database';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  userId?: string;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers.cookie) {
    // Parse cookie if present
    const match = req.headers.cookie.match(/nexus_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Authentication token is missing.' });
    return;
  }

  const config = loadConfig();
  const payload = verifyAuthToken<{ userId: string }>(token, config.JWT_SECRET);

  if (!payload || !payload.userId) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired authentication token.' });
    return;
  }

  const user = await UserModel.findOne({ discordId: payload.userId });
  if (!user) {
    res.status(401).json({ error: 'Unauthorized: User account not found.' });
    return;
  }

  req.user = user;
  req.userId = user.discordId;
  next();
}
