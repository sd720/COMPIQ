import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slugs = searchParams.getAll('slugs').length > 0
      ? searchParams.getAll('slugs')
      : (searchParams.get('slugs') ?? '').split(',').filter(Boolean);

    if (!slugs.length) return NextResponse.json({ error: 'No company slugs provided' }, { status: 400 });

    const sql = getDb();
    const results = await Promise.all(slugs.slice(0, 3).map(async (slug) => {
      const companyRows = await sql`SELECT * FROM companies WHERE slug = ${slug.trim()} LIMIT 1`;
      if (!companyRows.length) return null;
      const company = companyRows[0];

      const levelStats = await sql`SELECT level, "levelOrder",
        COUNT(*) as count, AVG("totalCompensation") as avg_tc, MAX("totalCompensation") as max_tc,
        AVG("baseSalary") as avg_base, AVG(bonus) as avg_bonus, AVG(equity) as avg_equity
        FROM salary_entries WHERE "companyId" = ${company.id}
        GROUP BY level, "levelOrder" ORDER BY "levelOrder" ASC`;

      const overall = await sql`SELECT COUNT(*) as count, AVG("totalCompensation") as avg_tc,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "totalCompensation") as median_tc,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "baseSalary") as median_base,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY bonus) as median_bonus,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY equity) as median_equity,
        MAX("totalCompensation") as max_tc
        FROM salary_entries WHERE "companyId" = ${company.id}`;

      return {
        company: { id: company.id, name: company.name, slug: company.slug, logo: company.logo, industry: company.industry, size: company.size },
        stats: {
          entryCount: Number(overall[0].count),
          avgTC: Math.round(Number(overall[0].avg_tc || 0) * 10) / 10,
          medianTC: Math.round(Number(overall[0].median_tc || 0) * 10) / 10,
          maxTC: Math.round(Number(overall[0].max_tc || 0) * 10) / 10,
          medianBase: Math.round(Number(overall[0].median_base || 0) * 10) / 10,
          medianBonus: Math.round(Number(overall[0].median_bonus || 0) * 10) / 10,
          medianEquity: Math.round(Number(overall[0].median_equity || 0) * 10) / 10,
        },
        levels: levelStats.map((l: Record<string, unknown>) => ({
          level: l.level, levelOrder: Number(l.levelorder ?? l.levelOrder),
          count: Number(l.count),
          avgTC: Math.round(Number(l.avg_tc) * 10) / 10,
          maxTC: Math.round(Number(l.max_tc) * 10) / 10,
          avgBase: Math.round(Number(l.avg_base) * 10) / 10,
          avgBonus: Math.round(Number(l.avg_bonus) * 10) / 10,
          avgEquity: Math.round(Number(l.avg_equity) * 10) / 10,
        })),
      };
    }));

    return NextResponse.json({ data: results.filter(Boolean) });
  } catch (error) {
    console.error('[GET /api/compare]', error);
    return NextResponse.json({ error: 'Comparison failed' }, { status: 500 });
  }
}
