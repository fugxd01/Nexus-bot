import { Request, Response, NextFunction } from 'express';
import { SlidingWindowRateLimiter } from '@nexus-guard/security';

const apiLimiter = new SlidingWindowRateLimiter(60, 60000); // 60 requests per minute per IP

export function apiRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
  const check = apiLimiter.isRateLimited(ip);

  if (check.limited) {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please cool down before making further requests.',
      retryAfterSeconds: Math.ceil(check.retryAfterMs / 1000)
    });
    return;
  }

  next();
}
