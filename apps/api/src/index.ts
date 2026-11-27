import express from 'express';
import http from 'http';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { loadConfig } from '@nexus-guard/config';
import { connectDatabase, disconnectDatabase } from '@nexus-guard/database';
import { apiRateLimit } from './middleware/rateLimit.js';
import { authRouter } from './routes/auth.js';
import { guildsRouter } from './routes/guilds.js';
import { securityRouter } from './routes/security.js';
import { moderationRouter } from './routes/moderation.js';
import { ticketsRouter } from './routes/tickets.js';
import { backupsRouter } from './routes/backups.js';
import { healthRouter } from './routes/health.js';

export function createApiApp() {
  const app = express();
  const config = loadConfig();

  app.use(cors({
    origin: [config.CORS_ORIGIN, config.DASHBOARD_URL, 'http://localhost:3000'],
    credentials: true
  }));

  app.use(express.json());
  app.use(apiRateLimit);

  // Mount API routers
  app.use('/api/auth', authRouter);
  app.use('/api/guilds', guildsRouter);
  app.use('/api/security', securityRouter);
  app.use('/api/moderation', moderationRouter);
  app.use('/api/tickets', ticketsRouter);
  app.use('/api/backups', backupsRouter);
  app.use('/api/health', healthRouter);

  // Fallback 404
  app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found.' });
  });

  return app;
}

export async function startServer() {
  const config = loadConfig();
  const app = createApiApp();
  const server = http.createServer(app);

  // Real-time WebSocket Gateway
  const wss = new WebSocketServer({ server, path: '/ws' });
  const activeSockets = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    activeSockets.add(ws);
    ws.send(JSON.stringify({ type: 'GATEWAY_HELLO', version: '1.0.0', message: 'Connected to NEXUS GUARD Realtime Core' }));

    ws.on('close', () => {
      activeSockets.delete(ws);
    });
  });

  // Global broadcast helper
  (global as any).broadcastSecurityAlert = (payload: any) => {
    const data = JSON.stringify({ type: 'SECURITY_ALERT', payload });
    for (const ws of activeSockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  };

  // Connect database
  try {
    await connectDatabase({ uri: config.MONGODB_URI });
  } catch (err: any) {
    console.warn(`[NEXUS GUARD API] DB connection failed: ${err.message}. Running degraded.`);
  }

  const port = config.PORT || 4000;
  server.listen(port, () => {
    console.log(`==================================================`);
    console.log(`🌐 NEXUS GUARD API & WEBSOCKET ENGINE ACTIVE`);
    console.log(`📍 Listening on http://localhost:${port}`);
    console.log(`⚡ WebSocket Stream: ws://localhost:${port}/ws`);
    console.log(`==================================================`);
  });

  const shutdown = async () => {
    console.log('\n[API] Shutting down HTTP and WebSocket servers...');
    server.close();
    await disconnectDatabase();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return { app, server, wss };
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('API Server failed to start:', err);
  });
}
