import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const sql = getDb();

    const companyRows = await sql`SELECT * FROM companies WHERE slug = ${slug} LIMIT 1`;
    if (!companyRows.length) return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    const company = companyRows[0];

    const [entries, levelStats, cityStats] = await Promise.all([
      sql`SELECT id, role, "roleCategory", level, "levelOrder", "yearsOfExperience", "baseSalary", bonus, equity, "totalCompensation", city, verified, "submittedAt"
          FROM salary_entries WHERE "companyId" = ${company.id} ORDER BY "totalCompensation" DESC LIMIT 100`,
      sql`SELECT level, "levelOrder", COUNT(*) as count,
          AVG("totalCompensation") as avg_tc, MAX("totalCompensation") as max_tc, MIN("totalCompensation") as min_tc,
          AVG("baseSalary") as avg_base, AVG(bonus) as avg_bonus, AVG(equity) as avg_equity
          FROM salary_entries WHERE "companyId" = ${company.id}
          GROUP BY level, "levelOrder" ORDER BY "levelOrder" ASC`,
      sql`SELECT city, COUNT(*) as count, AVG("totalCompensation") as avg_tc
          FROM salary_entries WHERE "companyId" = ${company.id}
          GROUP BY city ORDER BY count DESC`,
    ]);

    const totalEntries = entries.length;
    const avgTC = totalEntries > 0 ? entries.reduce((s: number, e: Record<string, unknown>) => s + Number(e.totalCompensation), 0) / totalEntries : 0;
    const tcs = entries.map((e: Record<string, unknown>) => Number(e.totalCompensation)).sort((a: number, b: number) => a - b);
    const medianTC = tcs.length > 0 ? tcs[Math.floor(tcs.length / 2)] : 0;

    return NextResponse.json({
      company: {
        ...company,
        entryCount: totalEntries,
        avgTC: Math.round(avgTC * 10) / 10,
        medianTC: Math.round(medianTC * 10) / 10,
      },
      levelBreakdown: levelStats.map((l: Record<string, unknown>) => ({
        level: l.level, levelOrder: Number(l.levelorder ?? l.levelOrder),
        count: Number(l.count),
        avgTC: Math.round(Number(l.avg_tc) * 10) / 10,
        maxTC: Math.round(Number(l.max_tc) * 10) / 10,
        minTC: Math.round(Number(l.min_tc) * 10) / 10,
        avgBase: Math.round(Number(l.avg_base) * 10) / 10,
        avgBonus: Math.round(Number(l.avg_bonus) * 10) / 10,
        avgEquity: Math.round(Number(l.avg_equity) * 10) / 10,
      })),
      cityBreakdown: cityStats.map((c: Record<string, unknown>) => ({
        city: c.city, count: Number(c.count), avgTC: Math.round(Number(c.avg_tc) * 10) / 10,
      })),
      recentEntries: entries.slice(0, 20),
    });
  } catch (error) {
    console.error('[GET /api/companies/slug]', error);
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 });
  }
}
