import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
}

function getPrisma(): PrismaClient {
  if (global._prisma) return global._prisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not defined');

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 1, // Serverless: limit connections
  });

  const adapter = new PrismaPg(pool);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = new PrismaClient({ adapter: adapter as any });

  if (process.env.NODE_ENV !== 'production') {
    global._prisma = client;
  }

  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrisma() as Record<string | symbol, unknown>)[prop];
  },
});
