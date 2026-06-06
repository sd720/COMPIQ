import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') ?? '';
    const industry = searchParams.get('industry') ?? '';
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const pageSize = Math.min(50, Number(searchParams.get('pageSize') ?? 20));
    const offset = (page - 1) * pageSize;
    const sql = getDb();

    let rows, countRow;
    if (search && industry) {
      const s = `%${search}%`; const ind = `%${industry}%`;
      [rows, countRow] = await Promise.all([
        sql`SELECT c.id, c.name, c.slug, c.logo, c.industry, c."hqLocation", c.size, c.website,
            COUNT(se.id) as entry_count,
            AVG(se."totalCompensation") as avg_tc,
            MAX(se."totalCompensation") as max_tc,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY se."totalCompensation") as median_tc
            FROM companies c LEFT JOIN salary_entries se ON se."companyId" = c.id
            WHERE (c.name ILIKE ${s} OR c.industry ILIKE ${s}) AND c.industry ILIKE ${ind}
            GROUP BY c.id ORDER BY entry_count DESC LIMIT ${pageSize} OFFSET ${offset}`,
        sql`SELECT COUNT(*) as count FROM companies WHERE (name ILIKE ${s} OR industry ILIKE ${s}) AND industry ILIKE ${ind}`,
      ]);
    } else if (search) {
      const s = `%${search}%`;
      [rows, countRow] = await Promise.all([
        sql`SELECT c.id, c.name, c.slug, c.logo, c.industry, c."hqLocation", c.size, c.website,
            COUNT(se.id) as entry_count, AVG(se."totalCompensation") as avg_tc,
            MAX(se."totalCompensation") as max_tc,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY se."totalCompensation") as median_tc
            FROM companies c LEFT JOIN salary_entries se ON se."companyId" = c.id
            WHERE c.name ILIKE ${s} OR c.industry ILIKE ${s}
            GROUP BY c.id ORDER BY entry_count DESC LIMIT ${pageSize} OFFSET ${offset}`,
        sql`SELECT COUNT(*) as count FROM companies WHERE name ILIKE ${s} OR industry ILIKE ${s}`,
      ]);
    } else if (industry) {
      const ind = `%${industry}%`;
      [rows, countRow] = await Promise.all([
        sql`SELECT c.id, c.name, c.slug, c.logo, c.industry, c."hqLocation", c.size, c.website,
            COUNT(se.id) as entry_count, AVG(se."totalCompensation") as avg_tc,
            MAX(se."totalCompensation") as max_tc,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY se."totalCompensation") as median_tc
            FROM companies c LEFT JOIN salary_entries se ON se."companyId" = c.id
            WHERE c.industry ILIKE ${ind}
            GROUP BY c.id ORDER BY entry_count DESC LIMIT ${pageSize} OFFSET ${offset}`,
        sql`SELECT COUNT(*) as count FROM companies WHERE industry ILIKE ${ind}`,
      ]);
    } else {
      [rows, countRow] = await Promise.all([
        sql`SELECT c.id, c.name, c.slug, c.logo, c.industry, c."hqLocation", c.size, c.website,
            COUNT(se.id) as entry_count, AVG(se."totalCompensation") as avg_tc,
            MAX(se."totalCompensation") as max_tc,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY se."totalCompensation") as median_tc
            FROM companies c LEFT JOIN salary_entries se ON se."companyId" = c.id
            GROUP BY c.id ORDER BY entry_count DESC LIMIT ${pageSize} OFFSET ${offset}`,
        sql`SELECT COUNT(*) as count FROM companies`,
      ]);
    }

    const total = Number(countRow[0].count);
    const data = rows.map((r: Record<string, unknown>) => ({
      id: r.id, name: r.name, slug: r.slug, logo: r.logo,
      industry: r.industry, hqLocation: r.hqlocation ?? r.hqLocation,
      size: r.size, website: r.website,
      entryCount: Number(r.entry_count),
      avgTC: Math.round(Number(r.avg_tc || 0) * 10) / 10,
      maxTC: Math.round(Number(r.max_tc || 0) * 10) / 10,
      medianTC: Math.round(Number(r.median_tc || 0) * 10) / 10,
    }));

    return NextResponse.json({ data, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) } });
  } catch (error) {
    console.error('[GET /api/companies]', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}
