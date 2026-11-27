import { z } from 'zod';

// ==================================================
// ROLES & PERMISSIONS
// ==================================================
export const DiscordPermissionBitField = {
  ADMINISTRATOR: 1n << 3n,
  MANAGE_GUILD: 1n << 5n,
  BAN_MEMBERS: 1n << 2n,
  KICK_MEMBERS: 1n << 1n,
  MANAGE_CHANNELS: 1n << 4n,
  MANAGE_ROLES: 1n << 28n,
  MANAGE_MESSAGES: 1n << 13n,
  MODERATE_MEMBERS: 1n << 40n,
  VIEW_AUDIT_LOG: 1n << 7n
} as const;

export enum SecurityIncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum SecurityIncidentStatus {
  ACTIVE = 'ACTIVE',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED'
}

export enum ModerationActionType {
  WARN = 'WARN',
  TIMEOUT = 'TIMEOUT',
  REMOVE_TIMEOUT = 'REMOVE_TIMEOUT',
  KICK = 'KICK',
  BAN = 'BAN',
  UNBAN = 'UNBAN',
  SOFTBAN = 'SOFTBAN',
  NICKNAME_CHANGE = 'NICKNAME_CHANGE',
  ROLE_ASSIGN = 'ROLE_ASSIGN',
  ROLE_REMOVE = 'ROLE_REMOVE',
  PURGE_MESSAGES = 'PURGE_MESSAGES',
  LOCKDOWN = 'LOCKDOWN'
}

export enum TicketStatus {
  OPEN = 'OPEN',
  CLAIMED = 'CLAIMED',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED'
}

// ==================================================
// ZOD SCHEMAS & DTOs
// ==================================================

export const AntiRaidConfigSchema = z.object({
  enabled: z.boolean().default(true),
  maxJoinsPerInterval: z.number().int().min(2).max(100).default(5),
  intervalSeconds: z.number().int().min(5).max(300).default(10),
  minAccountAgeDays: z.number().int().min(0).max(365).default(3),
  actionOnTrigger: z.enum(['ALERT_ONLY', 'KICK_NEW', 'BAN_NEW', 'LOCKDOWN']).default('KICK_NEW'),
  alertChannelId: z.string().optional().nullable(),
  autoLockdownDurationMinutes: z.number().int().min(1).max(1440).default(30),
  notifyOwner: z.boolean().default(true)
});

export const AntiNukeConfigSchema = z.object({
  enabled: z.boolean().default(true),
  maxChannelDeletions: z.number().int().min(1).max(20).default(3),
  maxChannelCreations: z.number().int().min(1).max(20).default(5),
  maxRoleDeletions: z.number().int().min(1).max(20).default(3),
  maxRoleCreations: z.number().int().min(1).max(20).default(5),
  maxBans: z.number().int().min(1).max(20).default(3),
  maxKicks: z.number().int().min(1).max(20).default(3),
  timeWindowSeconds: z.number().int().min(5).max(60).default(10),
  quarantineOffenderRoles: z.boolean().default(true),
  stripAdminOnTrigger: z.boolean().default(true),
  alertChannelId: z.string().optional().nullable(),
  whitelistedUserIds: z.array(z.string()).default([]),
  whitelistedRoleIds: z.array(z.string()).default([])
});

export const AntiSpamConfigSchema = z.object({
  enabled: z.boolean().default(true),
  maxMessagesPerInterval: z.number().int().min(2).max(20).default(5),
  intervalSeconds: z.number().int().min(1).max(30).default(5),
  maxDuplicates: z.number().int().min(2).max(10).default(3),
  maxMentions: z.number().int().min(1).max(20).default(5),
  blockInvites: z.boolean().default(true),
  blockSuspiciousLinks: z.boolean().default(true),
  warnThreshold: z.number().int().min(1).max(5).default(2),
  timeoutDurationSeconds: z.number().int().min(60).max(604800).default(300),
  ignoredChannelIds: z.array(z.string()).default([]),
  ignoredRoleIds: z.array(z.string()).default([])
});

export const AntiBotConfigSchema = z.object({
  enabled: z.boolean().default(true),
  requireAdminApproval: z.boolean().default(true),
  kickUnauthorizedBots: z.boolean().default(true),
  logBotAdditions: z.boolean().default(true),
  alertChannelId: z.string().optional().nullable()
});

export const EmergencyLockdownConfigSchema = z.object({
  isLockedDown: z.boolean().default(false),
  lockedAt: z.date().optional().nullable(),
  lockedBy: z.string().optional().nullable(),
  lockdownReason: z.string().optional().nullable(),
  restrictedChannels: z.array(z.string()).default([]),
  isolateNewMembers: z.boolean().default(true)
});

export const GuildSettingsSchema = z.object({
  guildId: z.string(),
  guildName: z.string(),
  ownerId: z.string(),
  icon: z.string().optional().nullable(),
  prefix: z.string().default('!'),
  logChannelId: z.string().optional().nullable(),
  modLogChannelId: z.string().optional().nullable(),
  securityAlertChannelId: z.string().optional().nullable(),
  antiRaid: AntiRaidConfigSchema.default({}),
  antiNuke: AntiNukeConfigSchema.default({}),
  antiSpam: AntiSpamConfigSchema.default({}),
  antiBot: AntiBotConfigSchema.default({}),
  lockdown: EmergencyLockdownConfigSchema.default({}),
  welcome: z.object({
    enabled: z.boolean().default(false),
    channelId: z.string().optional().nullable(),
    welcomeMessage: z.string().default('Welcome {user} to {server}!'),
    goodbyeMessage: z.string().default('{user} has left the server.'),
    useEmbed: z.boolean().default(true),
    autoRoleId: z.string().optional().nullable(),
    verificationRequired: z.boolean().default(false),
    verifiedRoleId: z.string().optional().nullable()
  }).default({}),
  ticket: z.object({
    enabled: z.boolean().default(false),
    categoryId: z.string().optional().nullable(),
    supportRoleId: z.string().optional().nullable(),
    transcriptChannelId: z.string().optional().nullable(),
    maxOpenTicketsPerUser: z.number().int().min(1).max(10).default(2)
  }).default({})
});

export type AntiRaidConfig = z.infer<typeof AntiRaidConfigSchema>;
export type AntiNukeConfig = z.infer<typeof AntiNukeConfigSchema>;
export type AntiSpamConfig = z.infer<typeof AntiSpamConfigSchema>;
export type AntiBotConfig = z.infer<typeof AntiBotConfigSchema>;
export type EmergencyLockdownConfig = z.infer<typeof EmergencyLockdownConfigSchema>;
export type GuildSettings = z.infer<typeof GuildSettingsSchema>;

// Incident Schema
export const SecurityIncidentSchema = z.object({
  id: z.string().optional(),
  guildId: z.string(),
  type: z.enum(['RAID_DETECTED', 'NUKE_ATTEMPT', 'SPAM_BURST', 'UNAUTHORIZED_BOT', 'PERMISSION_HIJACK', 'EMERGENCY_LOCKDOWN']),
  severity: z.nativeEnum(SecurityIncidentSeverity),
  status: z.nativeEnum(SecurityIncidentStatus).default(SecurityIncidentStatus.ACTIVE),
  offenderId: z.string().optional().nullable(),
  offenderTag: z.string().optional().nullable(),
  title: z.string(),
  description: z.string(),
  evidence: z.record(z.any()).default({}),
  recommendedAction: z.string(),
  mitigationTaken: z.string().optional().nullable(),
  createdAt: z.date().default(() => new Date()),
  resolvedAt: z.date().optional().nullable(),
  resolvedBy: z.string().optional().nullable()
});

export type SecurityIncident = z.infer<typeof SecurityIncidentSchema>;

// Moderation Case Schema
export const ModerationCaseSchema = z.object({
  caseNumber: z.number().int(),
  guildId: z.string(),
  action: z.nativeEnum(ModerationActionType),
  targetId: z.string(),
  targetTag: z.string(),
  moderatorId: z.string(),
  moderatorTag: z.string(),
  reason: z.string().default('No reason provided'),
  durationSeconds: z.number().optional().nullable(),
  createdAt: z.date().default(() => new Date())
});

export type ModerationCase = z.infer<typeof ModerationCaseSchema>;

// Backup Schema
export const ServerBackupSchema = z.object({
  backupId: z.string(),
  guildId: z.string(),
  guildName: z.string(),
  creatorId: z.string(),
  createdAt: z.date().default(() => new Date()),
  roles: z.array(z.object({
    id: z.string(),
    name: z.string(),
    color: z.number(),
    hoist: z.boolean(),
    position: z.number(),
    permissions: z.string(),
    mentionable: z.boolean()
  })),
  channels: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.number(),
    position: z.number(),
    parentId: z.string().optional().nullable(),
    topic: z.string().optional().nullable(),
    nsfw: z.boolean().default(false),
    rateLimitPerUser: z.number().default(0),
    permissionOverwrites: z.array(z.object({
      id: z.string(),
      type: z.number(),
      allow: z.string(),
      deny: z.string()
    }))
  })),
  serverFeatures: z.array(z.string()).default([])
});

export type ServerBackup = z.infer<typeof ServerBackupSchema>;
