import { Client, GuildMember } from 'discord.js';
import { GuildModel } from '@nexus-guard/database';
import { SecurityIncidentSeverity } from '@nexus-guard/shared';
import { IncidentManager } from './IncidentManager.js';
import { EmergencyLockdown } from './EmergencyLockdown.js';

interface JoinRecord {
  userId: string;
  joinedAt: number;
  accountAgeDays: number;
}

export class AntiRaidEngine {
  private static instance: AntiRaidEngine;
  // Map of GuildID -> Array of JoinRecord
  private joinHistory: Map<string, JoinRecord[]> = new Map();
  // Map of GuildID -> Raid active flag
  private activeRaidState: Map<string, boolean> = new Map();

  private constructor() {}

  public static getInstance(): AntiRaidEngine {
    if (!AntiRaidEngine.instance) {
      AntiRaidEngine.instance = new AntiRaidEngine();
    }
    return AntiRaidEngine.instance;
  }

  public async handleMemberJoin(client: Client, member: GuildMember): Promise<void> {
    const guild = member.guild;
    const now = Date.now();

    // Fetch Guild Settings
    const guildDoc = await GuildModel.findOne({ guildId: guild.id });
    if (!guildDoc || !guildDoc.antiRaid?.enabled) {
      return;
    }

    const {
      maxJoinsPerInterval = 5,
      intervalSeconds = 10,
      minAccountAgeDays = 3,
      actionOnTrigger = 'KICK_NEW',
      autoLockdownDurationMinutes = 30
    } = guildDoc.antiRaid;

    // Calculate account age in days
    const accountCreatedAt = member.user.createdAt.getTime();
    const accountAgeDays = Math.floor((now - accountCreatedAt) / (1000 * 60 * 60 * 24));

    // Record this join
    const guildJoins = this.joinHistory.get(guild.id) || [];
    guildJoins.push({
      userId: member.id,
      joinedAt: now,
      accountAgeDays
    });

    // Prune joins older than intervalSeconds
    const cutoff = now - (intervalSeconds * 1000);
    const recentJoins = guildJoins.filter(j => j.joinedAt >= cutoff);
    this.joinHistory.set(guild.id, recentJoins);

    // Evaluate Raid Threshold
    const isRaidSpike = recentJoins.length >= maxJoinsPerInterval;
    const isSuspiciousAccount = accountAgeDays < minAccountAgeDays;

    if (isRaidSpike) {
      const isAlreadyTriggered = this.activeRaidState.get(guild.id) || false;

      if (!isAlreadyTriggered) {
        this.activeRaidState.set(guild.id, true);

        // Mitigation action
        let mitigationMsg = '';

        if (actionOnTrigger === 'LOCKDOWN') {
          await EmergencyLockdown.getInstance().activateLockdown(
            client,
            guild,
            'Anti-Raid Automated Trigger: Excessive join velocity spike',
            'SYSTEM-ANTI-RAID'
          );
          mitigationMsg = `Emergency server lockdown engaged for ${autoLockdownDurationMinutes} minutes.`;
        } else if (actionOnTrigger === 'KICK_NEW') {
          // Kick the recent joins
          for (const record of recentJoins) {
            const targetMember = await guild.members.fetch(record.userId).catch(() => null);
            if (targetMember && targetMember.kickable) {
              await targetMember.kick('NEXUS GUARD Anti-Raid: Mass join velocity threshold exceeded').catch(() => null);
            }
          }
          mitigationMsg = `Kicked ${recentJoins.length} recent joining accounts.`;
        } else if (actionOnTrigger === 'BAN_NEW') {
          // Ban the recent joins
          for (const record of recentJoins) {
            const targetMember = await guild.members.fetch(record.userId).catch(() => null);
            if (targetMember && targetMember.bannable) {
              await targetMember.ban({ reason: 'NEXUS GUARD Anti-Raid: Mass join velocity threshold exceeded' }).catch(() => null);
            }
          }
          mitigationMsg = `Banned ${recentJoins.length} recent joining accounts.`;
        } else {
          mitigationMsg = 'Alert dispatched to administrators for review.';
        }

        // Report Incident
        await IncidentManager.getInstance().reportIncident(client, {
          guild,
          type: 'RAID_DETECTED',
          severity: SecurityIncidentSeverity.CRITICAL,
          title: 'Mass Member Join Spike (Raid Detected)',
          description: `Detected ${recentJoins.length} members joined within ${intervalSeconds} seconds (Threshold: ${maxJoinsPerInterval}).`,
          evidence: {
            joinCount: recentJoins.length,
            timeWindowSeconds: intervalSeconds,
            sampleUserIds: recentJoins.map(j => j.userId).slice(0, 10),
            youngAccountsCount: recentJoins.filter(j => j.accountAgeDays < minAccountAgeDays).length
          },
          recommendedAction: 'Verify pending members and keep verification gate or lockdown active until raid ceases.',
          mitigationTaken: mitigationMsg
        });

        // Reset raid flag after cooldown
        setTimeout(() => {
          this.activeRaidState.set(guild.id, false);
        }, intervalSeconds * 2000);
      }
    } else if (isSuspiciousAccount) {
      // Single suspicious young account check
      console.log(`[ANTI-RAID] Notice: User ${member.user.tag} joined with young account (${accountAgeDays} days old).`);
    }
  }
}
