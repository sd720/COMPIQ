import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Papa from 'papaparse';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const text = await file.text();
    const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });

    const sql = getDb();
    let imported = 0;
    const errors: string[] = [];

    for (const row of data as Record<string, string>[]) {
      try {
        const companyName = row.company ?? row.Company ?? '';
        if (!companyName) continue;

        const companyRows = await sql`SELECT id FROM companies WHERE name ILIKE ${companyName} LIMIT 1`;
        if (!companyRows.length) { errors.push(`Company not found: ${companyName}`); continue; }

        const companyId = companyRows[0].id;
        const baseSalary = Number(row.baseSalary ?? row.base_salary ?? row['Base Salary'] ?? 0);
        const totalComp = Number(row.totalCompensation ?? row.total_compensation ?? row['Total Compensation'] ?? baseSalary);
        const city = (row.city ?? row.City ?? 'BANGALORE').toUpperCase().replace(/ /g, '_');
        const cityLabel = city.charAt(0) + city.slice(1).toLowerCase();
        const level = row.level ?? row.Level ?? 'Mid-Level';
        const role = row.role ?? row.Role ?? 'Software Engineer';

        await sql`INSERT INTO salary_entries (id, "companyId", role, "roleCategory", level, "levelOrder",
          "yearsOfExperience", "baseSalary", bonus, equity, "totalCompensation", city, location,
          "employmentType", verified, anonymous, "submittedAt")
          VALUES (gen_random_uuid(), ${companyId}, ${role}, 'SOFTWARE_ENGINEERING',
          ${level}, 3, ${Number(row.yearsOfExperience ?? row.yoe ?? 0)},
          ${baseSalary}, ${Number(row.bonus ?? 0)}, ${Number(row.equity ?? 0)},
          ${totalComp}, ${city}::"City", ${cityLabel}, 'FULL_TIME', false, true, NOW())`;
        imported++;
      } catch (e) {
        errors.push(`Row error: ${e}`);
      }
    }

    return NextResponse.json({ success: true, imported, errors: errors.slice(0, 5), total: data.length });
  } catch (error) {
    console.error('[POST /api/import]', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
