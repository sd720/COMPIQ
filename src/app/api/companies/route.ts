import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') ?? '';
    const industry = searchParams.get('industry') ?? undefined;
    const page = Number(searchParams.get('page') ?? 1);
    const pageSize = Number(searchParams.get('pageSize') ?? 20);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (industry) where.industry = { contains: industry, mode: 'insensitive' };

    const [total, companies] = await Promise.all([
      prisma.company.count({ where }),
      prisma.company.findMany({
        where,
        include: {
          _count: { select: { salaryEntries: true } },
          salaryEntries: {
            select: { totalCompensation: true, baseSalary: true },
          },
        },
        orderBy: { salaryEntries: { _count: 'desc' } },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const enriched = companies.map((c) => {
      const tcs = c.salaryEntries.map((e) => e.totalCompensation);
      const avgTC = tcs.length ? tcs.reduce((a, b) => a + b, 0) / tcs.length : 0;
      const maxTC = tcs.length ? Math.max(...tcs) : 0;
      const medianTC = tcs.length
        ? [...tcs].sort((a, b) => a - b)[Math.floor(tcs.length / 2)]
        : 0;
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        logo: c.logo,
        industry: c.industry,
        hqLocation: c.hqLocation,
        size: c.size,
        website: c.website,
        entryCount: c._count.salaryEntries,
        avgTC: Math.round(avgTC * 10) / 10,
        maxTC: Math.round(maxTC * 10) / 10,
        medianTC: Math.round(medianTC * 10) / 10,
      };
    });

    return NextResponse.json({
      data: enriched,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('[GET /api/companies]', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}
