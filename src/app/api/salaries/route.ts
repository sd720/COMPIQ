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

    const validSortCols: Record<string, string> = {
      totalCompensation: '"totalCompensation"',
      baseSalary: '"baseSalary"',
      yearsOfExperience: '"yearsOfExperience"',
      submittedAt: '"submittedAt"',
    };
    const orderCol = validSortCols[sortBy] ?? '"totalCompensation"';

    const sql = getDb();

    // Build WHERE conditions using parameterized queries
    const conditions: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (search) { conditions.push(`(se.role ILIKE $${i} OR c.name ILIKE $${i})`); values.push(`%${search}%`); i++; }
    if (company) { conditions.push(`c.name ILIKE $${i}`); values.push(`%${company}%`); i++; }
    if (roleCategory) { conditions.push(`se."roleCategory" = $${i}`); values.push(roleCategory); i++; }
    if (city) { conditions.push(`se.city::text = $${i}`); values.push(city); i++; }
    if (level) { conditions.push(`se.level ILIKE $${i}`); values.push(`%${level}%`); i++; }
    if (minTC > 0) { conditions.push(`se."totalCompensation" >= $${i}`); values.push(minTC); i++; }
    if (maxTC > 0) { conditions.push(`se."totalCompensation" <= $${i}`); values.push(maxTC); i++; }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const baseQ = `SELECT se.id, se.role, se."roleCategory", se.level, se."levelOrder", se."yearsOfExperience",
      se."baseSalary", se.bonus, se.equity, se."totalCompensation", se.city, se.verified, se."submittedAt",
      c.name as company_name, c.slug, c.logo
      FROM salary_entries se JOIN companies c ON se."companyId" = c.id ${whereClause}`;

    const [rows, countRows] = await Promise.all([
      sql.unsafe(`${baseQ} ORDER BY se.${orderCol} ${sortOrder} LIMIT $${i} OFFSET $${i+1}`, [...values, pageSize, offset]),
      sql.unsafe(`SELECT COUNT(*) as count FROM salary_entries se JOIN companies c ON se."companyId" = c.id ${whereClause}`, values),
    ]);

    const total = Number(countRows[0].count);
    const data = rows.map((r: Record<string, unknown>) => ({
      id: r.id, role: r.role, roleCategory: r.rolecategory ?? r.roleCategory,
      level: r.level, levelOrder: r.levelorder ?? r.levelOrder,
      yearsOfExperience: Number(r.yearsofexperience ?? r.yearsOfExperience),
      baseSalary: Number(r.basesalary ?? r.baseSalary), bonus: Number(r.bonus),
      equity: Number(r.equity),
      totalCompensation: Number(r.totalcompensation ?? r.totalCompensation),
      city: r.city, verified: r.verified, submittedAt: r.submittedat ?? r.submittedAt,
      company: { name: r.company_name, slug: r.slug, logo: r.logo },
    }));

    return NextResponse.json({ data, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) } });
  } catch (error) {
    console.error('[GET /api/salaries]', error);
    return NextResponse.json({ error: 'Failed to fetch salaries' }, { status: 500 });
  }
}
