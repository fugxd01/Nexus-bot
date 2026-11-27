import { 
  Guild, 
  ChannelType, 
  Role, 
  TextChannel, 
  VoiceChannel, 
  CategoryChannel,
  User 
} from 'discord.js';
import { BackupModel, IBackupRole, IBackupChannel } from '@nexus-guard/database';

export class BackupService {
  private static instance: BackupService;

  private constructor() {}

  public static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  public async createBackup(guild: Guild, creator: User): Promise<any> {
    const backupId = `bkp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Snapshot Roles (excluding @everyone which cannot be created)
    const roles: IBackupRole[] = [];
    for (const [_, role] of guild.roles.cache) {
      if (role.name === '@everyone') continue;
      roles.push({
        id: role.id,
        name: role.name,
        color: role.color,
        hoist: role.hoist,
        position: role.position,
        permissions: role.permissions.bitfield.toString(),
        mentionable: role.mentionable
      });
    }

    // Sort roles by position descending
    roles.sort((a, b) => b.position - a.position);

    // 2. Snapshot Channels and Categories
    const channels: IBackupChannel[] = [];
    for (const [_, channel] of guild.channels.cache) {
      if (!channel.isDMBased() && !channel.isThread()) {
        const overwrites: Array<{ id: string; type: number; allow: string; deny: string }> = [];

        if ('permissionOverwrites' in channel && channel.permissionOverwrites) {
          for (const [_, ow] of channel.permissionOverwrites.cache) {
            overwrites.push({
              id: ow.id,
              type: ow.type,
              allow: ow.allow.bitfield.toString(),
              deny: ow.deny.bitfield.toString()
            });
          }
        }

        channels.push({
          id: channel.id,
          name: channel.name,
          type: channel.type,
          position: channel.position,
          parentId: channel.parentId,
          topic: 'topic' in channel ? (channel.topic || null) : null,
          nsfw: 'nsfw' in channel ? (channel.nsfw || false) : false,
          rateLimitPerUser: 'rateLimitPerUser' in channel ? (channel.rateLimitPerUser || 0) : 0,
          permissionOverwrites: overwrites
        });
      }
    }

    // 3. Save to MongoDB
    const snapshot = await BackupModel.create({
      backupId,
      guildId: guild.id,
      guildName: guild.name,
      creatorId: creator.id,
      creatorTag: creator.tag,
      roles,
      channels,
      serverFeatures: Array.from(guild.features),
      sizeBytes: JSON.stringify({ roles, channels }).length
    });

    return snapshot;
  }

  public validateBackup(backup: any): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    if (!backup.roles || !Array.isArray(backup.roles)) {
      issues.push('Missing or invalid roles collection.');
    }
    if (!backup.channels || !Array.isArray(backup.channels)) {
      issues.push('Missing or invalid channels collection.');
    }
    return {
      isValid: issues.length === 0,
      issues
    };
  }
}
