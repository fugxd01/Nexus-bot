import mongoose, { Schema, Document } from 'mongoose';

export interface IGuild extends Document {
  guildId: string;
  guildName: string;
  ownerId: string;
  icon?: string;
  prefix: string;
  logChannelId?: string;
  modLogChannelId?: string;
  securityAlertChannelId?: string;
  antiRaid: {
    enabled: boolean;
    maxJoinsPerInterval: number;
    intervalSeconds: number;
    minAccountAgeDays: number;
    actionOnTrigger: 'ALERT_ONLY' | 'KICK_NEW' | 'BAN_NEW' | 'LOCKDOWN';
    alertChannelId?: string;
    autoLockdownDurationMinutes: number;
    notifyOwner: boolean;
  };
  antiNuke: {
    enabled: boolean;
    maxChannelDeletions: number;
    maxChannelCreations: number;
    maxRoleDeletions: number;
    maxRoleCreations: number;
    maxBans: number;
    maxKicks: number;
    timeWindowSeconds: number;
    quarantineOffenderRoles: boolean;
    stripAdminOnTrigger: boolean;
    alertChannelId?: string;
    whitelistedUserIds: string[];
    whitelistedRoleIds: string[];
  };
  antiSpam: {
    enabled: boolean;
    maxMessagesPerInterval: number;
    intervalSeconds: number;
    maxDuplicates: number;
    maxMentions: number;
    blockInvites: boolean;
    blockSuspiciousLinks: boolean;
    warnThreshold: number;
    timeoutDurationSeconds: number;
    ignoredChannelIds: string[];
    ignoredRoleIds: string[];
  };
  antiBot: {
    enabled: boolean;
    requireAdminApproval: boolean;
    kickUnauthorizedBots: boolean;
    logBotAdditions: boolean;
    alertChannelId?: string;
  };
  lockdown: {
    isLockedDown: boolean;
    lockedAt?: Date;
    lockedBy?: string;
    lockdownReason?: string;
    restrictedChannels: string[];
    isolateNewMembers: boolean;
  };
  welcome: {
    enabled: boolean;
    channelId?: string;
    welcomeMessage: string;
    goodbyeMessage: string;
    useEmbed: boolean;
    autoRoleId?: string;
    verificationRequired: boolean;
    verifiedRoleId?: string;
  };
  ticket: {
    enabled: boolean;
    categoryId?: string;
    supportRoleId?: string;
    transcriptChannelId?: string;
    maxOpenTicketsPerUser: number;
  };
  updatedAt: Date;
  createdAt: Date;
}

const GuildSchema = new Schema<IGuild>({
  guildId: { type: String, required: true, unique: true, index: true },
  guildName: { type: String, required: true },
  ownerId: { type: String, required: true, index: true },
  icon: { type: String },
  prefix: { type: String, default: '!' },
  logChannelId: { type: String },
  modLogChannelId: { type: String },
  securityAlertChannelId: { type: String },
  antiRaid: {
    enabled: { type: Boolean, default: true },
    maxJoinsPerInterval: { type: Number, default: 5 },
    intervalSeconds: { type: Number, default: 10 },
    minAccountAgeDays: { type: Number, default: 3 },
    actionOnTrigger: { type: String, default: 'KICK_NEW' },
    alertChannelId: { type: String },
    autoLockdownDurationMinutes: { type: Number, default: 30 },
    notifyOwner: { type: Boolean, default: true }
  },
  antiNuke: {
    enabled: { type: Boolean, default: true },
    maxChannelDeletions: { type: Number, default: 3 },
    maxChannelCreations: { type: Number, default: 5 },
    maxRoleDeletions: { type: Number, default: 3 },
    maxRoleCreations: { type: Number, default: 5 },
    maxBans: { type: Number, default: 3 },
    maxKicks: { type: Number, default: 3 },
    timeWindowSeconds: { type: Number, default: 10 },
    quarantineOffenderRoles: { type: Boolean, default: true },
    stripAdminOnTrigger: { type: Boolean, default: true },
    alertChannelId: { type: String },
    whitelistedUserIds: { type: [String], default: [] },
    whitelistedRoleIds: { type: [String], default: [] }
  },
  antiSpam: {
    enabled: { type: Boolean, default: true },
    maxMessagesPerInterval: { type: Number, default: 5 },
    intervalSeconds: { type: Number, default: 5 },
    maxDuplicates: { type: Number, default: 3 },
    maxMentions: { type: Number, default: 5 },
    blockInvites: { type: Boolean, default: true },
    blockSuspiciousLinks: { type: Boolean, default: true },
    warnThreshold: { type: Number, default: 2 },
    timeoutDurationSeconds: { type: Number, default: 300 },
    ignoredChannelIds: { type: [String], default: [] },
    ignoredRoleIds: { type: [String], default: [] }
  },
  antiBot: {
    enabled: { type: Boolean, default: true },
    requireAdminApproval: { type: Boolean, default: true },
    kickUnauthorizedBots: { type: Boolean, default: true },
    logBotAdditions: { type: Boolean, default: true },
    alertChannelId: { type: String }
  },
  lockdown: {
    isLockedDown: { type: Boolean, default: false },
    lockedAt: { type: Date },
    lockedBy: { type: String },
    lockdownReason: { type: String },
    restrictedChannels: { type: [String], default: [] },
    isolateNewMembers: { type: Boolean, default: true }
  },
  welcome: {
    enabled: { type: Boolean, default: false },
    channelId: { type: String },
    welcomeMessage: { type: String, default: 'Welcome {user} to {server}!' },
    goodbyeMessage: { type: String, default: '{user} has left the server.' },
    useEmbed: { type: Boolean, default: true },
    autoRoleId: { type: String },
    verificationRequired: { type: Boolean, default: false },
    verifiedRoleId: { type: String }
  },
  ticket: {
    enabled: { type: Boolean, default: false },
    categoryId: { type: String },
    supportRoleId: { type: String },
    transcriptChannelId: { type: String },
    maxOpenTicketsPerUser: { type: Number, default: 2 }
  }
}, {
  timestamps: true
});

export const GuildModel = mongoose.models.Guild || mongoose.model<IGuild>('Guild', GuildSchema);
