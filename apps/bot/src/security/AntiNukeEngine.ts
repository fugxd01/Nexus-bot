import { 
  Client, 
  Guild, 
  AuditLogEvent, 
  GuildAuditLogsEntry, 
  PermissionsBitField,
  GuildMember
} from 'discord.js';
import { GuildModel } from '@nexus-guard/database';
import { SecurityIncidentSeverity } from '@nexus-guard/shared';
import { IncidentManager } from './IncidentManager.js';

interface ActionLogRecord {
  executorId: string;
  actionType: 'CHANNEL_DELETE' | 'CHANNEL_CREATE' | 'ROLE_DELETE' | 'ROLE_CREATE' | 'BAN' | 'KICK';
  timestamp: number;
}

export class AntiNukeEngine {
  private static instance: AntiNukeEngine;
  // Map of GuildId -> Array of ActionLogRecord
  private actionVelocity: Map<string, ActionLogRecord[]> = new Map();

  private constructor() {}

  public static getInstance(): AntiNukeEngine {
    if (!AntiNukeEngine.instance) {
      AntiNukeEngine.instance = new AntiNukeEngine();
    }
    return AntiNukeEngine.instance;
  }

  public async trackDestructiveAction(
    client: Client,
    guild: Guild,
    actionType: 'CHANNEL_DELETE' | 'CHANNEL_CREATE' | 'ROLE_DELETE' | 'ROLE_CREATE' | 'BAN' | 'KICK'
  ): Promise<void> {
    const guildDoc = await GuildModel.findOne({ guildId: guild.id });
    if (!guildDoc || !guildDoc.antiNuke?.enabled) {
      return;
    }

    const {
      maxChannelDeletions = 3,
      maxChannelCreations = 5,
      maxRoleDeletions = 3,
      maxRoleCreations = 5,
      maxBans = 3,
      maxKicks = 3,
      timeWindowSeconds = 10,
      quarantineOffenderRoles = true,
      stripAdminOnTrigger = true,
      whitelistedUserIds = [],
      whitelistedRoleIds = []
    } = guildDoc.antiNuke;

    // Fetch the recent audit log to attribute the executor
    let auditEvent: AuditLogEvent;
    switch (actionType) {
      case 'CHANNEL_DELETE': auditEvent = AuditLogEvent.ChannelDelete; break;
      case 'CHANNEL_CREATE': auditEvent = AuditLogEvent.ChannelCreate; break;
      case 'ROLE_DELETE': auditEvent = AuditLogEvent.RoleDelete; break;
      case 'ROLE_CREATE': auditEvent = AuditLogEvent.RoleCreate; break;
      case 'BAN': auditEvent = AuditLogEvent.MemberBanAdd; break;
      case 'KICK': auditEvent = AuditLogEvent.MemberKick; break;
    }

    try {
      const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: auditEvent }).catch(() => null);
      if (!auditLogs) return;

      const latestEntry = auditLogs.entries.first() as GuildAuditLogsEntry | undefined;
      if (!latestEntry || !latestEntry.executor) return;

      const executor = latestEntry.executor;

      // Ignore if the action was performed by the Bot itself or the Server Owner
      if (executor.id === client.user?.id || executor.id === guild.ownerId) {
        return;
      }

      // Check user whitelist
      if (whitelistedUserIds.includes(executor.id)) {
        return;
      }

      // Check role whitelist
      const member = await guild.members.fetch(executor.id).catch(() => null);
      if (member) {
        const hasWhitelistedRole = member.roles.cache.some(r => whitelistedRoleIds.includes(r.id));
        if (hasWhitelistedRole) return;
      }

      const now = Date.now();
      const records = this.actionVelocity.get(guild.id) || [];
      records.push({
        executorId: executor.id,
        actionType,
        timestamp: now
      });

      // Filter to sliding window
      const cutoff = now - (timeWindowSeconds * 1000);
      const activeRecords = records.filter(r => r.timestamp >= cutoff);
      this.actionVelocity.set(guild.id, activeRecords);

      // Count actions performed by this specific executor
      const executorActions = activeRecords.filter(r => r.executorId === executor.id && r.actionType === actionType);
      
      let threshold = 3;
      switch (actionType) {
        case 'CHANNEL_DELETE': threshold = maxChannelDeletions; break;
        case 'CHANNEL_CREATE': threshold = maxChannelCreations; break;
        case 'ROLE_DELETE': threshold = maxRoleDeletions; break;
        case 'ROLE_CREATE': threshold = maxRoleCreations; break;
        case 'BAN': threshold = maxBans; break;
        case 'KICK': threshold = maxKicks; break;
      }

      if (executorActions.length >= threshold) {
        // Nuke attempt threshold reached!
        let mitigationMessage = 'No automatic role removal applied.';

        if (member) {
          // 1. Strip administrative/dangerous roles
          if (stripAdminOnTrigger || quarantineOffenderRoles) {
            const dangerousRoles = member.roles.cache.filter(role => 
              role.permissions.has(PermissionsBitField.Flags.Administrator) ||
              role.permissions.has(PermissionsBitField.Flags.ManageGuild) ||
              role.permissions.has(PermissionsBitField.Flags.ManageChannels) ||
              role.permissions.has(PermissionsBitField.Flags.ManageRoles) ||
              role.permissions.has(PermissionsBitField.Flags.BanMembers) ||
              role.permissions.has(PermissionsBitField.Flags.KickMembers)
            );

            for (const [_, role] of dangerousRoles) {
              await member.roles.remove(role, 'NEXUS GUARD Anti-Nuke: Mass destructive action limit exceeded').catch(() => null);
            }

            mitigationMessage = `Stripped ${dangerousRoles.size} administrative / destructive roles from executor.`;
          }

          // 2. Put user into maximum timeout if supported
          if (member.moderatable) {
            await member.timeout(28 * 24 * 60 * 60 * 1000, 'NEXUS GUARD Anti-Nuke: Destructive rate limit triggered').catch(() => null);
            mitigationMessage += ' Member quarantined in timeout.';
          }
        }

        // Report incident
        await IncidentManager.getInstance().reportIncident(client, {
          guild,
          type: 'NUKE_ATTEMPT',
          severity: SecurityIncidentSeverity.CRITICAL,
          title: `Anti-Nuke Triggered: Rapid ${actionType} Detected`,
          description: `User <@${executor.id}> performed ${executorActions.length} ${actionType} actions in under ${timeWindowSeconds}s (Threshold: ${threshold}).`,
          evidence: {
            executorId: executor.id,
            actionType,
            count: executorActions.length,
            timeWindowSeconds,
            auditLogEntryId: latestEntry.id
          },
          recommendedAction: 'Verify the executor\'s identity and server integrity immediately. If compromised, ban the account.',
          offender: executor,
          mitigationTaken: mitigationMessage
        });

        // Reset executor actions to prevent spamming reports
        this.actionVelocity.set(
          guild.id, 
          activeRecords.filter(r => r.executorId !== executor.id)
        );
      }
    } catch (err) {
      console.error('[ANTI-NUKE] Error monitoring audit logs:', err);
    }
  }
}
