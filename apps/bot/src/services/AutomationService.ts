import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import { AutomationRuleModel } from '@nexus-guard/database';

export class AutomationService {
  private static instance: AutomationService;
  private intervalTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): AutomationService {
    if (!AutomationService.instance) {
      AutomationService.instance = new AutomationService();
    }
    return AutomationService.instance;
  }

  public startScheduler(client: Client): void {
    if (this.intervalTimer) return;

    // Check scheduled automations every 60 seconds
    this.intervalTimer = setInterval(async () => {
      try {
        const activeRules = await AutomationRuleModel.find({
          enabled: true,
          trigger: 'SCHEDULED_INTERVAL'
        });

        for (const rule of activeRules) {
          const guild = client.guilds.cache.get(rule.guildId);
          if (!guild) continue;

          if (rule.actionType === 'SEND_ANNOUNCEMENT') {
            const channelId = rule.actionPayload?.channelId;
            const message = rule.actionPayload?.message;
            if (channelId && message) {
              const channel = guild.channels.cache.get(channelId) as TextChannel;
              if (channel && channel.isTextBased()) {
                await channel.send({ content: message }).catch(() => null);
                rule.lastRunAt = new Date();
                await rule.save();
              }
            }
          }
        }
      } catch (err) {
        console.error('[AUTOMATION SERVICE] Error running scheduler:', err);
      }
    }, 60000);
  }

  public stopScheduler(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }
}
