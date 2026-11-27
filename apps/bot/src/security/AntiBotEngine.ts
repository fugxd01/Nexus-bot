import { Client, GuildMember, AuditLogEvent, GuildAuditLogsEntry } from 'discord.js';
import { GuildModel } from '@nexus-guard/database';
import { SecurityIncidentSeverity } from '@nexus-guard/shared';
import { IncidentManager } from './IncidentManager.js';

export class AntiBotEngine {
  private static instance: AntiBotEngine;

  private constructor() {}

  public static getInstance(): AntiBotEngine {
    if (!AntiBotEngine.instance) {
      AntiBotEngine.instance = new AntiBotEngine();
    }
    return AntiBotEngine.instance;
  }

  public async handleBotJoin(client: Client, member: GuildMember): Promise<void> {
    if (!member.user.bot) return;

    const guild = member.guild;
    const guildDoc = await GuildModel.findOne({ guildId: guild.id });
    if (!guildDoc || !guildDoc.antiBot?.enabled) return;

    const {
      requireAdminApproval = true,
      kickUnauthorizedBots = true,
      logBotAdditions = true
    } = guildDoc.antiBot;

    // Fetch audit log to identify who added the bot
    let adderUser = null;
    try {
      const logs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.BotAdd }).catch(() => null);
      if (logs) {
        const entry = logs.entries.first() as GuildAuditLogsEntry | undefined;
        if (entry && entry.target?.id === member.id && entry.executor) {
          adderUser = entry.executor;
        }
      }
    } catch (e) {
      console.warn('[ANTI-BOT] Could not fetch bot add audit log:', e);
    }

    // If adder is the server owner, always permit
    if (adderUser && adderUser.id === guild.ownerId) {
      console.log(`[ANTI-BOT] Bot ${member.user.tag} authorized: Added by server owner.`);
      return;
    }

    // If unauthorized bot additions are blocked
    if (requireAdminApproval && kickUnauthorizedBots) {
      let mitigation = 'No kick applied.';
      if (member.kickable) {
        await member.kick('NEXUS GUARD Anti-Bot: Unauthorized bot addition prohibited without admin approval').catch(() => null);
        mitigation = `Automatically kicked unauthorized bot ${member.user.tag}.`;
      }

      await IncidentManager.getInstance().reportIncident(client, {
        guild,
        type: 'UNAUTHORIZED_BOT',
        severity: SecurityIncidentSeverity.HIGH,
        title: 'Unauthorized Bot Joined Server',
        description: `Bot <@${member.id}> (${member.user.tag}) was invited into the server ${adderUser ? `by <@${adderUser.id}>` : 'by an unconfirmed administrator'}.`,
        evidence: {
          botId: member.id,
          botTag: member.user.tag,
          addedById: adderUser?.id,
          addedByTag: adderUser?.tag
        },
        recommendedAction: 'Verify why the bot was invited and check if the inviter\'s account was compromised.',
        offender: adderUser || undefined,
        mitigationTaken: mitigation
      });
    } else if (logBotAdditions) {
      // Just log notification
      await IncidentManager.getInstance().reportIncident(client, {
        guild,
        type: 'UNAUTHORIZED_BOT',
        severity: SecurityIncidentSeverity.LOW,
        title: 'New Bot Joined Server',
        description: `Bot ${member.user.tag} joined the server. Added by: ${adderUser ? adderUser.tag : 'Unknown'}.`,
        evidence: { botId: member.id, botTag: member.user.tag, addedById: adderUser?.id },
        recommendedAction: 'Verify bot permissions and bot intent.',
        mitigationTaken: 'Monitored.'
      });
    }
  }
}
