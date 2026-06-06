import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') ?? '';
    const company = searchParams.get('company') ?? '';
    const roleCategory = searchParams.get('roleCategory') ?? '';
    const city = searchParams.get('city') ?? '';
    const level = searchParams.get('level') ?? '';
    const minTC = Number(searchParams.get('minTC') ?? 0);
    const maxTC = Number(searchParams.get('maxTC') ?? 0);
    const sortBy = searchParams.get('sortBy') ?? 'totalCompensation';
    const sortDesc = searchParams.get('sortOrder') !== 'asc';
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const pageSize = Math.min(50, Number(searchParams.get('pageSize') ?? 20));
    const offset = (page - 1) * pageSize;

    const sql = getDb();

    // Use optional chaining pattern: if filter is empty, OR always-true condition
    const sSearch = `%${search || ''}%`;
    const sCompany = `%${company || ''}%`;
    const sLevel = `%${level || ''}%`;
    const minTCVal = minTC > 0 ? minTC : 0;
    const maxTCVal = maxTC > 0 ? maxTC : 99999999;

    // Fetch with all filters as template literal (neon safe)
    let rows, countRows;

    if (sortDesc) {
      [rows, countRows] = await Promise.all([
        sql`SELECT se.id, se.role, se."roleCategory", se.level, se."levelOrder",
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
            LIMIT ${pageSize} OFFSET ${offset}`,
        sql`SELECT COUNT(*) as count FROM salary_entries se JOIN companies c ON se."companyId" = c.id
            WHERE (${search} = '' OR se.role ILIKE ${sSearch} OR c.name ILIKE ${sSearch})
            AND (${company} = '' OR c.name ILIKE ${sCompany})
            AND (${roleCategory} = '' OR se."roleCategory"::text = ${roleCategory})
            AND (${city} = '' OR se.city::text = ${city})
            AND (${level} = '' OR se.level ILIKE ${sLevel})
            AND se."totalCompensation" >= ${minTCVal}
            AND se."totalCompensation" <= ${maxTCVal}`,
      ]);
    } else {
      [rows, countRows] = await Promise.all([
        sql`SELECT se.id, se.role, se."roleCategory", se.level, se."levelOrder",
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
            ORDER BY se."totalCompensation" ASC
            LIMIT ${pageSize} OFFSET ${offset}`,
        sql`SELECT COUNT(*) as count FROM salary_entries se JOIN companies c ON se."companyId" = c.id
            WHERE (${search} = '' OR se.role ILIKE ${sSearch} OR c.name ILIKE ${sSearch})
            AND (${company} = '' OR c.name ILIKE ${sCompany})
            AND (${roleCategory} = '' OR se."roleCategory"::text = ${roleCategory})
            AND (${city} = '' OR se.city::text = ${city})
            AND (${level} = '' OR se.level ILIKE ${sLevel})
            AND se."totalCompensation" >= ${minTCVal}
            AND se."totalCompensation" <= ${maxTCVal}`,
      ]);
    }

    const total = Number(countRows[0].count);
    const data = rows.map((r: Record<string, unknown>) => ({
      id: r.id, role: r.role,
      roleCategory: r.rolecategory ?? r.roleCategory,
      level: r.level,
      levelOrder: Number(r.levelorder ?? r.levelOrder ?? 3),
      yearsOfExperience: Number(r.yearsofexperience ?? r.yearsOfExperience ?? 0),
      baseSalary: Number(r.basesalary ?? r.baseSalary ?? 0),
      bonus: Number(r.bonus ?? 0),
      equity: Number(r.equity ?? 0),
      totalCompensation: Number(r.totalcompensation ?? r.totalCompensation ?? 0),
      city: r.city,
      verified: r.verified,
      submittedAt: r.submittedat ?? r.submittedAt,
      company: { name: r.company_name, slug: r.slug, logo: r.logo },
    }));

    return NextResponse.json({
      data,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('[GET /api/salaries]', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
