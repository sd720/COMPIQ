import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Papa from 'papaparse';
import { normalizeCompanyName } from '@/lib/utils';
import { City, EmploymentType, RoleCategory } from '@prisma/client';

const CITY_MAP: Record<string, City> = {
  bangalore: City.BANGALORE, bengaluru: City.BANGALORE,
  mumbai: City.MUMBAI, bombay: City.MUMBAI,
  delhi: City.DELHI, 'new delhi': City.DELHI,
  hyderabad: City.HYDERABAD, hyd: City.HYDERABAD,
  pune: City.PUNE,
  chennai: City.CHENNAI, madras: City.CHENNAI,
  kolkata: City.KOLKATA, calcutta: City.KOLKATA,
  noida: City.NOIDA,
  gurgaon: City.GURGAON, gurugram: City.GURGAON,
  remote: City.REMOTE,
};

const ROLE_CATEGORY_MAP: Record<string, RoleCategory> = {
  'software engineering': RoleCategory.SOFTWARE_ENGINEERING,
  'software engineer': RoleCategory.SOFTWARE_ENGINEERING,
  swe: RoleCategory.SOFTWARE_ENGINEERING,
  'data science': RoleCategory.DATA_SCIENCE,
  'data scientist': RoleCategory.DATA_SCIENCE,
  'ml engineer': RoleCategory.DATA_SCIENCE,
  'machine learning': RoleCategory.DATA_SCIENCE,
  'product management': RoleCategory.PRODUCT_MANAGEMENT,
  'product manager': RoleCategory.PRODUCT_MANAGEMENT,
  pm: RoleCategory.PRODUCT_MANAGEMENT,
  design: RoleCategory.DESIGN,
  designer: RoleCategory.DESIGN,
  devops: RoleCategory.DEVOPS,
  'site reliability': RoleCategory.DEVOPS,
  sre: RoleCategory.DEVOPS,
  security: RoleCategory.SECURITY,
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const text = await file.text();
    const { data: rows, errors } = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
    });

    if (errors.length > 0 && rows.length === 0) {
      return NextResponse.json({ error: 'Invalid CSV format', details: errors }, { status: 400 });
    }

    const results = { imported: 0, skipped: 0, errors: [] as string[] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as Record<string, string>;
      try {
        const companyName = row.company?.trim();
        const role = row.role?.trim();
        const level = row.level?.trim();
        const yoe = Number(row.years_of_experience ?? row.yoe ?? 0);
        const base = Number(row.base_salary_lpa ?? row.base ?? 0);
        const bonus = Number(row.bonus_lpa ?? row.bonus ?? 0);
        const equity = Number(row.equity_lpa ?? row.equity ?? 0);
        const cityRaw = row.city?.trim().toLowerCase() ?? '';

        if (!companyName || !role || !level || !base) {
          results.skipped++;
          results.errors.push(`Row ${i + 2}: Missing required fields (company, role, level, base_salary_lpa)`);
          continue;
        }
        if (base < 0 || base > 10000 || bonus < 0 || equity < 0) {
          results.skipped++;
          results.errors.push(`Row ${i + 2}: Invalid salary values`);
          continue;
        }

        const city = CITY_MAP[cityRaw] ?? City.OTHER;
        const roleCategoryRaw = row.role_category?.trim().toLowerCase() ?? '';
        const roleCategory = ROLE_CATEGORY_MAP[roleCategoryRaw] ?? RoleCategory.SOFTWARE_ENGINEERING;
        const total = base + bonus + equity;

        const normalized = normalizeCompanyName(companyName);
        let company = await prisma.company.findFirst({ where: { normalizedName: normalized } });
        if (!company) {
          const slug = `${companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
          company = await prisma.company.create({
            data: { name: companyName, normalizedName: normalized, slug, industry: 'Technology', hqLocation: 'India' },
          });
        }

        const levelOrderMap: Record<string, number> = {
          intern: 0, junior: 2, mid: 4, senior: 6, staff: 7, principal: 8,
          l1: 1, l2: 2, l3: 3, l4: 4, l5: 5, l6: 6, l7: 7,
          'sde-i': 2, 'sde-ii': 4, 'sde-iii': 6,
        };
        const levelOrder = levelOrderMap[level.toLowerCase()] ?? 5;

        await prisma.salaryEntry.create({
          data: {
            companyId: company.id,
            role, roleCategory, level, levelOrder,
            yearsOfExperience: yoe,
            baseSalary: base, bonus, equity,
            totalCompensation: total,
            location: city, city,
            employmentType: EmploymentType.FULL_TIME,
            anonymous: true,
          },
        });
        results.imported++;
      } catch {
        results.skipped++;
        results.errors.push(`Row ${i + 2}: Processing error`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import complete: ${results.imported} imported, ${results.skipped} skipped`,
      ...results,
    });
  } catch (error) {
    console.error('[POST /api/import]', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
