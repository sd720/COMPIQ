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
    const maxTC = Number(searchParams.get('maxTC') ?? 999999);
    const sortBy = searchParams.get('sortBy') ?? 'totalCompensation';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'ASC' : 'DESC';
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const pageSize = Math.min(50, Number(searchParams.get('pageSize') ?? 20));
    const offset = (page - 1) * pageSize;

    const validSortCols: Record<string, string> = {
      totalCompensation: '"totalCompensation"',
      baseSalary: '"baseSalary"',
      yearsOfExperience: '"yearsOfExperience"',
      submittedAt: '"submittedAt"',
    };
    const orderCol = validSortCols[sortBy] ?? '"totalCompensation"';

    const sql = getDb();
    const sSearch = search ? `%${search}%` : '%';
    const sCompany = company ? `%${company}%` : '%';
    const sLevel = level ? `%${level}%` : '%';
    const effectiveMinTC = minTC > 0 ? minTC : 0;
    const effectiveMaxTC = maxTC > 0 ? maxTC : 9999999;

    // Use neon unsafe with a single string — build query without external params
    // by using template literals for safe interpolation of all filter values
    const [rows, countRows] = await Promise.all([
      sql`SELECT se.id, se.role, se."roleCategory", se.level, se."levelOrder",
          se."yearsOfExperience", se."baseSalary", se.bonus, se.equity,
          se."totalCompensation", se.city, se.verified, se."submittedAt",
          c.name as company_name, c.slug, c.logo
          FROM salary_entries se JOIN companies c ON se."companyId" = c.id
          WHERE (${search} = '' OR se.role ILIKE ${sSearch} OR c.name ILIKE ${sSearch})
          AND (${company} = '' OR c.name ILIKE ${sCompany})
          AND (${roleCategory} = '' OR se."roleCategory" = ${roleCategory})
          AND (${city} = '' OR se.city::text = ${city})
          AND (${level} = '' OR se.level ILIKE ${sLevel})
          AND se."totalCompensation" >= ${effectiveMinTC}
          AND (${effectiveMaxTC} = 9999999 OR se."totalCompensation" <= ${effectiveMaxTC})
          ORDER BY se.${sql.unsafe(orderCol)} ${sql.unsafe(sortOrder)}
          LIMIT ${pageSize} OFFSET ${offset}`,
      sql`SELECT COUNT(*) as count
          FROM salary_entries se JOIN companies c ON se."companyId" = c.id
          WHERE (${search} = '' OR se.role ILIKE ${sSearch} OR c.name ILIKE ${sSearch})
          AND (${company} = '' OR c.name ILIKE ${sCompany})
          AND (${roleCategory} = '' OR se."roleCategory" = ${roleCategory})
          AND (${city} = '' OR se.city::text = ${city})
          AND (${level} = '' OR se.level ILIKE ${sLevel})
          AND se."totalCompensation" >= ${effectiveMinTC}
          AND (${effectiveMaxTC} = 9999999 OR se."totalCompensation" <= ${effectiveMaxTC})`,
    ]);

    const total = Number(countRows[0].count);
    const data = rows.map((r: Record<string, unknown>) => ({
      id: r.id, role: r.role,
      roleCategory: r.rolecategory ?? r.roleCategory,
      level: r.level, levelOrder: r.levelorder ?? r.levelOrder,
      yearsOfExperience: Number(r.yearsofexperience ?? r.yearsOfExperience),
      baseSalary: Number(r.basesalary ?? r.baseSalary),
      bonus: Number(r.bonus), equity: Number(r.equity),
      totalCompensation: Number(r.totalcompensation ?? r.totalCompensation),
      city: r.city, verified: r.verified,
      submittedAt: r.submittedat ?? r.submittedAt,
      company: { name: r.company_name, slug: r.slug, logo: r.logo },
    }));

    return NextResponse.json({ data, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) } });
  } catch (error) {
    console.error('[GET /api/salaries]', error);
    return NextResponse.json({ error: 'Failed to fetch salaries' }, { status: 500 });
  }
}
