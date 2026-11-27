import { Client, Message, PermissionsBitField } from 'discord.js';
import { GuildModel, ModerationCaseModel } from '@nexus-guard/database';
import { ModerationActionType, SecurityIncidentSeverity } from '@nexus-guard/shared';
import { IncidentManager } from './IncidentManager.js';

interface UserMessageHistory {
  timestamps: number[];
  lastMessages: string[];
}

export class AntiSpamEngine {
  private static instance: AntiSpamEngine;
  // Map of GuildId -> (UserId -> UserMessageHistory)
  private userHistories: Map<string, Map<string, UserMessageHistory>> = new Map();
  // Map of GuildId -> (UserId -> WarningCount)
  private userWarnings: Map<string, Map<string, number>> = new Map();

  private constructor() {}

  public static getInstance(): AntiSpamEngine {
    if (!AntiSpamEngine.instance) {
      AntiSpamEngine.instance = new AntiSpamEngine();
    }
    return AntiSpamEngine.instance;
  }

  public async inspectMessage(client: Client, message: Message): Promise<boolean> {
    // Ignore bots and webhooks
    if (message.author.bot || message.webhookId || !message.guild) {
      return false;
    }

    const guild = message.guild;
    const author = message.author;
    const now = Date.now();

    // Check if guild has anti-spam enabled
    const guildDoc = await GuildModel.findOne({ guildId: guild.id });
    if (!guildDoc || !guildDoc.antiSpam?.enabled) {
      return false;
    }

    const {
      maxMessagesPerInterval = 5,
      intervalSeconds = 5,
      maxDuplicates = 3,
      maxMentions = 5,
      blockInvites = true,
      blockSuspiciousLinks = true,
      warnThreshold = 2,
      timeoutDurationSeconds = 300,
      ignoredChannelIds = [],
      ignoredRoleIds = []
    } = guildDoc.antiSpam;

    // Check bypasses
    if (ignoredChannelIds.includes(message.channel.id)) return false;
    const member = message.member;
    if (member) {
      if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return false;
      if (member.roles.cache.some(r => ignoredRoleIds.includes(r.id))) return false;
    }

    // 1. Discord Invite Filter
    if (blockInvites) {
      const inviteRegex = /(discord\.(gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/[a-zA-Z0-9]+/i;
      if (inviteRegex.test(message.content)) {
        await message.delete().catch(() => null);
        await this.handleViolation(client, message, 'Unsolicited Discord Server Invite');
        return true;
      }
    }

    // 2. Mention Spam Filter
    const mentionCount = message.mentions.users.size + message.mentions.roles.size + (message.mentions.everyone ? 10 : 0);
    if (mentionCount > maxMentions) {
      await message.delete().catch(() => null);
      await this.handleViolation(client, message, `Mention Spam (${mentionCount} mentions in single message)`);
      return true;
    }

    // 3. Suspicious / Phishing Links Filter
    if (blockSuspiciousLinks) {
      const suspiciousLinkRegex = /(discorcl|dlscord|disord|steamcommunlty|nltro|gift-discord)\.[a-z]{2,}/i;
      if (suspiciousLinkRegex.test(message.content)) {
        await message.delete().catch(() => null);
        await this.handleViolation(client, message, 'Phishing / Malicious Domain Detected');
        return true;
      }
    }

    // 4. Message Flood & Duplicate Detection
    let guildMap = this.userHistories.get(guild.id);
    if (!guildMap) {
      guildMap = new Map();
      this.userHistories.set(guild.id, guildMap);
    }

    let history = guildMap.get(author.id);
    if (!history) {
      history = { timestamps: [], lastMessages: [] };
      guildMap.set(author.id, history);
    }

    // Record timestamp
    history.timestamps.push(now);
    history.lastMessages.push(message.content.trim().toLowerCase());

    // Keep within window
    const cutoff = now - (intervalSeconds * 1000);
    history.timestamps = history.timestamps.filter(t => t >= cutoff);
    if (history.lastMessages.length > 10) {
      history.lastMessages = history.lastMessages.slice(-10);
    }

    // Check message flood
    if (history.timestamps.length > maxMessagesPerInterval) {
      await message.delete().catch(() => null);
      await this.handleViolation(client, message, `Message Flooding (${history.timestamps.length} messages in ${intervalSeconds}s)`);
      return true;
    }

    // Check identical duplicate messages
    const duplicateCount = history.lastMessages.filter(m => m.length > 3 && m === message.content.trim().toLowerCase()).length;
    if (duplicateCount >= maxDuplicates) {
      await message.delete().catch(() => null);
      await this.handleViolation(client, message, `Repeated Message Spam (${duplicateCount} identical messages)`);
      return true;
    }

    return false;
  }

  private async handleViolation(client: Client, message: Message, reason: string): Promise<void> {
    const guild = message.guild!;
    const author = message.author;
    const member = message.member;

    let guildWarnings = this.userWarnings.get(guild.id);
    if (!guildWarnings) {
      guildWarnings = new Map();
      this.userWarnings.set(guild.id, guildWarnings);
    }

    const currentWarns = (guildWarnings.get(author.id) || 0) + 1;
    guildWarnings.set(author.id, currentWarns);

    const guildDoc = await GuildModel.findOne({ guildId: guild.id });
    const warnThreshold = guildDoc?.antiSpam?.warnThreshold || 2;
    const timeoutDurationSeconds = guildDoc?.antiSpam?.timeoutDurationSeconds || 300;

    if (currentWarns < warnThreshold) {
      // Send warning message
      const warnMsg = await message.channel.send({
        content: `⚠️ <@${author.id}>, **Anti-Spam Warning**: ${reason}. Repeated violations will result in automatic timeout.`
      }).catch(() => null);

      if (warnMsg) {
        setTimeout(() => warnMsg.delete().catch(() => null), 6000);
      }
    } else {
      // Threshold reached -> Apply Timeout
      if (member && member.moderatable) {
        await member.timeout(timeoutDurationSeconds * 1000, `NEXUS GUARD Anti-Spam: ${reason}`).catch(() => null);
      }

      await message.channel.send({
        content: `🔇 <@${author.id}> has been timed out for ${Math.round(timeoutDurationSeconds / 60)} minutes due to continuous spam violations (${reason}).`
      }).catch(() => null);

      // Record Moderation Case
      const caseCount = await ModerationCaseModel.countDocuments({ guildId: guild.id });
      await ModerationCaseModel.create({
        caseNumber: caseCount + 1,
        guildId: guild.id,
        action: ModerationActionType.TIMEOUT,
        targetId: author.id,
        targetTag: author.tag,
        moderatorId: client.user!.id,
        moderatorTag: client.user!.tag,
        reason: `AutoMod Anti-Spam: ${reason}`,
        durationSeconds: timeoutDurationSeconds
      });

      // Report incident if critical spam burst
      if (currentWarns >= 4) {
        await IncidentManager.getInstance().reportIncident(client, {
          guild,
          type: 'SPAM_BURST',
          severity: SecurityIncidentSeverity.MEDIUM,
          title: 'Persistent Spam Burst Quarantined',
          description: `User <@${author.id}> triggered progressive anti-spam enforcement with ${currentWarns} infractions.`,
          evidence: {
            reason,
            infractionCount: currentWarns,
            timeoutDurationSeconds
          },
          recommendedAction: 'Monitor member activity once timeout expires.',
          offender: author,
          mitigationTaken: `Timed out for ${timeoutDurationSeconds}s.`
        });
      }

      // Reset user warning counter after penalty
      guildWarnings.set(author.id, 0);
    }
  }
}
