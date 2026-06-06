import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

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

    const sql = getDb();
    let entries;
    if (role && level && city) {
      entries = await sql`SELECT "totalCompensation", c.name as company_name, c.slug, se.level, se.city
        FROM salary_entries se JOIN companies c ON se."companyId" = c.id
        WHERE se.role ILIKE ${`%${role}%`} AND se.level ILIKE ${`%${level}%`} AND se.city::text = ${city}`;
    } else if (role && level) {
      entries = await sql`SELECT "totalCompensation", c.name as company_name, c.slug, se.level, se.city
        FROM salary_entries se JOIN companies c ON se."companyId" = c.id
        WHERE se.role ILIKE ${`%${role}%`} AND se.level ILIKE ${`%${level}%`}`;
    } else if (role) {
      entries = await sql`SELECT "totalCompensation", c.name as company_name, c.slug, se.level, se.city
        FROM salary_entries se JOIN companies c ON se."companyId" = c.id
        WHERE se.role ILIKE ${`%${role}%`}`;
    } else {
      entries = await sql`SELECT "totalCompensation", c.name as company_name, c.slug, se.level, se.city
        FROM salary_entries se JOIN companies c ON se."companyId" = c.id`;
    }

    if (!entries.length) {
      return NextResponse.json({ error: 'No data found for this combination', percentile: null });
    }

    const tcs = entries.map((e: Record<string, unknown>) => Number(e.totalcompensation ?? e.totalCompensation)).sort((a: number, b: number) => a - b);
    const belowCount = tcs.filter((tc: number) => tc < offerTC).length;
    const percentile = Math.round((belowCount / tcs.length) * 100);

    const p10 = tcs[Math.floor(tcs.length * 0.1)];
    const p25 = tcs[Math.floor(tcs.length * 0.25)];
    const p50 = tcs[Math.floor(tcs.length * 0.5)];
    const p75 = tcs[Math.floor(tcs.length * 0.75)];
    const p90 = tcs[Math.floor(tcs.length * 0.9)];

    const topPayers = [...entries]
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(b.totalcompensation ?? b.totalCompensation) - Number(a.totalcompensation ?? a.totalCompensation))
      .slice(0, 5)
      .map((e: Record<string, unknown>) => ({
        company: e.company_name, slug: e.slug,
        tc: Math.round(Number(e.totalcompensation ?? e.totalCompensation) * 10) / 10,
        level: e.level, city: e.city,
      }));

    let verdict = '';
    if (percentile >= 75) verdict = 'Excellent — Top 25% of market';
    else if (percentile >= 50) verdict = 'Good — Above median market rate';
    else if (percentile >= 25) verdict = 'Fair — Below median, room to negotiate';
    else verdict = 'Below Market — Significantly underpaid';

    return NextResponse.json({
      percentile, verdict,
      marketData: { sampleSize: entries.length, p10: Math.round(p10*10)/10, p25: Math.round(p25*10)/10, p50: Math.round(p50*10)/10, p75: Math.round(p75*10)/10, p90: Math.round(p90*10)/10 },
      topPayers,
    });
  } catch (error) {
    console.error('[GET /api/analyze]', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
