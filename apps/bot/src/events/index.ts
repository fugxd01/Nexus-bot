import { 
  Client, 
  Events, 
  REST, 
  Routes, 
  Interaction, 
  Message, 
  GuildMember, 
  Role, 
  GuildChannel, 
  GuildBan, 
  VoiceState 
} from 'discord.js';
import { commands } from '../commands/index.js';
import { AntiRaidEngine } from '../security/AntiRaidEngine.js';
import { AntiNukeEngine } from '../security/AntiNukeEngine.js';
import { AntiSpamEngine } from '../security/AntiSpamEngine.js';
import { AntiBotEngine } from '../security/AntiBotEngine.js';
import { PermissionGuard } from '../security/PermissionGuard.js';
import { TicketManager } from '../tickets/TicketManager.js';
import { WelcomeService } from '../services/WelcomeService.js';
import { VoiceService } from '../services/VoiceService.js';
import { AutomationService } from '../services/AutomationService.js';
import { GuildModel } from '@nexus-guard/database';

export function registerBotEvents(client: Client): void {
  // 1. CLIENT READY
  client.once(Events.ClientReady, async (readyClient) => {
    console.log(`[NEXUS GUARD BOT] Logged in as ${readyClient.user.tag} (${readyClient.user.id})`);
    console.log(`[NEXUS GUARD BOT] Guarding ${readyClient.guilds.cache.size} servers.`);

    // Sync Guilds into Database
    for (const [_, guild] of readyClient.guilds.cache) {
      await GuildModel.updateOne(
        { guildId: guild.id },
        {
          $setOnInsert: {
            guildId: guild.id,
            guildName: guild.name,
            ownerId: guild.ownerId,
            icon: guild.iconURL()
          }
        },
        { upsert: true }
      ).catch(() => null);
    }

    // Register Slash Commands Globally
    try {
      const rest = new REST({ version: '10' }).setToken(client.token!);
      const body = commands.map(c => c.data.toJSON());
      await rest.put(
        Routes.applicationCommands(readyClient.user.id),
        { body }
      );
      console.log(`[NEXUS GUARD BOT] Registered ${commands.length} application slash commands globally.`);
    } catch (err) {
      console.error('[NEXUS GUARD BOT] Failed to register slash commands:', err);
    }

    // Start background automation
    AutomationService.getInstance().startScheduler(client);
  });

  // 2. INTERACTIONS
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (interaction.isChatInputCommand()) {
      const command = commands.find(c => c.data.name === interaction.commandName);
      if (command) {
        try {
          await command.execute(interaction);
        } catch (err: any) {
          console.error(`[COMMAND ERROR] ${interaction.commandName}:`, err);
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'An internal error occurred executing this command.', ephemeral: true }).catch(() => null);
          } else {
            await interaction.reply({ content: 'An internal error occurred executing this command.', ephemeral: true }).catch(() => null);
          }
        }
      }
    } else if (interaction.isButton()) {
      if (interaction.customId === 'nexus_ticket_claim') {
        await TicketManager.getInstance().claimTicket(interaction);
      } else if (interaction.customId === 'nexus_ticket_close') {
        await TicketManager.getInstance().closeTicket(interaction);
      }
    }
  });

  // 3. MESSAGE CREATE (Anti-Spam & Prefix)
  client.on(Events.MessageCreate, async (message: Message) => {
    if (!message.guild || message.author.bot) return;

    // Check message with Anti-Spam engine
    const flagged = await AntiSpamEngine.getInstance().inspectMessage(client, message);
    if (flagged) return;
  });

  // 4. GUILD MEMBER ADD (Anti-Raid, Anti-Bot, Welcome)
  client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
    if (member.user.bot) {
      await AntiBotEngine.getInstance().handleBotJoin(client, member);
    } else {
      await AntiRaidEngine.getInstance().handleMemberJoin(client, member);
      await WelcomeService.getInstance().handleMemberJoin(member);
    }
  });

  // 5. GUILD MEMBER REMOVE (Goodbye & Anti-Nuke Kick velocity)
  client.on(Events.GuildMemberRemove, async (member: GuildMember | any) => {
    if (!member.guild) return;
    await WelcomeService.getInstance().handleMemberLeave(member);
    await AntiNukeEngine.getInstance().trackDestructiveAction(client, member.guild, 'KICK');
  });

  // 6. GUILD BAN ADD (Anti-Nuke Ban velocity)
  client.on(Events.GuildBanAdd, async (ban: GuildBan) => {
    await AntiNukeEngine.getInstance().trackDestructiveAction(client, ban.guild, 'BAN');
  });

  // 7. ROLE UPDATE (Permission Guard)
  client.on(Events.GuildRoleUpdate, async (oldRole: Role, newRole: Role) => {
    await PermissionGuard.getInstance().handleRoleUpdate(client, oldRole, newRole);
  });

  // 8. ROLE DELETE & CREATE (Anti-Nuke)
  client.on(Events.GuildRoleDelete, async (role: Role) => {
    await AntiNukeEngine.getInstance().trackDestructiveAction(client, role.guild, 'ROLE_DELETE');
  });

  client.on(Events.GuildRoleCreate, async (role: Role) => {
    await AntiNukeEngine.getInstance().trackDestructiveAction(client, role.guild, 'ROLE_CREATE');
  });

  // 9. CHANNEL DELETE & CREATE (Anti-Nuke)
  client.on(Events.ChannelDelete, async (channel) => {
    if ('guild' in channel && channel.guild) {
      await AntiNukeEngine.getInstance().trackDestructiveAction(client, channel.guild, 'CHANNEL_DELETE');
    }
  });

  client.on(Events.ChannelCreate, async (channel) => {
    if ('guild' in channel && channel.guild) {
      await AntiNukeEngine.getInstance().trackDestructiveAction(client, channel.guild, 'CHANNEL_CREATE');
    }
  });

  // 10. VOICE STATE UPDATE
  client.on(Events.VoiceStateUpdate, (oldState: VoiceState, newState: VoiceState) => {
    VoiceService.getInstance().handleVoiceStateUpdate(oldState, newState);
  });
}
