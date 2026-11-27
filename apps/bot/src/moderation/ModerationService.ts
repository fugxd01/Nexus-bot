import { Guild, GuildMember, User, EmbedBuilder, PermissionsBitField } from 'discord.js';
import { ModerationCaseModel } from '@nexus-guard/database';
import { ModerationActionType } from '@nexus-guard/shared';
import { canModerateMember } from '@nexus-guard/security';

export class ModerationService {
  private static instance: ModerationService;

  private constructor() {}

  public static getInstance(): ModerationService {
    if (!ModerationService.instance) {
      ModerationService.instance = new ModerationService();
    }
    return ModerationService.instance;
  }

  public async banMember(
    guild: Guild,
    target: GuildMember | User,
    moderator: GuildMember,
    reason: string,
    deleteMessageSeconds = 0
  ) {
    if (target instanceof GuildMember) {
      const hierarchy = canModerateMember(moderator, target, guild.ownerId);
      if (!hierarchy.canModerate) {
        throw new Error(hierarchy.reason || 'Role hierarchy violation');
      }
      if (!target.bannable) {
        throw new Error('Bot lacks permission to ban this member.');
      }
    }

    await guild.bans.create(target.id, {
      reason: `[NEXUS GUARD] By ${moderator.user.tag}: ${reason}`,
      deleteMessageSeconds
    });

    const caseCount = await ModerationCaseModel.countDocuments({ guildId: guild.id });
    return await ModerationCaseModel.create({
      caseNumber: caseCount + 1,
      guildId: guild.id,
      action: ModerationActionType.BAN,
      targetId: target.id,
      targetTag: target instanceof GuildMember ? target.user.tag : target.tag,
      moderatorId: moderator.id,
      moderatorTag: moderator.user.tag,
      reason
    });
  }

  public async unbanMember(guild: Guild, userId: string, moderator: GuildMember, reason: string) {
    await guild.bans.remove(userId, `[NEXUS GUARD] By ${moderator.user.tag}: ${reason}`);

    const caseCount = await ModerationCaseModel.countDocuments({ guildId: guild.id });
    return await ModerationCaseModel.create({
      caseNumber: caseCount + 1,
      guildId: guild.id,
      action: ModerationActionType.UNBAN,
      targetId: userId,
      targetTag: userId,
      moderatorId: moderator.id,
      moderatorTag: moderator.user.tag,
      reason
    });
  }

  public async kickMember(guild: Guild, target: GuildMember, moderator: GuildMember, reason: string) {
    const hierarchy = canModerateMember(moderator, target, guild.ownerId);
    if (!hierarchy.canModerate) {
      throw new Error(hierarchy.reason || 'Role hierarchy violation');
    }
    if (!target.kickable) {
      throw new Error('Bot lacks permission to kick this member.');
    }

    await target.kick(`[NEXUS GUARD] By ${moderator.user.tag}: ${reason}`);

    const caseCount = await ModerationCaseModel.countDocuments({ guildId: guild.id });
    return await ModerationCaseModel.create({
      caseNumber: caseCount + 1,
      guildId: guild.id,
      action: ModerationActionType.KICK,
      targetId: target.id,
      targetTag: target.user.tag,
      moderatorId: moderator.id,
      moderatorTag: moderator.user.tag,
      reason
    });
  }

  public async timeoutMember(
    guild: Guild, 
    target: GuildMember, 
    moderator: GuildMember, 
    durationSeconds: number, 
    reason: string
  ) {
    const hierarchy = canModerateMember(moderator, target, guild.ownerId);
    if (!hierarchy.canModerate) {
      throw new Error(hierarchy.reason || 'Role hierarchy violation');
    }
    if (!target.moderatable) {
      throw new Error('Bot lacks permission to timeout this member.');
    }

    await target.timeout(durationSeconds * 1000, `[NEXUS GUARD] By ${moderator.user.tag}: ${reason}`);

    const caseCount = await ModerationCaseModel.countDocuments({ guildId: guild.id });
    return await ModerationCaseModel.create({
      caseNumber: caseCount + 1,
      guildId: guild.id,
      action: ModerationActionType.TIMEOUT,
      targetId: target.id,
      targetTag: target.user.tag,
      moderatorId: moderator.id,
      moderatorTag: moderator.user.tag,
      durationSeconds,
      reason
    });
  }

  public async removeTimeout(guild: Guild, target: GuildMember, moderator: GuildMember, reason: string) {
    if (!target.moderatable) {
      throw new Error('Bot lacks permission to remove timeout from this member.');
    }

    await target.timeout(null, `[NEXUS GUARD] By ${moderator.user.tag}: ${reason}`);

    const caseCount = await ModerationCaseModel.countDocuments({ guildId: guild.id });
    return await ModerationCaseModel.create({
      caseNumber: caseCount + 1,
      guildId: guild.id,
      action: ModerationActionType.REMOVE_TIMEOUT,
      targetId: target.id,
      targetTag: target.user.tag,
      moderatorId: moderator.id,
      moderatorTag: moderator.user.tag,
      reason
    });
  }

  public async warnMember(guild: Guild, target: GuildMember, moderator: GuildMember, reason: string) {
    const caseCount = await ModerationCaseModel.countDocuments({ guildId: guild.id });
    return await ModerationCaseModel.create({
      caseNumber: caseCount + 1,
      guildId: guild.id,
      action: ModerationActionType.WARN,
      targetId: target.id,
      targetTag: target.user.tag,
      moderatorId: moderator.id,
      moderatorTag: moderator.user.tag,
      reason
    });
  }

  public async getWarningHistory(guildId: string, userId: string) {
    return await ModerationCaseModel.find({
      guildId,
      targetId: userId,
      action: ModerationActionType.WARN
    }).sort({ createdAt: -1 });
  }

  public async clearWarnings(guildId: string, userId: string) {
    const res = await ModerationCaseModel.deleteMany({
      guildId,
      targetId: userId,
      action: ModerationActionType.WARN
    });
    return res.deletedCount;
  }
}
