import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const company = await prisma.company.findUnique({
      where: { slug },
      include: {
        salaryEntries: {
          orderBy: { levelOrder: 'asc' },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Build level progression data
    const levelGroups: Record<string, number[]> = {};
    const roleGroups: Record<string, { total: number; count: number }> = {};
    const cityGroups: Record<string, number> = {};

    for (const entry of company.salaryEntries) {
      if (!levelGroups[entry.level]) levelGroups[entry.level] = [];
      levelGroups[entry.level].push(entry.totalCompensation);

      if (!roleGroups[entry.role]) roleGroups[entry.role] = { total: 0, count: 0 };
      roleGroups[entry.role].total += entry.totalCompensation;
      roleGroups[entry.role].count++;

      cityGroups[entry.city] = (cityGroups[entry.city] ?? 0) + 1;
    }

    const levelProgression = Object.entries(levelGroups)
      .map(([level, tcs]) => ({
        level,
        levelOrder: company.salaryEntries.find((e) => e.level === level)?.levelOrder ?? 5,
        medianTC: [...tcs].sort((a, b) => a - b)[Math.floor(tcs.length / 2)],
        avgTC: tcs.reduce((a, b) => a + b, 0) / tcs.length,
        p25: [...tcs].sort((a, b) => a - b)[Math.floor(tcs.length * 0.25)] ?? tcs[0],
        p75: [...tcs].sort((a, b) => a - b)[Math.floor(tcs.length * 0.75)] ?? tcs[tcs.length - 1],
        count: tcs.length,
      }))
      .sort((a, b) => a.levelOrder - b.levelOrder);

    const roleBreakdown = Object.entries(roleGroups)
      .map(([role, { total, count }]) => ({
        role,
        avgTC: Math.round((total / count) * 10) / 10,
        count,
      }))
      .sort((a, b) => b.avgTC - a.avgTC);

    const allTCs = company.salaryEntries.map((e) => e.totalCompensation);
    const stats = {
      entryCount: allTCs.length,
      avgTC: allTCs.length ? Math.round((allTCs.reduce((a, b) => a + b, 0) / allTCs.length) * 10) / 10 : 0,
      medianTC: allTCs.length ? Math.round([...allTCs].sort((a, b) => a - b)[Math.floor(allTCs.length / 2)] * 10) / 10 : 0,
      maxTC: allTCs.length ? Math.round(Math.max(...allTCs) * 10) / 10 : 0,
      minTC: allTCs.length ? Math.round(Math.min(...allTCs) * 10) / 10 : 0,
    };

    return NextResponse.json({
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        logo: company.logo,
        industry: company.industry,
        hqLocation: company.hqLocation,
        size: company.size,
        website: company.website,
        description: company.description,
        foundedYear: company.foundedYear,
      },
      stats,
      levelProgression,
      roleBreakdown,
      cityDistribution: Object.entries(cityGroups).map(([city, count]) => ({ city, count })),
      recentEntries: company.salaryEntries.slice(-10).reverse(),
    });
  } catch (error) {
    console.error('[GET /api/companies/[slug]]', error);
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 });
  }
}
