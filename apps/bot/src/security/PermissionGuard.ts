import { Client, Role, AuditLogEvent, GuildAuditLogsEntry, PermissionsBitField } from 'discord.js';
import { GuildModel } from '@nexus-guard/database';
import { SecurityIncidentSeverity } from '@nexus-guard/shared';
import { IncidentManager } from './IncidentManager.js';

export class PermissionGuard {
  private static instance: PermissionGuard;

  private constructor() {}

  public static getInstance(): PermissionGuard {
    if (!PermissionGuard.instance) {
      PermissionGuard.instance = new PermissionGuard();
    }
    return PermissionGuard.instance;
  }

  public async handleRoleUpdate(client: Client, oldRole: Role, newRole: Role): Promise<void> {
    const guild = newRole.guild;
    const guildDoc = await GuildModel.findOne({ guildId: guild.id });
    if (!guildDoc || !guildDoc.antiNuke?.enabled) return;

    // Check if ADMINISTRATOR or dangerous permission was just granted
    const oldHasAdmin = oldRole.permissions.has(PermissionsBitField.Flags.Administrator);
    const newHasAdmin = newRole.permissions.has(PermissionsBitField.Flags.Administrator);

    if (!oldHasAdmin && newHasAdmin) {
      // Fetch who modified the role
      let executor = null;
      try {
        const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleUpdate }).catch(() => null);
        if (auditLogs) {
          const entry = auditLogs.entries.first() as GuildAuditLogsEntry | undefined;
          if (entry && entry.target?.id === newRole.id && entry.executor) {
            executor = entry.executor;
          }
        }
      } catch (e) {
        console.warn('[PERMISSION GUARD] Could not read audit logs:', e);
      }

      // If action was performed by the Bot itself or the Server Owner, allow it
      if (executor?.id === client.user?.id || executor?.id === guild.ownerId) {
        return;
      }

      // Check whitelists
      if (executor && guildDoc.antiNuke.whitelistedUserIds.includes(executor.id)) {
        return;
      }

      // Revert the administrator permission
      let mitigation = 'Failed to revert permission automatically.';
      try {
        if (newRole.editable) {
          const safePermissions = new PermissionsBitField(newRole.permissions).remove(PermissionsBitField.Flags.Administrator);
          await newRole.setPermissions(safePermissions, 'NEXUS GUARD Permission Guard: Unauthorized Administrator grant detected');
          mitigation = `Reverted ADMINISTRATOR permission on role "${newRole.name}".`;
        }
      } catch (err) {
        console.error('[PERMISSION GUARD] Could not revert role permissions:', err);
      }

      await IncidentManager.getInstance().reportIncident(client, {
        guild,
        type: 'PERMISSION_HIJACK',
        severity: SecurityIncidentSeverity.CRITICAL,
        title: `Unauthorized Administrator Grant Detected on Role: ${newRole.name}`,
        description: `Role "${newRole.name}" was granted full Administrator permissions by ${executor ? `<@${executor.id}> (${executor.tag})` : 'an unknown actor'}.`,
        evidence: {
          roleId: newRole.id,
          roleName: newRole.name,
          executorId: executor?.id,
          executorTag: executor?.tag
        },
        recommendedAction: 'Audit recent role assignments and ensure the executor\'s account is secure.',
        offender: executor || undefined,
        mitigationTaken: mitigation
      });
    }
  }
}
