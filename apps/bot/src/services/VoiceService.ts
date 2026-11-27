import { VoiceState, EmbedBuilder, TextChannel } from 'discord.js';

export class VoiceService {
  private static instance: VoiceService;
  // Map of GuildId -> (ChannelId -> UserCount)
  private voiceActivity: Map<string, Map<string, number>> = new Map();

  private constructor() {}

  public static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  public handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): void {
    const guild = newState.guild || oldState.guild;
    if (!guild) return;

    let guildChannels = this.voiceActivity.get(guild.id);
    if (!guildChannels) {
      guildChannels = new Map();
      this.voiceActivity.set(guild.id, guildChannels);
    }

    // User left voice channel
    if (oldState.channelId && !newState.channelId) {
      const current = guildChannels.get(oldState.channelId) || 1;
      guildChannels.set(oldState.channelId, Math.max(0, current - 1));
    }
    // User joined voice channel
    else if (!oldState.channelId && newState.channelId) {
      const current = guildChannels.get(newState.channelId) || 0;
      guildChannels.set(newState.channelId, current + 1);
    }
    // User moved channels
    else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      const oldVal = guildChannels.get(oldState.channelId) || 1;
      guildChannels.set(oldState.channelId, Math.max(0, oldVal - 1));

      const newVal = guildChannels.get(newState.channelId) || 0;
      guildChannels.set(newState.channelId, newVal + 1);
    }
  }

  public getGuildVoiceStats(guildId: string): { activeChannelsCount: number; totalUsersInVoice: number } {
    const channels = this.voiceActivity.get(guildId);
    if (!channels) return { activeChannelsCount: 0, totalUsersInVoice: 0 };

    let activeChannelsCount = 0;
    let totalUsersInVoice = 0;

    for (const [_, count] of channels.entries()) {
      if (count > 0) {
        activeChannelsCount++;
        totalUsersInVoice += count;
      }
    }

    return { activeChannelsCount, totalUsersInVoice };
  }
}
