import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const results: Record<string, unknown> = {
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
  };

  try {
    const sql = getDb();

    // Test exact salaries query
    const search = '';
    const sSearch = `%${search}%`;
    const company = '';
    const sCompany = `%${company}%`;
    const roleCategory = '';
    const city = '';
    const level = '';
    const sLevel = `%${level}%`;
    const minTCVal = 0;
    const maxTCVal = 99999999;
    const pageSize = 3;
    const offset = 0;

    const rows = await sql`
      SELECT se.id, se.role, se."roleCategory", se.level, se."levelOrder",
        se."yearsOfExperience", se."baseSalary", se.bonus, se.equity,
        se."totalCompensation", se.city, se.verified, se."submittedAt",
        c.name as company_name, c.slug, c.logo
      FROM salary_entries se JOIN companies c ON se."companyId" = c.id
      WHERE (${search} = '' OR se.role ILIKE ${sSearch} OR c.name ILIKE ${sSearch})
        AND (${company} = '' OR c.name ILIKE ${sCompany})
        AND (${roleCategory} = '' OR se."roleCategory"::text = ${roleCategory})
        AND (${city} = '' OR se.city::text = ${city})
        AND (${level} = '' OR se.level ILIKE ${sLevel})
        AND se."totalCompensation" >= ${minTCVal}
        AND se."totalCompensation" <= ${maxTCVal}
      ORDER BY se."totalCompensation" DESC
      LIMIT ${pageSize} OFFSET ${offset}`;

    results.salaryRows = rows;
    results.success = true;

  } catch (e) {
    results.error = String(e);
    results.errorStack = (e as Error).stack?.split('\n').slice(0, 5);
  }

  return NextResponse.json(results);
}
