import { Client, GuildMember, TextChannel, EmbedBuilder } from 'discord.js';
import { GuildModel } from '@nexus-guard/database';

export class WelcomeService {
  private static instance: WelcomeService;

  private constructor() {}

  public static getInstance(): WelcomeService {
    if (!WelcomeService.instance) {
      WelcomeService.instance = new WelcomeService();
    }
    return WelcomeService.instance;
  }

  public async handleMemberJoin(member: GuildMember): Promise<void> {
    const guild = member.guild;
    const guildDoc = await GuildModel.findOne({ guildId: guild.id });
    if (!guildDoc || !guildDoc.welcome?.enabled) return;

    const {
      channelId,
      welcomeMessage = 'Welcome {user} to {server}!',
      useEmbed = true,
      autoRoleId
    } = guildDoc.welcome;

    // 1. Assign Auto Role if configured
    if (autoRoleId) {
      const role = guild.roles.cache.get(autoRoleId);
      if (role && role.editable) {
        await member.roles.add(role, 'NEXUS GUARD Auto-Role').catch(err => 
          console.warn(`[WELCOME] Failed to assign auto role ${autoRoleId}:`, err)
        );
      }
    }

    // 2. Dispatch Welcome Message
    if (channelId) {
      const channel = guild.channels.cache.get(channelId) as TextChannel;
      if (channel && channel.isTextBased()) {
        const formattedMsg = welcomeMessage
          .replace(/{user}/g, `<@${member.id}>`)
          .replace(/{username}/g, member.user.username)
          .replace(/{server}/g, guild.name)
          .replace(/{memberCount}/g, guild.memberCount.toString());

        if (useEmbed) {
          const embed = new EmbedBuilder()
            .setTitle(`👋 Welcome to ${guild.name}`)
            .setDescription(formattedMsg)
            .setColor(0x8b5cf6)
            .setThumbnail(member.user.displayAvatarURL())
            .addFields(
              { name: 'Member Count', value: `#${guild.memberCount}`, inline: true },
              { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'NEXUS GUARD Protection' });

          await channel.send({ embeds: [embed] }).catch(() => null);
        } else {
          await channel.send({ content: formattedMsg }).catch(() => null);
        }
      }
    }
  }

  public async handleMemberLeave(member: GuildMember): Promise<void> {
    const guild = member.guild;
    const guildDoc = await GuildModel.findOne({ guildId: guild.id });
    if (!guildDoc || !guildDoc.welcome?.enabled) return;

    const { channelId, goodbyeMessage = '{user} has left the server.', useEmbed = true } = guildDoc.welcome;
    if (channelId) {
      const channel = guild.channels.cache.get(channelId) as TextChannel;
      if (channel && channel.isTextBased()) {
        const formattedMsg = goodbyeMessage
          .replace(/{user}/g, `**${member.user.tag}**`)
          .replace(/{username}/g, member.user.username)
          .replace(/{server}/g, guild.name)
          .replace(/{memberCount}/g, guild.memberCount.toString());

        if (useEmbed) {
          const embed = new EmbedBuilder()
            .setTitle(`🚪 Member Left`)
            .setDescription(formattedMsg)
            .setColor(0x64748b)
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();

          await channel.send({ embeds: [embed] }).catch(() => null);
        } else {
          await channel.send({ content: formattedMsg }).catch(() => null);
        }
      }
    }
  }
}
