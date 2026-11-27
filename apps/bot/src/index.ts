import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { loadConfig } from '@nexus-guard/config';
import { connectDatabase, disconnectDatabase } from '@nexus-guard/database';
import { registerBotEvents } from './events/index.js';

export function createBotClient(): Client {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates
    ],
    partials: [
      Partials.Channel,
      Partials.Message,
      Partials.User,
      Partials.GuildMember
    ],
    // Low resource optimizations for free hosting panels
    sweepers: {
      messages: {
        interval: 300, // 5 minutes
        lifetime: 1800 // 30 minutes
      }
    }
  });
}

export async function startBot(): Promise<Client | null> {
  console.log('==================================================');
  console.log('🚀 STARTING NEXUS GUARD BOT CORE');
  console.log('==================================================');

  const config = loadConfig();

  // Validate Bot Token
  if (!config.DISCORD_BOT_TOKEN || config.DISCORD_BOT_TOKEN === 'your_bot_token_here') {
    console.error('\n❌ CRITICAL CONFIGURATION ERROR: DISCORD_BOT_TOKEN is missing or empty.');
    console.error('Please configure DISCORD_BOT_TOKEN in your .env file or hosting panel environment variables.');
    console.error('Example: DISCORD_BOT_TOKEN=MTE5OTg0...\n');
    return null;
  }

  // Connect to Database
  try {
    await connectDatabase({ uri: config.MONGODB_URI });
  } catch (err: any) {
    console.warn(`[NEXUS GUARD DB] Database connection failure: ${err.message}. Continuing in degraded mode.`);
  }

  const client = createBotClient();
  registerBotEvents(client);

  // Error handling
  client.on('error', (err) => {
    console.error('[NEXUS GUARD BOT] Client error event:', err);
  });

  client.on('shardDisconnect', (event, id) => {
    console.warn(`[NEXUS GUARD BOT] Shard ${id} disconnected (${event.code}). Auto-reconnect active.`);
  });

  client.on('shardReconnecting', (id) => {
    console.log(`[NEXUS GUARD BOT] Shard ${id} reconnecting to Discord Gateway...`);
  });

  // Login
  try {
    await client.login(config.DISCORD_BOT_TOKEN);
    console.log('✅ NEXUS GUARD Discord Gateway handshake successful.');
  } catch (loginErr: any) {
    console.error(`❌ Discord login failed: ${loginErr.message}`);
    return null;
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[NEXUS GUARD BOT] Received ${signal}. Initiating graceful shutdown...`);
    try {
      client.destroy();
      await disconnectDatabase();
      console.log('✅ Clean shutdown complete.');
      process.exit(0);
    } catch (e) {
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return client;
}

// Auto-run if executed directly
if (process.env.NODE_ENV !== 'test') {
  startBot().catch((err) => {
    console.error('Fatal bot bootstrap error:', err);
  });
}
