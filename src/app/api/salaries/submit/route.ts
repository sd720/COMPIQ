import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { companySlug, role, roleCategory, level, levelOrder, yearsOfExperience,
      baseSalary, bonus, equity, totalCompensation, city, employmentType } = body;

    if (!companySlug || !role || !level || !baseSalary || !totalCompensation || !city) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sql = getDb();
    const companyRows = await sql`SELECT id FROM companies WHERE slug = ${companySlug} LIMIT 1`;
    if (!companyRows.length) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const companyId = companyRows[0].id;
    const userId = session?.user ? (session.user as { id?: string }).id ?? null : null;
    const cityLabel = city.charAt(0) + city.slice(1).toLowerCase();

    await sql`INSERT INTO salary_entries (id, "companyId", role, "roleCategory", level, "levelOrder",
      "yearsOfExperience", "baseSalary", bonus, equity, "totalCompensation", city, location,
      "employmentType", verified, anonymous, "userId", "submittedAt")
      VALUES (gen_random_uuid(), ${companyId}, ${role}, ${roleCategory ?? 'SOFTWARE_ENGINEERING'},
      ${level}, ${levelOrder ?? 3}, ${yearsOfExperience ?? 0}, ${baseSalary}, ${bonus ?? 0},
      ${equity ?? 0}, ${totalCompensation}, ${city}::"City", ${cityLabel},
      ${employmentType ?? 'FULL_TIME'}, false, ${userId ? false : true}, ${userId}, NOW())`;

    return NextResponse.json({ success: true, message: 'Salary submitted successfully!' });
  } catch (error) {
    console.error('[POST /api/salaries/submit]', error);
    return NextResponse.json({ error: 'Failed to submit salary' }, { status: 500 });
  }
}
