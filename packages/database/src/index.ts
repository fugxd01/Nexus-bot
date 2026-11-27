import mongoose from 'mongoose';

export * from './models/Guild.js';
export * from './models/User.js';
export * from './models/ModerationCase.js';
export * from './models/SecurityIncident.js';
export * from './models/SecurityAuditLog.js';
export * from './models/Ticket.js';
export * from './models/Backup.js';
export * from './models/AutomodRule.js';
export * from './models/AutomationRule.js';
export * from './models/Session.js';

let isConnected = false;

export interface DatabaseConnectionOptions {
  uri?: string;
  maxPoolSize?: number;
  minPoolSize?: number;
  serverSelectionTimeoutMS?: number;
  autoIndex?: boolean;
}

export async function connectDatabase(options: DatabaseConnectionOptions = {}): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const uri = options.uri || process.env.MONGODB_URI;
  if (!uri) {
    console.warn('[NEXUS GUARD DB] Warning: MONGODB_URI not provided. Running with in-memory or degraded state.');
    return mongoose;
  }

  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: options.maxPoolSize || 10,
      minPoolSize: options.minPoolSize || 2,
      serverSelectionTimeoutMS: options.serverSelectionTimeoutMS || 5000,
      autoIndex: options.autoIndex ?? true
    });

    isConnected = true;
    console.log('[NEXUS GUARD DB] Connected to MongoDB Atlas successfully.');

    mongoose.connection.on('error', (err) => {
      console.error('[NEXUS GUARD DB] MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[NEXUS GUARD DB] MongoDB connection disconnected. Attempting reconnect...');
      isConnected = false;
    });

    return conn;
  } catch (error) {
    console.error('[NEXUS GUARD DB] Failed to connect to MongoDB Atlas:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[NEXUS GUARD DB] Disconnected from MongoDB.');
  }
}
