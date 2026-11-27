import jwt from 'jsonwebtoken';
import { DiscordPermissionBitField } from '@nexus-guard/shared';

// ==================================================
// DISCORD PERMISSION CHECKER
// ==================================================
export function hasPermission(userPermissions: string | bigint | number, requiredPermission: bigint): boolean {
  try {
    const bitfield = typeof userPermissions === 'bigint' 
      ? userPermissions 
      : BigInt(userPermissions || 0);

    // If user has ADMINISTRATOR, they have all permissions
    if ((bitfield & DiscordPermissionBitField.ADMINISTRATOR) === DiscordPermissionBitField.ADMINISTRATOR) {
      return true;
    }

    return (bitfield & requiredPermission) === requiredPermission;
  } catch {
    return false;
  }
}

export function isServerManager(userPermissions: string | bigint | number): boolean {
  return hasPermission(userPermissions, DiscordPermissionBitField.MANAGE_GUILD) || 
         hasPermission(userPermissions, DiscordPermissionBitField.ADMINISTRATOR);
}

// ==================================================
// ROLE HIERARCHY VALIDATION
// ==================================================
export interface RoleLike {
  id: string;
  position: number;
}

export interface MemberLike {
  id: string;
  roles: RoleLike[];
}

export function getHighestRolePosition(member: MemberLike): number {
  if (!member.roles || member.roles.length === 0) return 0;
  return Math.max(...member.roles.map(r => r.position || 0));
}

export function canModerateMember(
  moderator: MemberLike, 
  target: MemberLike, 
  guildOwnerId: string
): { canModerate: boolean; reason?: string } {
  // Guild owner can moderate anyone except themselves
  if (target.id === guildOwnerId) {
    return { canModerate: false, reason: 'Cannot moderate the server owner.' };
  }

  if (moderator.id === target.id) {
    return { canModerate: false, reason: 'Cannot moderate yourself.' };
  }

  if (moderator.id === guildOwnerId) {
    return { canModerate: true };
  }

  const modHighest = getHighestRolePosition(moderator);
  const targetHighest = getHighestRolePosition(target);

  if (modHighest <= targetHighest) {
    return { 
      canModerate: false, 
      reason: 'Role hierarchy violation: Your highest role must be higher than the target member\'s role.' 
    };
  }

  return { canModerate: true };
}

// ==================================================
// SLIDING WINDOW IN-MEMORY RATE LIMITER
// ==================================================
export class SlidingWindowRateLimiter {
  private windows: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  public isRateLimited(key: string): { limited: boolean; currentCount: number; retryAfterMs: number } {
    const now = Date.now();
    const timestamps = this.windows.get(key) || [];
    
    // Filter out expired timestamps
    const activeTimestamps = timestamps.filter(t => now - t < this.windowMs);

    if (activeTimestamps.length >= this.maxRequests) {
      const oldestActive = activeTimestamps[0];
      const retryAfterMs = Math.max(0, this.windowMs - (now - oldestActive));
      return { limited: true, currentCount: activeTimestamps.length, retryAfterMs };
    }

    activeTimestamps.push(now);
    this.windows.set(key, activeTimestamps);

    return { limited: false, currentCount: activeTimestamps.length, retryAfterMs: 0 };
  }

  public reset(key: string): void {
    this.windows.delete(key);
  }

  public cleanup(): void {
    const now = Date.now();
    for (const [key, timestamps] of this.windows.entries()) {
      const active = timestamps.filter(t => now - t < this.windowMs);
      if (active.length === 0) {
        this.windows.delete(key);
      } else {
        this.windows.set(key, active);
      }
    }
  }
}

// ==================================================
// DANGEROUS PERMISSIONS DETECTOR
// ==================================================
export const DANGEROUS_PERMISSIONS = [
  { name: 'ADMINISTRATOR', bit: DiscordPermissionBitField.ADMINISTRATOR, weight: 100 },
  { name: 'MANAGE_GUILD', bit: DiscordPermissionBitField.MANAGE_GUILD, weight: 80 },
  { name: 'MANAGE_ROLES', bit: DiscordPermissionBitField.MANAGE_ROLES, weight: 70 },
  { name: 'MANAGE_CHANNELS', bit: DiscordPermissionBitField.MANAGE_CHANNELS, weight: 60 },
  { name: 'BAN_MEMBERS', bit: DiscordPermissionBitField.BAN_MEMBERS, weight: 50 },
  { name: 'KICK_MEMBERS', bit: DiscordPermissionBitField.KICK_MEMBERS, weight: 40 }
];

export function detectDangerousPermissions(permissions: string | bigint | number): string[] {
  const dangerousFound: string[] = [];
  for (const perm of DANGEROUS_PERMISSIONS) {
    if (hasPermission(permissions, perm.bit)) {
      dangerousFound.push(perm.name);
    }
  }
  return dangerousFound;
}

// ==================================================
// JWT TOKEN MANAGEMENT
// ==================================================
export function signAuthToken(payload: object, secret: string, expiresIn = '7d'): string {
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyAuthToken<T = any>(token: string, secret: string): T | null {
  try {
    return jwt.verify(token, secret) as T;
  } catch {
    return null;
  }
}
