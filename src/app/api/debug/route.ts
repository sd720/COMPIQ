import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const results: Record<string, unknown> = {
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
  };

  try {
    const sql = getDb();
    // Test 1: simple count
    const count = await sql`SELECT COUNT(*) as c FROM salary_entries`;
    results.salaryCount = count[0].c;

    // Test 2: simple select
    const rows = await sql`SELECT id, role, "totalCompensation", city FROM salary_entries ORDER BY "totalCompensation" DESC LIMIT 3`;
    results.topSalaries = rows;

    // Test 3: with filter
    const filtered = await sql`SELECT COUNT(*) as c FROM salary_entries se JOIN companies c ON se."companyId" = c.id WHERE (${''}  = '' OR se.role ILIKE ${'%'})`;
    results.filteredCount = filtered[0].c;

  } catch (e) {
    results.error = String(e);
    results.errorStack = (e as Error).stack;
  }

  return NextResponse.json(results);
}
