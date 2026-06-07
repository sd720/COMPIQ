import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      companyName, role, roleCategory, level, yearsOfExperience,
      baseSalary, bonus, equity, city, employmentType, education, anonymous,
    } = body;

    // Validate required fields
    if (!companyName || !role || !level || !baseSalary || !city) {
      return NextResponse.json({ error: 'Please fill all required fields: company, role, level, base salary, city' }, { status: 400 });
    }

    const sql = getDb();

    // Find company by name (fuzzy match)
    let companyRows = await sql`SELECT id, name FROM companies WHERE name ILIKE ${companyName} LIMIT 1`;
    if (!companyRows.length) {
      companyRows = await sql`SELECT id, name FROM companies WHERE name ILIKE ${`%${companyName}%`} LIMIT 1`;
    }

    let companyId: string;
    if (!companyRows.length) {
      // Auto-create company if not found
      const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const newCompany = await sql`
        INSERT INTO companies (id, name, "normalizedName", slug, industry, "hqLocation", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${companyName}, ${companyName.toLowerCase()}, ${slug}, 'Technology', 'Unknown', NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `;
      companyId = newCompany[0].id;
    } else {
      companyId = companyRows[0].id;
    }

    const safeBonus = Number(bonus) || 0;
    const safeEquity = Number(equity) || 0;
    const safeBase = Number(baseSalary);
    const totalCompensation = safeBase + safeBonus + safeEquity;

    // Map city - use BANGALORE as fallback for unmapped cities
    const cityMap: Record<string, string> = {
      BANGALORE: 'BANGALORE', MUMBAI: 'MUMBAI', DELHI: 'DELHI',
      HYDERABAD: 'HYDERABAD', PUNE: 'PUNE', CHENNAI: 'CHENNAI',
      NOIDA: 'NOIDA', GURGAON: 'GURGAON', REMOTE: 'REMOTE',
      KOLKATA: 'BANGALORE', OTHER: 'BANGALORE', // fallback
    };
    const dbCity = cityMap[city] ?? 'BANGALORE';
    const cityLabel = dbCity.charAt(0) + dbCity.slice(1).toLowerCase();

    // Level order mapping
    const levelOrderMap: Record<string, number> = {
      'intern': 1, 'junior': 2, 'mid-level': 3, 'senior': 4,
      'staff': 5, 'principal': 6, 'distinguished': 7, 'fellow': 8,
      'l3': 2, 'l4': 3, 'l5': 4, 'l6': 5, 'l7': 6,
      'sde-i': 2, 'sde-ii': 3, 'sde-iii': 4,
      'e3': 2, 'e4': 3, 'e5': 4, 'e6': 5,
    };
    const levelOrder = levelOrderMap[level.toLowerCase()] ?? 3;

    await sql`
      INSERT INTO salary_entries (
        id, "companyId", role, "roleCategory", level, "levelOrder",
        "yearsOfExperience", "baseSalary", bonus, equity, "totalCompensation",
        city, location, "employmentType", verified, anonymous, education, "submittedAt"
      ) VALUES (
        gen_random_uuid(), ${companyId}, ${role},
        ${roleCategory || 'SOFTWARE_ENGINEERING'}::"RoleCategory", ${level}, ${levelOrder},
        ${Number(yearsOfExperience) || 0}, ${safeBase}, ${safeBonus}, ${safeEquity},
        ${totalCompensation}, ${dbCity}::"City", ${cityLabel},
        ${employmentType || 'FULL_TIME'}::"EmploymentType", false,
        ${anonymous !== false}, ${education ?? null}, NOW()
      )
    `;

    return NextResponse.json({
      success: true,
      message: 'Salary submitted successfully!',
      data: { totalCompensation },
    });
  } catch (error) {
    console.error('[POST /api/salaries/submit]', error);
    return NextResponse.json({ error: 'Submission failed. Please try again.' }, { status: 500 });
  }
}
