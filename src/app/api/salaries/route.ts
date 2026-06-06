import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { salaryFilterSchema } from '@/lib/validators';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawParams = {
      company: searchParams.get('company') ?? undefined,
      role: searchParams.get('role') ?? undefined,
      roleCategory: searchParams.get('roleCategory') ?? undefined,
      level: searchParams.get('level') ?? undefined,
      city: searchParams.get('city') ?? undefined,
      minYoe: searchParams.get('minYoe') ? Number(searchParams.get('minYoe')) : undefined,
      maxYoe: searchParams.get('maxYoe') ? Number(searchParams.get('maxYoe')) : undefined,
      minTC: searchParams.get('minTC') ? Number(searchParams.get('minTC')) : undefined,
      maxTC: searchParams.get('maxTC') ? Number(searchParams.get('maxTC')) : undefined,
      sortBy: (searchParams.get('sortBy') ?? 'totalCompensation') as 'totalCompensation' | 'baseSalary' | 'submittedAt' | 'yearsOfExperience',
      sortOrder: (searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc',
      page: Number(searchParams.get('page') ?? 1),
      pageSize: Number(searchParams.get('pageSize') ?? 25),
    };

    const params = salaryFilterSchema.parse(rawParams);

    const where: Record<string, unknown> = {};

    if (params.company) {
      where.company = {
        OR: [
          { name: { contains: params.company, mode: 'insensitive' } },
          { slug: { contains: params.company.toLowerCase() } },
        ],
      };
    }
    if (params.role) {
      where.role = { contains: params.role, mode: 'insensitive' };
    }
    if (params.roleCategory) {
      where.roleCategory = params.roleCategory;
    }
    if (params.level) {
      where.level = { contains: params.level, mode: 'insensitive' };
    }
    if (params.city) {
      where.city = params.city;
    }
    if (params.minYoe !== undefined || params.maxYoe !== undefined) {
      where.yearsOfExperience = {
        ...(params.minYoe !== undefined ? { gte: params.minYoe } : {}),
        ...(params.maxYoe !== undefined ? { lte: params.maxYoe } : {}),
      };
    }
    if (params.minTC !== undefined || params.maxTC !== undefined) {
      where.totalCompensation = {
        ...(params.minTC !== undefined ? { gte: params.minTC } : {}),
        ...(params.maxTC !== undefined ? { lte: params.maxTC } : {}),
      };
    }

    const [total, entries] = await Promise.all([
      prisma.salaryEntry.count({ where }),
      prisma.salaryEntry.findMany({
        where,
        include: { company: { select: { name: true, slug: true, logo: true, industry: true } } },
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
    ]);

    return NextResponse.json({
      data: entries,
      meta: {
        total,
        page: params.page,
        pageSize: params.pageSize,
        totalPages: Math.ceil(total / params.pageSize),
      },
    });
  } catch (error) {
    console.error('[GET /api/salaries]', error);
    return NextResponse.json({ error: 'Failed to fetch salaries' }, { status: 500 });
  }
}
