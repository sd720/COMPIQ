import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slugs = searchParams.getAll('slugs'); // e.g. ?slugs=google&slugs=amazon
    const role = searchParams.get('role') ?? undefined;
    const level = searchParams.get('level') ?? undefined;

    if (!slugs.length || slugs.length < 2) {
      return NextResponse.json({ error: 'At least 2 company slugs required' }, { status: 400 });
    }
    if (slugs.length > 3) {
      return NextResponse.json({ error: 'Maximum 3 companies for comparison' }, { status: 400 });
    }

    const companies = await prisma.company.findMany({
      where: { slug: { in: slugs } },
    });

    const companyMap: Record<string, typeof companies[0]> = {};
    for (const c of companies) companyMap[c.slug] = c;

    const results = await Promise.all(
      slugs.map(async (slug) => {
        const company = companyMap[slug];
        if (!company) return null;

        const where: Record<string, unknown> = { companyId: company.id };
        if (role) where.role = { contains: role, mode: 'insensitive' };
        if (level) where.level = { contains: level, mode: 'insensitive' };

        const entries = await prisma.salaryEntry.findMany({ where });

        if (!entries.length) return { company: { id: company.id, name: company.name, slug: company.slug, logo: company.logo }, stats: null, levelBreakdown: [] };

        const tcs = entries.map((e) => e.totalCompensation);
        const bases = entries.map((e) => e.baseSalary);
        const bonuses = entries.map((e) => e.bonus);
        const equities = entries.map((e) => e.equity);

        const median = (arr: number[]) => {
          const s = [...arr].sort((a, b) => a - b);
          return s[Math.floor(s.length / 2)];
        };

        // Level breakdown
        const levelGroups: Record<string, number[]> = {};
        for (const e of entries) {
          if (!levelGroups[e.level]) levelGroups[e.level] = [];
          levelGroups[e.level].push(e.totalCompensation);
        }

        return {
          company: { id: company.id, name: company.name, slug: company.slug, logo: company.logo, industry: company.industry },
          stats: {
            count: entries.length,
            medianTC: Math.round(median(tcs) * 10) / 10,
            avgTC: Math.round((tcs.reduce((a, b) => a + b, 0) / tcs.length) * 10) / 10,
            maxTC: Math.round(Math.max(...tcs) * 10) / 10,
            medianBase: Math.round(median(bases) * 10) / 10,
            medianBonus: Math.round(median(bonuses) * 10) / 10,
            medianEquity: Math.round(median(equities) * 10) / 10,
          },
          levelBreakdown: Object.entries(levelGroups)
            .map(([level, arr]) => ({
              level,
              medianTC: Math.round(median(arr) * 10) / 10,
              count: arr.length,
              levelOrder: entries.find((e) => e.level === level)?.levelOrder ?? 5,
            }))
            .sort((a, b) => a.levelOrder - b.levelOrder),
        };
      })
    );

    return NextResponse.json({ data: results.filter(Boolean) });
  } catch (error) {
    console.error('[GET /api/compare]', error);
    return NextResponse.json({ error: 'Comparison failed' }, { status: 500 });
  }
}
