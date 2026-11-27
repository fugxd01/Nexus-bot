import { Client, EmbedBuilder, Guild, TextChannel, User } from 'discord.js';
import { 
  SecurityIncidentModel, 
  GuildModel, 
  SecurityAuditLogModel 
} from '@nexus-guard/database';
import { 
  SecurityIncidentSeverity, 
  SecurityIncidentStatus 
} from '@nexus-guard/shared';

export interface ReportIncidentOptions {
  guild: Guild;
  type: 'RAID_DETECTED' | 'NUKE_ATTEMPT' | 'SPAM_BURST' | 'UNAUTHORIZED_BOT' | 'PERMISSION_HIJACK' | 'EMERGENCY_LOCKDOWN';
  severity: SecurityIncidentSeverity;
  title: string;
  description: string;
  evidence: Record<string, any>;
  recommendedAction: string;
  offender?: User | { id: string; tag: string };
  mitigationTaken?: string;
}

export class IncidentManager {
  private static instance: IncidentManager;

  private constructor() {}

  public static getInstance(): IncidentManager {
    if (!IncidentManager.instance) {
      IncidentManager.instance = new IncidentManager();
    }
    return IncidentManager.instance;
  }

  public async reportIncident(client: Client, options: ReportIncidentOptions) {
    const { 
      guild, 
      type, 
      severity, 
      title, 
      description, 
      evidence, 
      recommendedAction, 
      offender, 
      mitigationTaken 
    } = options;

    try {
      // 1. Save to Database
      const incident = await SecurityIncidentModel.create({
        guildId: guild.id,
        type,
        severity,
        status: SecurityIncidentStatus.ACTIVE,
        offenderId: offender?.id,
        offenderTag: offender ? (offender as any).tag || (offender as any).username : undefined,
        title,
        description,
        evidence,
        recommendedAction,
        mitigationTaken,
        createdAt: new Date()
      });

      // 2. Fetch Guild Settings for Alert Channel
      const guildDoc = await GuildModel.findOne({ guildId: guild.id });
      const alertChannelId = guildDoc?.securityAlertChannelId || 
                             guildDoc?.antiRaid?.alertChannelId || 
                             guildDoc?.antiNuke?.alertChannelId;

      const severityColors: Record<SecurityIncidentSeverity, number> = {
        [SecurityIncidentSeverity.LOW]: 0x3b82f6,      // Blue
        [SecurityIncidentSeverity.MEDIUM]: 0xeab308,   // Yellow
        [SecurityIncidentSeverity.HIGH]: 0xf97316,     // Orange
        [SecurityIncidentSeverity.CRITICAL]: 0xef4444  // Red
      };

      const embed = new EmbedBuilder()
        .setTitle(`🛡️ SECURITY ALERT: ${title}`)
        .setDescription(description)
        .setColor(severityColors[severity] || 0xef4444)
        .addFields(
          { name: 'Incident ID', value: `\`${incident._id.toString()}\``, inline: true },
          { name: 'Severity', value: `\`${severity}\``, inline: true },
          { name: 'Type', value: `\`${type}\``, inline: true },
          { name: 'Offender', value: offender ? `<@${offender.id}> (${offender.id})` : 'Unknown / Multiple', inline: true },
          { name: 'Mitigation Taken', value: mitigationTaken || 'None (Human verification required)', inline: false },
          { name: 'Recommended Action', value: recommendedAction, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: 'NEXUS GUARD Security Engine', iconURL: client.user?.displayAvatarURL() });

      // 3. Post to Alert Channel if configured
      if (alertChannelId) {
        const channel = guild.channels.cache.get(alertChannelId) as TextChannel;
        if (channel && channel.isTextBased()) {
          await channel.send({ embeds: [embed] }).catch(() => null);
        }
      }

      // 4. Alert Server Owner if Critical or High
      if (severity === SecurityIncidentSeverity.CRITICAL || severity === SecurityIncidentSeverity.HIGH) {
        const owner = await guild.fetchOwner().catch(() => null);
        if (owner) {
          const ownerEmbed = new EmbedBuilder()
            .setTitle(`🚨 CRITICAL THREAT DETECTED IN ${guild.name}`)
            .setDescription(`A severe security incident has been detected in your server. Immediate review is advised.\n\n**${title}**\n${description}`)
            .setColor(0xef4444)
            .addFields(
              { name: 'Action Taken', value: mitigationTaken || 'Pending review' },
              { name: 'Dashboard Access', value: `Review this incident in the Nexus Guard Security Center.` }
            )
            .setTimestamp();

          await owner.send({ embeds: [ownerEmbed] }).catch(() => null);
        }
      }

      // 5. Write to Security Audit Log
      await SecurityAuditLogModel.create({
        guildId: guild.id,
        executorId: client.user?.id || 'SYSTEM',
        executorTag: client.user?.tag || 'NEXUS-GUARD-SYSTEM',
        action: `SECURITY_INCIDENT_${type}`,
        targetId: offender?.id,
        targetType: 'USER',
        details: {
          incidentId: incident._id.toString(),
          severity,
          title,
          mitigationTaken
        }
      });

      return incident;
    } catch (err) {
      console.error('[INCIDENT MANAGER] Error logging security incident:', err);
      return null;
    }
  }
}
