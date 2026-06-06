import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { salarySubmissionSchema } from '@/lib/validators';
import { normalizeCompanyName } from '@/lib/utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { City, EmploymentType, RoleCategory } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const parsed = salarySubmissionSchema.parse(body);

    const total = parsed.baseSalary + (parsed.bonus ?? 0) + (parsed.equity ?? 0);

    // Normalize company name and find or create
    const normalized = normalizeCompanyName(parsed.companyName);
    let company = await prisma.company.findFirst({
      where: { normalizedName: normalized },
    });

    if (!company) {
      const slug = parsed.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      company = await prisma.company.create({
        data: {
          name: parsed.companyName,
          normalizedName: normalized,
          slug: `${slug}-${Date.now()}`,
          industry: 'Technology',
          hqLocation: 'India',
        },
      });
    }

    // Map level to levelOrder
    const levelOrderMap: Record<string, number> = {
      intern: 0, junior: 2, 'mid-level': 4, 'mid level': 4, mid: 4,
      senior: 6, staff: 7, principal: 8, distinguished: 9, fellow: 10,
      l1: 1, l2: 2, l3: 3, l4: 4, l5: 5, l6: 6, l7: 7,
      'sde-i': 2, 'sde-1': 2, 'sde-ii': 4, 'sde-2': 4, 'sde-iii': 6, 'sde-3': 6,
      e3: 3, e4: 4, e5: 5, e6: 6, e7: 7,
    };
    const levelOrder = levelOrderMap[parsed.level.toLowerCase()] ?? 5;

    const entry = await prisma.salaryEntry.create({
      data: {
        companyId: company.id,
        role: parsed.role,
        roleCategory: parsed.roleCategory as RoleCategory,
        level: parsed.level,
        levelOrder,
        yearsOfExperience: parsed.yearsOfExperience,
        baseSalary: parsed.baseSalary,
        bonus: parsed.bonus ?? 0,
        equity: parsed.equity ?? 0,
        totalCompensation: total,
        location: parsed.city,
        city: parsed.city as City,
        employmentType: parsed.employmentType as EmploymentType,
        gender: parsed.gender,
        education: parsed.education,
        anonymous: parsed.anonymous,
        userId: session?.user?.email
          ? (await prisma.user.findUnique({ where: { email: session.user.email } }))?.id
          : undefined,
      },
      include: { company: { select: { name: true, slug: true } } },
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error: unknown) {
    console.error('[POST /api/salaries/submit]', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}
