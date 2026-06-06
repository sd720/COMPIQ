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
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'ASC' : 'DESC';
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const pageSize = Math.min(50, Number(searchParams.get('pageSize') ?? 20));
    const offset = (page - 1) * pageSize;

    // Whitelist sort columns to prevent injection
    const validSortCols: Record<string, string> = {
      totalCompensation: '"totalCompensation"',
      baseSalary: '"baseSalary"',
      yearsOfExperience: '"yearsOfExperience"',
      submittedAt: '"submittedAt"',
    };
    const orderCol = validSortCols[sortBy] ?? '"totalCompensation"';
    const orderDir = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const sql = getDb();
    const sSearch = search ? `%${search}%` : null;
    const sCompany = company ? `%${company}%` : null;
    const sLevel = level ? `%${level}%` : null;
    const effectiveMinTC = minTC > 0 ? minTC : 0;
    const effectiveMaxTC = maxTC > 0 ? maxTC : 9999999;

    // Build WHERE conditions
    const conditions: string[] = [
      'se."totalCompensation" >= $1',
      '($2 = 9999999 OR se."totalCompensation" <= $2)',
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values: any[] = [effectiveMinTC, effectiveMaxTC];
    let idx = 3;

    if (sSearch) { conditions.push(`(se.role ILIKE $${idx} OR c.name ILIKE $${idx})`); values.push(sSearch); idx++; }
    if (sCompany) { conditions.push(`c.name ILIKE $${idx}`); values.push(sCompany); idx++; }
    if (roleCategory) { conditions.push(`se."roleCategory" = $${idx}`); values.push(roleCategory); idx++; }
    if (city) { conditions.push(`se.city::text = $${idx}`); values.push(city); idx++; }
    if (sLevel) { conditions.push(`se.level ILIKE $${idx}`); values.push(sLevel); idx++; }

    const whereSQL = conditions.join(' AND ');

    const dataQuery = `
      SELECT se.id, se.role, se."roleCategory", se.level, se."levelOrder",
        se."yearsOfExperience", se."baseSalary", se.bonus, se.equity,
        se."totalCompensation", se.city, se.verified, se."submittedAt",
        c.name as company_name, c.slug, c.logo
      FROM salary_entries se JOIN companies c ON se."companyId" = c.id
      WHERE ${whereSQL}
      ORDER BY se.${orderCol} ${orderDir}
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    const countQuery = `
      SELECT COUNT(*) as count
      FROM salary_entries se JOIN companies c ON se."companyId" = c.id
      WHERE ${whereSQL}
    `;

    // Use neon as a plain function call: sql(text, params[])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sqlFn = sql as any;
    const [rows, countRows] = await Promise.all([
      sqlFn(dataQuery, [...values, pageSize, offset]),
      sqlFn(countQuery, values),
    ]);

    const total = Number(countRows[0].count);
    const data = rows.map((r: Record<string, unknown>) => ({
      id: r.id, role: r.role,
      roleCategory: r.rolecategory ?? r.roleCategory,
      level: r.level,
      levelOrder: r.levelorder ?? r.levelOrder,
      yearsOfExperience: Number(r.yearsofexperience ?? r.yearsOfExperience),
      baseSalary: Number(r.basesalary ?? r.baseSalary),
      bonus: Number(r.bonus),
      equity: Number(r.equity),
      totalCompensation: Number(r.totalcompensation ?? r.totalCompensation),
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
    return NextResponse.json({ error: 'Failed to fetch salaries' }, { status: 500 });
  }
}
