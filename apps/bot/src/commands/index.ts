import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  PermissionFlagsBits, 
  EmbedBuilder,
  GuildMember
} from 'discord.js';
import { ModerationService } from '../moderation/ModerationService.js';
import { EmergencyLockdown } from '../security/EmergencyLockdown.js';
import { TicketManager } from '../tickets/TicketManager.js';
import { GuildModel, SecurityIncidentModel } from '@nexus-guard/database';

export interface Command {
  data: any;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export const commands: Command[] = [
  // 1. PING
  {
    data: new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Check NEXUS GUARD latency and status'),
    async execute(interaction) {
      const sent = await interaction.reply({ content: 'Pinging security core...', fetchReply: true });
      const latency = sent.createdTimestamp - interaction.createdTimestamp;
      const wsPing = interaction.client.ws.ping;

      const embed = new EmbedBuilder()
        .setTitle('🛡️ NEXUS GUARD — System Status')
        .setColor(0x06b6d4)
        .addFields(
          { name: 'Gateway Latency', value: `\`${latency}ms\``, inline: true },
          { name: 'WebSocket Heartbeat', value: `\`${wsPing}ms\``, inline: true },
          { name: 'Security Modules', value: '🟢 ALL OPERATIONAL', inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ content: '', embeds: [embed] });
    }
  },

  // 2. BAN
  {
    data: new SlashCommandBuilder()
      .setName('ban')
      .setDescription('Ban a member from the server with audit logging')
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
      .addUserOption(opt => opt.setName('target').setDescription('The member to ban').setRequired(true))
      .addStringOption(opt => opt.setName('reason').setDescription('Reason for ban').setRequired(false))
      .addIntegerOption(opt => opt.setName('delete_days').setDescription('Days of message history to delete (0-7)').setMinValue(0).setMaxValue(7).setRequired(false)),
    async execute(interaction) {
      const targetUser = interaction.options.getUser('target', true);
      const reason = interaction.options.getString('reason') || 'Violation of server rules';
      const deleteDays = interaction.options.getInteger('delete_days') || 0;

      await interaction.deferReply();
      try {
        const member = await interaction.guild!.members.fetch(targetUser.id).catch(() => null);
        await ModerationService.getInstance().banMember(
          interaction.guild!,
          member || targetUser,
          interaction.member as GuildMember,
          reason,
          deleteDays * 24 * 60 * 60
        );

        const embed = new EmbedBuilder()
          .setTitle('🔨 Member Banned')
          .setColor(0xef4444)
          .setDescription(`**${targetUser.tag}** has been banned.`)
          .addFields(
            { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
            { name: 'Reason', value: reason, inline: true }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } catch (err: any) {
        await interaction.editReply({ content: `❌ Ban failed: ${err.message}` });
      }
    }
  },

  // 3. UNBAN
  {
    data: new SlashCommandBuilder()
      .setName('unban')
      .setDescription('Unban a user by their Discord User ID')
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
      .addStringOption(opt => opt.setName('user_id').setDescription('The Discord User ID to unban').setRequired(true))
      .addStringOption(opt => opt.setName('reason').setDescription('Reason for unban').setRequired(false)),
    async execute(interaction) {
      const userId = interaction.options.getString('user_id', true);
      const reason = interaction.options.getString('reason') || 'Appeal approved';

      await interaction.deferReply();
      try {
        await ModerationService.getInstance().unbanMember(
          interaction.guild!,
          userId,
          interaction.member as GuildMember,
          reason
        );

        await interaction.editReply({
          content: `✅ Successfully unbanned user ID \`${userId}\`. Reason: ${reason}`
        });
      } catch (err: any) {
        await interaction.editReply({ content: `❌ Unban failed: ${err.message}` });
      }
    }
  },

  // 4. KICK
  {
    data: new SlashCommandBuilder()
      .setName('kick')
      .setDescription('Kick a member from the server')
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
      .addUserOption(opt => opt.setName('target').setDescription('The member to kick').setRequired(true))
      .addStringOption(opt => opt.setName('reason').setDescription('Reason for kick').setRequired(false)),
    async execute(interaction) {
      const targetUser = interaction.options.getUser('target', true);
      const reason = interaction.options.getString('reason') || 'Kicked by moderator';

      await interaction.deferReply();
      try {
        const targetMember = await interaction.guild!.members.fetch(targetUser.id);
        await ModerationService.getInstance().kickMember(
          interaction.guild!,
          targetMember,
          interaction.member as GuildMember,
          reason
        );

        await interaction.editReply({
          content: `👢 **${targetUser.tag}** was kicked from the server. Reason: ${reason}`
        });
      } catch (err: any) {
        await interaction.editReply({ content: `❌ Kick failed: ${err.message}` });
      }
    }
  },

  // 5. TIMEOUT
  {
    data: new SlashCommandBuilder()
      .setName('timeout')
      .setDescription('Put a member in timeout')
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption(opt => opt.setName('target').setDescription('The member to timeout').setRequired(true))
      .addIntegerOption(opt => opt.setName('minutes').setDescription('Duration in minutes').setMinValue(1).setMaxValue(40320).setRequired(true))
      .addStringOption(opt => opt.setName('reason').setDescription('Reason for timeout').setRequired(false)),
    async execute(interaction) {
      const targetUser = interaction.options.getUser('target', true);
      const minutes = interaction.options.getInteger('minutes', true);
      const reason = interaction.options.getString('reason') || 'Violation of rules';

      await interaction.deferReply();
      try {
        const targetMember = await interaction.guild!.members.fetch(targetUser.id);
        await ModerationService.getInstance().timeoutMember(
          interaction.guild!,
          targetMember,
          interaction.member as GuildMember,
          minutes * 60,
          reason
        );

        await interaction.editReply({
          content: `🔇 **${targetUser.tag}** has been timed out for ${minutes} minutes. Reason: ${reason}`
        });
      } catch (err: any) {
        await interaction.editReply({ content: `❌ Timeout failed: ${err.message}` });
      }
    }
  },

  // 6. UNTIMEOUT
  {
    data: new SlashCommandBuilder()
      .setName('untimeout')
      .setDescription('Remove timeout from a member')
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption(opt => opt.setName('target').setDescription('The member to remove timeout from').setRequired(true))
      .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false)),
    async execute(interaction) {
      const targetUser = interaction.options.getUser('target', true);
      const reason = interaction.options.getString('reason') || 'Timeout removed by moderator';

      await interaction.deferReply();
      try {
        const targetMember = await interaction.guild!.members.fetch(targetUser.id);
        await ModerationService.getInstance().removeTimeout(
          interaction.guild!,
          targetMember,
          interaction.member as GuildMember,
          reason
        );

        await interaction.editReply({
          content: `🔊 Timeout removed for **${targetUser.tag}**.`
        });
      } catch (err: any) {
        await interaction.editReply({ content: `❌ Failed to remove timeout: ${err.message}` });
      }
    }
  },

  // 7. WARN
  {
    data: new SlashCommandBuilder()
      .setName('warn')
      .setDescription('Issue a formal security warning to a member')
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption(opt => opt.setName('target').setDescription('Target member').setRequired(true))
      .addStringOption(opt => opt.setName('reason').setDescription('Reason for warning').setRequired(true)),
    async execute(interaction) {
      const targetUser = interaction.options.getUser('target', true);
      const reason = interaction.options.getString('reason', true);

      await interaction.deferReply();
      try {
        const targetMember = await interaction.guild!.members.fetch(targetUser.id);
        const record = await ModerationService.getInstance().warnMember(
          interaction.guild!,
          targetMember,
          interaction.member as GuildMember,
          reason
        );

        const allWarns = await ModerationService.getInstance().getWarningHistory(interaction.guild!.id, targetUser.id);

        const embed = new EmbedBuilder()
          .setTitle('⚠️ Security Warning Issued')
          .setColor(0xf59e0b)
          .setDescription(`**${targetUser.tag}** received a formal warning.`)
          .addFields(
            { name: 'Case ID', value: `#${record.caseNumber}`, inline: true },
            { name: 'Total Warnings', value: `${allWarns.length}`, inline: true },
            { name: 'Reason', value: reason, inline: false }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } catch (err: any) {
        await interaction.editReply({ content: `❌ Failed to warn: ${err.message}` });
      }
    }
  },

  // 8. WARNINGS
  {
    data: new SlashCommandBuilder()
      .setName('warnings')
      .setDescription('Check warning records for a user')
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption(opt => opt.setName('target').setDescription('Target member').setRequired(true)),
    async execute(interaction) {
      const targetUser = interaction.options.getUser('target', true);
      await interaction.deferReply();

      const warns = await ModerationService.getInstance().getWarningHistory(interaction.guild!.id, targetUser.id);
      if (warns.length === 0) {
        await interaction.editReply({ content: `ℹ️ **${targetUser.tag}** has 0 active warnings.` });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`📋 Warning History — ${targetUser.tag}`)
        .setColor(0xf59e0b)
        .setDescription(`Total active warnings: **${warns.length}**`)
        .addFields(
          warns.slice(0, 10).map(w => ({
            name: `Case #${w.caseNumber} — ${w.createdAt.toLocaleDateString()}`,
            value: `**Reason:** ${w.reason}\n**Moderator:** ${w.moderatorTag}`
          }))
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },

  // 9. PURGE
  {
    data: new SlashCommandBuilder()
      .setName('purge')
      .setDescription('Bulk clean messages from this channel')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages to delete (1-100)').setMinValue(1).setMaxValue(100).setRequired(true)),
    async execute(interaction) {
      const amount = interaction.options.getInteger('amount', true);
      const channel = interaction.channel as any;

      if (!channel || !channel.bulkDelete) {
        await interaction.reply({ content: 'Cannot bulk delete messages in this channel type.', ephemeral: true });
        return;
      }

      await interaction.deferReply({ ephemeral: true });
      try {
        const deleted = await channel.bulkDelete(amount, true);
        await interaction.editReply({
          content: `🧹 Successfully deleted **${deleted.size}** messages.`
        });
      } catch (err: any) {
        await interaction.editReply({ content: `❌ Bulk delete failed: ${err.message}` });
      }
    }
  },

  // 10. LOCKDOWN
  {
    data: new SlashCommandBuilder()
      .setName('lockdown')
      .setDescription('Engage emergency lockdown on public communication channels')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addStringOption(opt => opt.setName('reason').setDescription('Reason for lockdown').setRequired(false)),
    async execute(interaction) {
      const reason = interaction.options.getString('reason') || 'Emergency protocol initiated by administrator';

      await interaction.deferReply();
      const result = await EmergencyLockdown.getInstance().activateLockdown(
        interaction.client,
        interaction.guild!,
        reason,
        interaction.user.tag
      );

      const embed = new EmbedBuilder()
        .setTitle('🚨 SERVER CONTAINMENT LOCKDOWN ENGAGED')
        .setDescription(result.message)
        .setColor(0xef4444)
        .addFields(
          { name: 'Locked Channels', value: `${result.lockedChannelsCount}`, inline: true },
          { name: 'Initiated By', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },

  // 11. UNLOCKDOWN
  {
    data: new SlashCommandBuilder()
      .setName('unlockdown')
      .setDescription('Lift emergency server lockdown')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addStringOption(opt => opt.setName('reason').setDescription('Reason for lifting lockdown').setRequired(false)),
    async execute(interaction) {
      const reason = interaction.options.getString('reason') || 'Containment lifted by administrator';

      await interaction.deferReply();
      const result = await EmergencyLockdown.getInstance().liftLockdown(
        interaction.client,
        interaction.guild!,
        reason,
        interaction.user.tag
      );

      const embed = new EmbedBuilder()
        .setTitle('✅ SERVER LOCKDOWN LIFTED')
        .setDescription(result.message)
        .setColor(0x10b981)
        .addFields(
          { name: 'Restored Channels', value: `${result.unlockedChannelsCount}`, inline: true },
          { name: 'Authorized By', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },

  // 12. SECURITY STATUS
  {
    data: new SlashCommandBuilder()
      .setName('security')
      .setDescription('View live Nexus Guard security status and recent incidents')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      await interaction.deferReply();
      const guildId = interaction.guild!.id;
      const guildDoc = await GuildModel.findOne({ guildId });

      const recentIncidents = await SecurityIncidentModel.find({ guildId })
        .sort({ createdAt: -1 })
        .limit(5);

      const embed = new EmbedBuilder()
        .setTitle(`🛡️ Security Center — ${interaction.guild!.name}`)
        .setColor(0x6366f1)
        .addFields(
          { name: 'Anti-Raid', value: guildDoc?.antiRaid?.enabled ? '🟢 Active' : '🔴 Disabled', inline: true },
          { name: 'Anti-Nuke', value: guildDoc?.antiNuke?.enabled ? '🟢 Active' : '🔴 Disabled', inline: true },
          { name: 'Anti-Spam', value: guildDoc?.antiSpam?.enabled ? '🟢 Active' : '🔴 Disabled', inline: true },
          { name: 'Anti-Bot', value: guildDoc?.antiBot?.enabled ? '🟢 Active' : '🔴 Disabled', inline: true },
          { name: 'Lockdown Status', value: guildDoc?.lockdown?.isLockedDown ? '🚨 ENGAGED' : '🟢 Normal', inline: true },
          { name: 'Total Incidents Recorded', value: `${await SecurityIncidentModel.countDocuments({ guildId })}`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Access web dashboard for full telemetry' });

      if (recentIncidents.length > 0) {
        embed.addFields({
          name: 'Recent Security Incidents',
          value: recentIncidents.map(i => `• **${i.severity}** [${i.type}]: ${i.title} (${i.createdAt.toLocaleTimeString()})`).join('\n')
        });
      }

      await interaction.editReply({ embeds: [embed] });
    }
  },

  // 13. TICKET
  {
    data: new SlashCommandBuilder()
      .setName('ticket')
      .setDescription('Open a private support ticket')
      .addStringOption(opt => opt.setName('subject').setDescription('Reason or topic for support').setRequired(false)),
    async execute(interaction) {
      await interaction.deferReply({ ephemeral: true });
      try {
        const subject = interaction.options.getString('subject') || 'General Support Ticket';
        const channel = await TicketManager.getInstance().createTicket(
          interaction.guild!,
          interaction.member as GuildMember,
          subject
        );

        await interaction.editReply({
          content: `✅ Ticket opened in channel <#${channel.id}>.`
        });
      } catch (err: any) {
        await interaction.editReply({ content: `❌ Could not create ticket: ${err.message}` });
      }
    }
  },

  // 14. SERVERINFO
  {
    data: new SlashCommandBuilder()
      .setName('serverinfo')
      .setDescription('Display comprehensive Discord server telemetry'),
    async execute(interaction) {
      const guild = interaction.guild!;
      const owner = await guild.fetchOwner();

      const embed = new EmbedBuilder()
        .setTitle(`📊 Server Analytics — ${guild.name}`)
        .setColor(0x8b5cf6)
        .setThumbnail(guild.iconURL() || '')
        .addFields(
          { name: 'Server ID', value: `\`${guild.id}\``, inline: true },
          { name: 'Owner', value: `<@${owner.id}> (${owner.user.tag})`, inline: true },
          { name: 'Total Members', value: `${guild.memberCount}`, inline: true },
          { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
          { name: 'Channels', value: `${guild.channels.cache.size}`, inline: true },
          { name: 'Created At', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  }
];
