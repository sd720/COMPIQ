import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') ?? '';
    const level = searchParams.get('level') ?? '';
    const city = searchParams.get('city') ?? '';
    const offerTC = Number(searchParams.get('tc') ?? 0);

    if (!offerTC || offerTC <= 0) {
      return NextResponse.json({ error: 'Total compensation required' }, { status: 400 });
    }

    const where: Record<string, unknown> = {};
    if (role) where.role = { contains: role, mode: 'insensitive' };
    if (level) where.level = { contains: level, mode: 'insensitive' };
    if (city) where.city = city;

    const entries = await prisma.salaryEntry.findMany({
      where,
      select: { totalCompensation: true, baseSalary: true, bonus: true, equity: true, company: { select: { name: true, slug: true } }, level: true, city: true },
    });

    if (!entries.length) {
      return NextResponse.json({ error: 'No data found for this role/level combination', percentile: null });
    }

    const tcs = entries.map((e) => e.totalCompensation).sort((a, b) => a - b);
    const belowCount = tcs.filter((tc) => tc < offerTC).length;
    const percentile = Math.round((belowCount / tcs.length) * 100);

    const p10 = tcs[Math.floor(tcs.length * 0.1)];
    const p25 = tcs[Math.floor(tcs.length * 0.25)];
    const p50 = tcs[Math.floor(tcs.length * 0.5)];
    const p75 = tcs[Math.floor(tcs.length * 0.75)];
    const p90 = tcs[Math.floor(tcs.length * 0.9)];

    const topPayers = [...entries]
      .sort((a, b) => b.totalCompensation - a.totalCompensation)
      .slice(0, 5)
      .map((e) => ({
        company: e.company.name,
        slug: e.company.slug,
        tc: e.totalCompensation,
        level: e.level,
        city: e.city,
      }));

    let verdict = '';
    if (percentile >= 75) verdict = 'Excellent — Top 25% of market';
    else if (percentile >= 50) verdict = 'Good — Above median market rate';
    else if (percentile >= 25) verdict = 'Fair — Below median, room to negotiate';
    else verdict = 'Below Market — Significantly underpaid';

    return NextResponse.json({
      percentile,
      verdict,
      marketData: {
        sampleSize: entries.length,
        p10: Math.round(p10 * 10) / 10,
        p25: Math.round(p25 * 10) / 10,
        p50: Math.round(p50 * 10) / 10,
        p75: Math.round(p75 * 10) / 10,
        p90: Math.round(p90 * 10) / 10,
      },
      topPayers,
    });
  } catch (error) {
    console.error('[GET /api/analyze]', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
