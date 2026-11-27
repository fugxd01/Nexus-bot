import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ONLINE',
    platform: 'Netlify Edge & Serverless SSR',
    service: 'NEXUS GUARD Dashboard & API Gateway',
    version: '1.0.0',
    database: {
      provider: 'MongoDB Atlas',
      tier: 'M0 (Free Shared Sandbox)',
      status: 'READY'
    },
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
}
