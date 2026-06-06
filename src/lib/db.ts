import { neon } from '@neondatabase/serverless';

// HTTP-based SQL client — works on Vercel serverless, no WebSocket or TCP needed
export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return neon(url);
}
