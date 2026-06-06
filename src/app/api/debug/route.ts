import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    DATABASE_URL: process.env.DATABASE_URL ? 'SET (' + process.env.DATABASE_URL.substring(0, 30) + '...)' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    keys: Object.keys(process.env).filter(k => k.includes('DATA') || k.includes('NEON') || k.includes('NEXT')),
  });
}
