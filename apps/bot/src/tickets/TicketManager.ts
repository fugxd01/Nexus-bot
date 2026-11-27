import { 
  Client, 
  Guild, 
  GuildMember, 
  TextChannel, 
  ChannelType, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ButtonInteraction
} from 'discord.js';
import { TicketModel, GuildModel } from '@nexus-guard/database';
import { TicketStatus } from '@nexus-guard/shared';

export class TicketManager {
  private static instance: TicketManager;

  private constructor() {}

  public static getInstance(): TicketManager {
    if (!TicketManager.instance) {
      TicketManager.instance = new TicketManager();
    }
    return TicketManager.instance;
  }

  public async createTicket(guild: Guild, member: GuildMember, subject = 'General Support'): Promise<TextChannel> {
    const guildDoc = await GuildModel.findOne({ guildId: guild.id });
    const maxTickets = guildDoc?.ticket?.maxOpenTicketsPerUser || 2;
    const categoryId = guildDoc?.ticket?.categoryId;
    const supportRoleId = guildDoc?.ticket?.supportRoleId;

    // Check open ticket count for this user
    const openTicketsCount = await TicketModel.countDocuments({
      guildId: guild.id,
      userId: member.id,
      status: { $in: [TicketStatus.OPEN, TicketStatus.CLAIMED] }
    });

    if (openTicketsCount >= maxTickets) {
      throw new Error(`You already have ${openTicketsCount} active tickets open. Please resolve existing tickets first.`);
    }

    const ticketNumber = Math.floor(1000 + Math.random() * 9000);
    const channelName = `ticket-${ticketNumber}`;

    // Setup permission overwrites: private channel for user, support staff, and bot
    const permissionOverwrites: any[] = [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: member.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles
        ]
      },
      {
        id: guild.client.user!.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ReadMessageHistory
        ]
      }
    ];

    if (supportRoleId) {
      permissionOverwrites.push({
        id: supportRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles
        ]
      });
    }

    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: categoryId || undefined,
      permissionOverwrites
    });

    // Create DB Record
    const ticketDoc = await TicketModel.create({
      ticketId: `TICKET-${ticketNumber}`,
      guildId: guild.id,
      channelId: ticketChannel.id,
      userId: member.id,
      userTag: member.user.tag,
      subject,
      status: TicketStatus.OPEN
    });

    // Send Ticket Control Message with Action Buttons
    const embed = new EmbedBuilder()
      .setTitle(`🎫 Support Ticket: #${ticketNumber}`)
      .setDescription(`Welcome <@${member.id}>! A member of our staff team will assist you shortly.\n\n**Subject:** ${subject}`)
      .setColor(0x7c3aed)
      .addFields(
        { name: 'Status', value: '🟢 OPEN', inline: true },
        { name: 'Opened By', value: `<@${member.id}>`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'NEXUS GUARD Support System' });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('nexus_ticket_claim')
        .setLabel('Claim Ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('✋'),
      new ButtonBuilder()
        .setCustomId('nexus_ticket_close')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒')
    );

    await ticketChannel.send({ embeds: [embed], components: [row] });
    return ticketChannel;
  }

  public async claimTicket(interaction: ButtonInteraction): Promise<void> {
    const channel = interaction.channel as TextChannel;
    const ticket = await TicketModel.findOne({ channelId: channel.id });
    if (!ticket) {
      await interaction.reply({ content: 'No associated ticket record found for this channel.', ephemeral: true });
      return;
    }

    if (ticket.status === TicketStatus.CLAIMED) {
      await interaction.reply({ content: `Ticket already claimed by <@${ticket.claimedBy}>.`, ephemeral: true });
      return;
    }

    ticket.status = TicketStatus.CLAIMED;
    ticket.claimedBy = interaction.user.id;
    ticket.claimedByTag = interaction.user.tag;
    await ticket.save();

    await interaction.reply({
      content: `✋ Ticket has been claimed by <@${interaction.user.id}>.`
    });
  }

  public async closeTicket(interaction: ButtonInteraction): Promise<void> {
    const channel = interaction.channel as TextChannel;
    const ticket = await TicketModel.findOne({ channelId: channel.id });
    if (!ticket) {
      await interaction.reply({ content: 'No ticket record found.', ephemeral: true });
      return;
    }

    ticket.status = TicketStatus.CLOSED;
    ticket.closedBy = interaction.user.id;
    ticket.closedByTag = interaction.user.tag;
    await ticket.save();

    await interaction.reply({
      content: `🔒 Ticket closed by <@${interaction.user.id}>. Channel will be deleted in 5 seconds...`
    });

    setTimeout(async () => {
      await channel.delete('NEXUS GUARD: Ticket closed').catch(() => null);
    }, 5000);
  }
}
