import { PrismaClient, RoleCategory, City, CompanySize, EmploymentType } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Required for Node.js — Neon serverless uses WebSockets
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL ?? '';
const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);


const companies = [
  { name: 'Google', slug: 'google', industry: 'Technology', hqLocation: 'Mountain View, CA', size: CompanySize.ENTERPRISE, logo: 'https://logo.clearbit.com/google.com', website: 'https://google.com', description: 'Multinational technology company specializing in Internet-related services and products.' },
  { name: 'Microsoft', slug: 'microsoft', industry: 'Technology', hqLocation: 'Redmond, WA', size: CompanySize.ENTERPRISE, logo: 'https://logo.clearbit.com/microsoft.com', website: 'https://microsoft.com', description: 'Multinational technology corporation producing computer software, consumer electronics, and services.' },
  { name: 'Amazon', slug: 'amazon', industry: 'E-Commerce / Cloud', hqLocation: 'Seattle, WA', size: CompanySize.ENTERPRISE, logo: 'https://logo.clearbit.com/amazon.com', website: 'https://amazon.com', description: 'Multinational technology company focusing on e-commerce, cloud computing, and AI.' },
  { name: 'Meta', slug: 'meta', industry: 'Technology / Social Media', hqLocation: 'Menlo Park, CA', size: CompanySize.ENTERPRISE, logo: 'https://logo.clearbit.com/meta.com', website: 'https://meta.com', description: 'Social media and technology conglomerate owning Facebook, Instagram, and WhatsApp.' },
  { name: 'Flipkart', slug: 'flipkart', industry: 'E-Commerce', hqLocation: 'Bangalore, India', size: CompanySize.LARGE, logo: 'https://logo.clearbit.com/flipkart.com', website: 'https://flipkart.com', description: 'Indian e-commerce company headquartered in Bangalore.' },
  { name: 'Swiggy', slug: 'swiggy', industry: 'Food Tech', hqLocation: 'Bangalore, India', size: CompanySize.LARGE, logo: 'https://logo.clearbit.com/swiggy.com', website: 'https://swiggy.com', description: 'Indian online food ordering and delivery platform.' },
  { name: 'Zomato', slug: 'zomato', industry: 'Food Tech', hqLocation: 'Gurugram, India', size: CompanySize.LARGE, logo: 'https://logo.clearbit.com/zomato.com', website: 'https://zomato.com', description: 'Indian multinational restaurant aggregator and food delivery company.' },
  { name: 'Paytm', slug: 'paytm', industry: 'FinTech', hqLocation: 'Noida, India', size: CompanySize.LARGE, logo: 'https://logo.clearbit.com/paytm.com', website: 'https://paytm.com', description: 'Indian multinational financial technology company.' },
  { name: 'Razorpay', slug: 'razorpay', industry: 'FinTech', hqLocation: 'Bangalore, India', size: CompanySize.MEDIUM, logo: 'https://logo.clearbit.com/razorpay.com', website: 'https://razorpay.com', description: 'Indian fintech company offering payment solutions.' },
  { name: 'CRED', slug: 'cred', industry: 'FinTech', hqLocation: 'Bangalore, India', size: CompanySize.MEDIUM, logo: 'https://logo.clearbit.com/cred.club', website: 'https://cred.club', description: 'Indian fintech startup providing a credit card rewards platform.' },
  { name: 'Meesho', slug: 'meesho', industry: 'E-Commerce', hqLocation: 'Bangalore, India', size: CompanySize.MEDIUM, logo: 'https://logo.clearbit.com/meesho.com', website: 'https://meesho.com', description: 'Indian social commerce platform.' },
  { name: 'Ola', slug: 'ola', industry: 'Mobility', hqLocation: 'Bangalore, India', size: CompanySize.LARGE, logo: 'https://logo.clearbit.com/olacabs.com', website: 'https://olacabs.com', description: 'Indian mobility company offering ride-hailing services.' },
  { name: 'PhonePe', slug: 'phonepe', industry: 'FinTech', hqLocation: 'Bangalore, India', size: CompanySize.MEDIUM, logo: 'https://logo.clearbit.com/phonepe.com', website: 'https://phonepe.com', description: 'Indian digital payments company.' },
  { name: 'Groww', slug: 'groww', industry: 'FinTech', hqLocation: 'Bangalore, India', size: CompanySize.MEDIUM, logo: 'https://logo.clearbit.com/groww.in', website: 'https://groww.in', description: 'Indian stock trading and investment platform.' },
  { name: 'Atlassian', slug: 'atlassian', industry: 'Enterprise Software', hqLocation: 'Sydney, Australia', size: CompanySize.LARGE, logo: 'https://logo.clearbit.com/atlassian.com', website: 'https://atlassian.com', description: 'Australian enterprise software company.' },
  { name: 'Oracle', slug: 'oracle', industry: 'Technology', hqLocation: 'Austin, TX', size: CompanySize.ENTERPRISE, logo: 'https://logo.clearbit.com/oracle.com', website: 'https://oracle.com', description: 'Multinational computer technology corporation.' },
  { name: 'Salesforce', slug: 'salesforce', industry: 'CRM / Cloud', hqLocation: 'San Francisco, CA', size: CompanySize.ENTERPRISE, logo: 'https://logo.clearbit.com/salesforce.com', website: 'https://salesforce.com', description: 'American cloud-based software company.' },
  { name: 'Adobe', slug: 'adobe', industry: 'Software', hqLocation: 'San Jose, CA', size: CompanySize.ENTERPRISE, logo: 'https://logo.clearbit.com/adobe.com', website: 'https://adobe.com', description: 'American multinational computer software company.' },
  { name: 'Uber', slug: 'uber', industry: 'Mobility / Tech', hqLocation: 'San Francisco, CA', size: CompanySize.ENTERPRISE, logo: 'https://logo.clearbit.com/uber.com', website: 'https://uber.com', description: 'American multinational transportation company.' },
  { name: 'Airbnb', slug: 'airbnb', industry: 'Travel / Tech', hqLocation: 'San Francisco, CA', size: CompanySize.LARGE, logo: 'https://logo.clearbit.com/airbnb.com', website: 'https://airbnb.com', description: 'American company operating an online marketplace for lodging.' },
];

type LevelDef = { label: string; order: number; baseMult: number; bonusMult: number; equityMult: number };
const levelsByCompany: Record<string, LevelDef[]> = {
  google: [
    { label: 'L3', order: 3, baseMult: 0.7, bonusMult: 0.12, equityMult: 0.3 },
    { label: 'L4', order: 4, baseMult: 1.0, bonusMult: 0.15, equityMult: 0.6 },
    { label: 'L5', order: 5, baseMult: 1.4, bonusMult: 0.18, equityMult: 1.2 },
    { label: 'L6', order: 6, baseMult: 2.0, bonusMult: 0.22, equityMult: 2.5 },
    { label: 'L7', order: 7, baseMult: 2.8, bonusMult: 0.25, equityMult: 5.0 },
  ],
  microsoft: [
    { label: 'SDE-1', order: 2, baseMult: 0.65, bonusMult: 0.10, equityMult: 0.2 },
    { label: 'SDE-2', order: 4, baseMult: 1.0, bonusMult: 0.15, equityMult: 0.5 },
    { label: 'Senior SDE', order: 6, baseMult: 1.5, bonusMult: 0.18, equityMult: 1.0 },
    { label: 'Principal SDE', order: 8, baseMult: 2.2, bonusMult: 0.22, equityMult: 2.5 },
  ],
  amazon: [
    { label: 'SDE-I', order: 2, baseMult: 0.7, bonusMult: 0.10, equityMult: 0.3 },
    { label: 'SDE-II', order: 4, baseMult: 1.0, bonusMult: 0.12, equityMult: 0.8 },
    { label: 'SDE-III', order: 6, baseMult: 1.6, bonusMult: 0.15, equityMult: 2.0 },
    { label: 'Principal SDE', order: 8, baseMult: 2.5, bonusMult: 0.20, equityMult: 5.0 },
  ],
  meta: [
    { label: 'E3', order: 3, baseMult: 0.75, bonusMult: 0.15, equityMult: 0.5 },
    { label: 'E4', order: 4, baseMult: 1.1, bonusMult: 0.18, equityMult: 1.2 },
    { label: 'E5', order: 5, baseMult: 1.7, bonusMult: 0.22, equityMult: 2.8 },
    { label: 'E6', order: 6, baseMult: 2.5, bonusMult: 0.25, equityMult: 6.0 },
  ],
};

const defaultLevels: LevelDef[] = [
  { label: 'Junior', order: 2, baseMult: 0.5, bonusMult: 0.08, equityMult: 0.0 },
  { label: 'Mid-Level', order: 4, baseMult: 1.0, bonusMult: 0.12, equityMult: 0.2 },
  { label: 'Senior', order: 6, baseMult: 1.6, bonusMult: 0.15, equityMult: 0.5 },
  { label: 'Staff', order: 8, baseMult: 2.2, bonusMult: 0.18, equityMult: 1.0 },
  { label: 'Principal', order: 9, baseMult: 3.0, bonusMult: 0.22, equityMult: 2.0 },
];

const roles = [
  { role: 'Software Engineer', category: RoleCategory.SOFTWARE_ENGINEERING, baseTC: 30 },
  { role: 'Frontend Engineer', category: RoleCategory.SOFTWARE_ENGINEERING, baseTC: 28 },
  { role: 'Backend Engineer', category: RoleCategory.SOFTWARE_ENGINEERING, baseTC: 29 },
  { role: 'Full Stack Engineer', category: RoleCategory.SOFTWARE_ENGINEERING, baseTC: 30 },
  { role: 'Data Engineer', category: RoleCategory.DATA_SCIENCE, baseTC: 28 },
  { role: 'ML Engineer', category: RoleCategory.DATA_SCIENCE, baseTC: 35 },
  { role: 'Data Scientist', category: RoleCategory.DATA_SCIENCE, baseTC: 32 },
  { role: 'DevOps Engineer', category: RoleCategory.DEVOPS, baseTC: 27 },
  { role: 'Product Manager', category: RoleCategory.PRODUCT_MANAGEMENT, baseTC: 35 },
  { role: 'Product Designer', category: RoleCategory.DESIGN, baseTC: 25 },
  { role: 'Security Engineer', category: RoleCategory.SECURITY, baseTC: 32 },
];

const cities = [City.BANGALORE, City.HYDERABAD, City.PUNE, City.MUMBAI, City.DELHI, City.GURGAON, City.NOIDA, City.CHENNAI];

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function jitter(value: number, pct = 0.15) {
  return value * (1 + (Math.random() - 0.5) * 2 * pct);
}

async function main() {
  console.log('🌱 Starting seed...');

  await prisma.savedItem.deleteMany();
  await prisma.salaryEntry.deleteMany();
  await prisma.company.deleteMany();

  const createdCompanies: Record<string, string> = {};

  for (const company of companies) {
    const normalized = company.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const created = await prisma.company.create({
      data: {
        name: company.name,
        normalizedName: normalized,
        slug: company.slug,
        logo: company.logo,
        industry: company.industry,
        hqLocation: company.hqLocation,
        size: company.size,
        website: company.website,
        description: company.description,
      },
    });
    createdCompanies[company.slug] = created.id;
    console.log(`✅ Created company: ${company.name}`);
  }

  let totalEntries = 0;
  for (const company of companies) {
    const companyId = createdCompanies[company.slug];
    const levels = levelsByCompany[company.slug] || defaultLevels;
    const entriesPerCombination = company.size === CompanySize.ENTERPRISE ? 4 : 2;

    for (const roleData of roles) {
      for (const level of levels) {
        for (let i = 0; i < entriesPerCombination; i++) {
          const city = cities[Math.floor(Math.random() * cities.length)];
          const base = jitter(roleData.baseTC * level.baseMult);
          const bonus = jitter(base * level.bonusMult);
          const equity = jitter(roleData.baseTC * level.equityMult);
          const total = base + bonus + equity;
          const yoe = Math.max(0.5, jitter(level.order * 1.2, 0.3));

          await prisma.salaryEntry.create({
            data: {
              companyId,
              role: roleData.role,
              roleCategory: roleData.category,
              level: level.label,
              levelOrder: level.order,
              yearsOfExperience: Math.round(yoe * 10) / 10,
              baseSalary: Math.round(base * 100) / 100,
              bonus: Math.round(bonus * 100) / 100,
              equity: Math.round(equity * 100) / 100,
              totalCompensation: Math.round(total * 100) / 100,
              location: city,
              city,
              employmentType: EmploymentType.FULL_TIME,
              verified: Math.random() > 0.4,
              anonymous: true,
              reportedDate: new Date(Date.now() - randomBetween(0, 365 * 24 * 60 * 60 * 1000)),
            },
          });
          totalEntries++;
        }
      }
    }
    console.log(`💰 Seeded ${company.name}`);
  }

  console.log(`\n🎉 Seed complete! ${companies.length} companies, ${totalEntries} salary entries`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
