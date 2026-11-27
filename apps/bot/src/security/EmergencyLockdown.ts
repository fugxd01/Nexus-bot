import { Client, Guild, PermissionsBitField, TextChannel, VoiceChannel } from 'discord.js';
import { GuildModel } from '@nexus-guard/database';
import { SecurityIncidentSeverity } from '@nexus-guard/shared';
import { IncidentManager } from './IncidentManager.js';

export class EmergencyLockdown {
  private static instance: EmergencyLockdown;

  private constructor() {}

  public static getInstance(): EmergencyLockdown {
    if (!EmergencyLockdown.instance) {
      EmergencyLockdown.instance = new EmergencyLockdown();
    }
    return EmergencyLockdown.instance;
  }

  public async activateLockdown(
    client: Client, 
    guild: Guild, 
    reason = 'Emergency server-wide containment protocol engaged', 
    executorTag = 'ADMINISTRATOR'
  ): Promise<{ lockedChannelsCount: number; message: string }> {
    const guildDoc = await GuildModel.findOne({ guildId: guild.id });
    const everyoneRole = guild.roles.everyone;

    let lockedCount = 0;
    const lockedChannelIds: string[] = [];

    // Find all text and announcement channels
    const channels = guild.channels.cache.filter(c => 
      c.isTextBased() && !c.isDMBased() && !c.isThread()
    );

    for (const [_, channel] of channels) {
      try {
        const textChan = channel as TextChannel;
        // Check current permissions for @everyone
        const currentOverwrites = textChan.permissionOverwrites.cache.get(everyoneRole.id);
        const allowsSend = currentOverwrites ? !currentOverwrites.deny.has(PermissionsBitField.Flags.SendMessages) : true;

        if (allowsSend) {
          await textChan.permissionOverwrites.edit(everyoneRole, {
            SendMessages: false,
            AddReactions: false,
            CreatePublicThreads: false,
            CreatePrivateThreads: false
          }, { reason: `NEXUS GUARD Emergency Lockdown: ${reason}` });

          lockedCount++;
          lockedChannelIds.push(channel.id);
        }
      } catch (err) {
        console.warn(`[LOCKDOWN] Could not lock channel ${channel.id}:`, err);
      }
    }

    // Update database state
    await GuildModel.updateOne(
      { guildId: guild.id },
      {
        $set: {
          'lockdown.isLockedDown': true,
          'lockdown.lockedAt': new Date(),
          'lockdown.lockedBy': executorTag,
          'lockdown.lockdownReason': reason,
          'lockdown.restrictedChannels': lockedChannelIds
        }
      },
      { upsert: true }
    );

    // Report incident
    await IncidentManager.getInstance().reportIncident(client, {
      guild,
      type: 'EMERGENCY_LOCKDOWN',
      severity: SecurityIncidentSeverity.CRITICAL,
      title: 'Emergency Server Lockdown Engaged',
      description: `Server containment activated. Restricted messaging in ${lockedCount} channels. Triggered by ${executorTag}.`,
      evidence: {
        reason,
        lockedChannelsCount: lockedCount,
        channelIds: lockedChannelIds.slice(0, 20)
      },
      recommendedAction: 'Assess the threat. Use the Nexus Guard Dashboard or /unlockdown command once containment is verified.',
      mitigationTaken: `Locked ${lockedCount} public communication channels.`
    });

    return {
      lockedChannelsCount: lockedCount,
      message: `Emergency containment engaged. ${lockedCount} channels locked successfully.`
    };
  }

  public async liftLockdown(
    client: Client, 
    guild: Guild, 
    reason = 'Server containment protocol lifted', 
    executorTag = 'ADMINISTRATOR'
  ): Promise<{ unlockedChannelsCount: number; message: string }> {
    const guildDoc = await GuildModel.findOne({ guildId: guild.id });
    const everyoneRole = guild.roles.everyone;
    const restrictedChannels = guildDoc?.lockdown?.restrictedChannels || [];

    let unlockedCount = 0;

    for (const channelId of restrictedChannels) {
      try {
        const channel = guild.channels.cache.get(channelId) as TextChannel;
        if (channel && channel.permissionOverwrites) {
          await channel.permissionOverwrites.edit(everyoneRole, {
            SendMessages: null,
            AddReactions: null,
            CreatePublicThreads: null,
            CreatePrivateThreads: null
          }, { reason: `NEXUS GUARD Lift Lockdown: ${reason}` });
          unlockedCount++;
        }
      } catch (err) {
        console.warn(`[LOCKDOWN] Could not restore channel ${channelId}:`, err);
      }
    }

    // Update database state
    await GuildModel.updateOne(
      { guildId: guild.id },
      {
        $set: {
          'lockdown.isLockedDown': false,
          'lockdown.lockedAt': null,
          'lockdown.lockedBy': null,
          'lockdown.lockdownReason': null,
          'lockdown.restrictedChannels': []
        }
      }
    );

    return {
      unlockedChannelsCount: unlockedCount,
      message: `Lockdown deactivated. ${unlockedCount} channels restored to normal permissions.`
    };
  }
}
