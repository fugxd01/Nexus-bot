import { z } from 'zod';

export const EnvSchema = z.object({
  DISCORD_BOT_TOKEN: z.string().min(1, 'DISCORD_BOT_TOKEN is required for Discord bot operation'),
  DISCORD_CLIENT_ID: z.string().min(1, 'DISCORD_CLIENT_ID is required'),
  DISCORD_CLIENT_SECRET: z.string().optional(),
  DISCORD_REDIRECT_URI: z.string().default('http://localhost:3000/api/auth/callback'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required for persistent state and audit trails'),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().default('nexus_guard_super_secret_jwt_2026_default_key_change_in_prod'),
  SESSION_SECRET: z.string().default('nexus_guard_session_key_secret_2026_default_key'),
  DASHBOARD_URL: z.string().default('http://localhost:3000'),
  API_URL: z.string().default('http://localhost:4000'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  DEFAULT_PREFIX: z.string().default('!'),
  EMERGENCY_LOCKDOWN_OVERRIDE_KEY: z.string().default('nexus_lockdown_emergency_recovery_token')
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function loadConfig(): EnvConfig {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.warn('[CONFIG] Warning: Environment validation issues:', result.error.format());
    return {
      DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN || '',
      DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID || '',
      DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET || '',
      DISCORD_REDIRECT_URI: process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
      MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/nexus_guard',
      PORT: Number(process.env.PORT) || 4000,
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      JWT_SECRET: process.env.JWT_SECRET || 'nexus_guard_super_secret_jwt_2026_default_key',
      SESSION_SECRET: process.env.SESSION_SECRET || 'nexus_guard_session_key_secret_2026_default_key',
      DASHBOARD_URL: process.env.DASHBOARD_URL || 'http://localhost:3000',
      API_URL: process.env.API_URL || 'http://localhost:4000',
      CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
      DEFAULT_PREFIX: process.env.DEFAULT_PREFIX || '!',
      EMERGENCY_LOCKDOWN_OVERRIDE_KEY: process.env.EMERGENCY_LOCKDOWN_OVERRIDE_KEY || 'nexus_lockdown_emergency_recovery_token'
    };
  }
  return result.data;
}
