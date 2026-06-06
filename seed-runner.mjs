// seed-runner.mjs — seeds with correct snake_case table names
import { readFileSync } from 'fs';
import pg from 'pg';
const { Client } = pg;

// Parse .env
const envFile = readFileSync('.env', 'utf-8');
const envVars = {};
for (const line of envFile.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.substring(0, eqIdx).trim();
  let val = trimmed.substring(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
  envVars[key] = val;
}

const client = new Client({ connectionString: envVars.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
console.log('✅ Connected to Neon!');

// Get actual column names for companies and salary_entries
const coColsRes = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'companies'`);
const sColsRes = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'salary_entries'`);
console.log('companies columns:', coColsRes.rows.map(r => r.column_name).join(', '));
console.log('salary_entries columns:', sColsRes.rows.map(r => r.column_name).join(', '));

// ---- Companies ----
const companies = [
  { name: 'Google', slug: 'google', industry: 'Technology', hq_location: 'Bangalore, India', size: 'ENTERPRISE', logo: 'https://logo.clearbit.com/google.com', website: 'https://google.com', description: 'Multinational technology company specializing in Internet-related services.' },
  { name: 'Microsoft', slug: 'microsoft', industry: 'Technology', hq_location: 'Hyderabad, India', size: 'ENTERPRISE', logo: 'https://logo.clearbit.com/microsoft.com', website: 'https://microsoft.com', description: 'Global leader in software, services, devices and solutions.' },
  { name: 'Amazon', slug: 'amazon', industry: 'E-Commerce', hq_location: 'Hyderabad, India', size: 'ENTERPRISE', logo: 'https://logo.clearbit.com/amazon.com', website: 'https://amazon.com', description: 'Multinational tech company focusing on e-commerce, cloud computing, and AI.' },
  { name: 'Flipkart', slug: 'flipkart', industry: 'E-Commerce', hq_location: 'Bangalore, India', size: 'LARGE', logo: 'https://logo.clearbit.com/flipkart.com', website: 'https://flipkart.com', description: "India's leading e-commerce marketplace." },
  { name: 'Razorpay', slug: 'razorpay', industry: 'FinTech', hq_location: 'Bangalore, India', size: 'MEDIUM', logo: 'https://logo.clearbit.com/razorpay.com', website: 'https://razorpay.com', description: 'Full-stack financial services company for Indian businesses.' },
  { name: 'Swiggy', slug: 'swiggy', industry: 'Food Tech', hq_location: 'Bangalore, India', size: 'LARGE', logo: 'https://logo.clearbit.com/swiggy.com', website: 'https://swiggy.com', description: 'Online food ordering and delivery platform.' },
  { name: 'Zomato', slug: 'zomato', industry: 'Food Tech', hq_location: 'Gurugram, India', size: 'LARGE', logo: 'https://logo.clearbit.com/zomato.com', website: 'https://zomato.com', description: 'Restaurant aggregator and food delivery company.' },
  { name: 'Ola', slug: 'ola', industry: 'Mobility', hq_location: 'Bangalore, India', size: 'LARGE', logo: 'https://logo.clearbit.com/olacabs.com', website: 'https://olacabs.com', description: "India's largest mobility platform." },
  { name: 'Paytm', slug: 'paytm', industry: 'FinTech', hq_location: 'Noida, India', size: 'LARGE', logo: 'https://logo.clearbit.com/paytm.com', website: 'https://paytm.com', description: 'Digital payments and financial services company.' },
  { name: 'PhonePe', slug: 'phonepe', industry: 'FinTech', hq_location: 'Bangalore, India', size: 'LARGE', logo: 'https://logo.clearbit.com/phonepe.com', website: 'https://phonepe.com', description: 'Digital payment and financial services platform.' },
  { name: 'CRED', slug: 'cred', industry: 'FinTech', hq_location: 'Bangalore, India', size: 'MEDIUM', logo: 'https://logo.clearbit.com/cred.club', website: 'https://cred.club', description: 'Members-only credit card bill payment platform.' },
  { name: 'Meesho', slug: 'meesho', industry: 'E-Commerce', hq_location: 'Bangalore, India', size: 'MEDIUM', logo: 'https://logo.clearbit.com/meesho.com', website: 'https://meesho.com', description: 'Social commerce platform enabling small businesses.' },
  { name: 'Dream11', slug: 'dream11', industry: 'Technology', hq_location: 'Mumbai, India', size: 'MEDIUM', logo: 'https://logo.clearbit.com/dream11.com', website: 'https://dream11.com', description: "India's biggest sports gaming platform." },
  { name: 'Freshworks', slug: 'freshworks', industry: 'Enterprise Software', hq_location: 'Chennai, India', size: 'LARGE', logo: 'https://logo.clearbit.com/freshworks.com', website: 'https://freshworks.com', description: 'Cloud-based business software suite.' },
  { name: 'Zoho', slug: 'zoho', industry: 'Enterprise Software', hq_location: 'Chennai, India', size: 'LARGE', logo: 'https://logo.clearbit.com/zoho.com', website: 'https://zoho.com', description: 'Comprehensive suite of online productivity and business apps.' },
  { name: 'Infosys', slug: 'infosys', industry: 'Technology', hq_location: 'Bangalore, India', size: 'ENTERPRISE', logo: 'https://logo.clearbit.com/infosys.com', website: 'https://infosys.com', description: 'Global leader in next-generation digital services and consulting.' },
  { name: 'TCS', slug: 'tcs', industry: 'Technology', hq_location: 'Mumbai, India', size: 'ENTERPRISE', logo: 'https://logo.clearbit.com/tcs.com', website: 'https://tcs.com', description: "India's largest IT services company." },
  { name: 'Groww', slug: 'groww', industry: 'FinTech', hq_location: 'Bangalore, India', size: 'MEDIUM', logo: 'https://logo.clearbit.com/groww.in', website: 'https://groww.in', description: 'Investment and stock trading platform.' },
  { name: 'Salesforce', slug: 'salesforce', industry: 'CRM / Cloud', hq_location: 'Hyderabad, India', size: 'ENTERPRISE', logo: 'https://logo.clearbit.com/salesforce.com', website: 'https://salesforce.com', description: "World's #1 CRM platform." },
  { name: 'Adobe', slug: 'adobe', industry: 'Software', hq_location: 'Bangalore, India', size: 'ENTERPRISE', logo: 'https://logo.clearbit.com/adobe.com', website: 'https://adobe.com', description: 'Leader in digital media and digital marketing solutions.' },
];

console.log('\n🏢 Inserting companies...');

// Get actual column names to map correctly
const coColNames = coColsRes.rows.map(r => r.column_name);
const hasNormalizedName = coColNames.includes('normalized_name');
const hasHqLocation = coColNames.includes('hq_location');

const companyIds = {};
for (const co of companies) {
  const normalized = co.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  let query, params;
  if (hasNormalizedName && hasHqLocation) {
    query = `INSERT INTO companies (id, name, normalized_name, slug, industry, hq_location, size, logo, website, description, created_at, updated_at)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
             ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`;
    params = [co.name, normalized, co.slug, co.industry, co.hq_location, co.size, co.logo, co.website, co.description];
  } else {
    // Try camelCase columns
    query = `INSERT INTO companies (id, name, "normalizedName", slug, industry, "hqLocation", size, logo, website, description, "createdAt", "updatedAt")
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
             ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`;
    params = [co.name, normalized, co.slug, co.industry, co.hq_location, co.size, co.logo, co.website, co.description];
  }

  const res = await client.query(query, params);
  companyIds[co.slug] = res.rows[0].id;
  process.stdout.write('.');
}
console.log(`\n✅ ${companies.length} companies inserted`);

// ---- Salary entries ----
const sColNames = sColsRes.rows.map(r => r.column_name);
const hasSnakeCase = sColNames.includes('company_id');

const levelsByCompany = {
  google: [
    { level: 'L3', order: 3, base: [18, 25], bonus: [2, 4], equity: [4, 8] },
    { level: 'L4', order: 4, base: [28, 38], bonus: [4, 7], equity: [8, 15] },
    { level: 'L5', order: 5, base: [45, 65], bonus: [8, 15], equity: [15, 35] },
    { level: 'L6', order: 6, base: [70, 95], bonus: [15, 25], equity: [30, 60] },
    { level: 'L7', order: 7, base: [100, 130], bonus: [25, 40], equity: [60, 120] },
  ],
  microsoft: [
    { level: 'SDE-I', order: 3, base: [16, 22], bonus: [2, 4], equity: [3, 7] },
    { level: 'SDE-II', order: 4, base: [25, 35], bonus: [4, 7], equity: [7, 14] },
    { level: 'Senior SDE', order: 5, base: [40, 58], bonus: [8, 14], equity: [12, 28] },
    { level: 'Principal', order: 6, base: [65, 90], bonus: [15, 25], equity: [25, 55] },
    { level: 'Partner', order: 7, base: [95, 130], bonus: [25, 40], equity: [50, 100] },
  ],
  amazon: [
    { level: 'SDE-I', order: 3, base: [18, 24], bonus: [2, 5], equity: [5, 10] },
    { level: 'SDE-II', order: 4, base: [28, 40], bonus: [4, 8], equity: [10, 20] },
    { level: 'SDE-III', order: 5, base: [45, 65], bonus: [8, 15], equity: [20, 40] },
    { level: 'Principal SDE', order: 6, base: [70, 100], bonus: [15, 28], equity: [35, 70] },
  ],
  flipkart: [
    { level: 'SDE-1', order: 3, base: [14, 20], bonus: [2, 4], equity: [2, 6] },
    { level: 'SDE-2', order: 4, base: [22, 32], bonus: [3, 6], equity: [5, 12] },
    { level: 'SDE-3', order: 5, base: [35, 52], bonus: [6, 12], equity: [10, 22] },
    { level: 'Staff', order: 6, base: [55, 80], bonus: [12, 20], equity: [20, 45] },
  ],
  razorpay: [
    { level: 'Junior', order: 2, base: [10, 16], bonus: [1, 3], equity: [1, 4] },
    { level: 'Mid-Level', order: 3, base: [18, 26], bonus: [2, 5], equity: [3, 8] },
    { level: 'Senior', order: 4, base: [28, 42], bonus: [4, 9], equity: [6, 15] },
    { level: 'Staff', order: 5, base: [45, 65], bonus: [8, 15], equity: [12, 28] },
    { level: 'Principal', order: 6, base: [65, 90], bonus: [14, 22], equity: [22, 48] },
  ],
};
const defaultLevels = [
  { level: 'Junior', order: 2, base: [8, 14], bonus: [1, 3], equity: [0, 3] },
  { level: 'Mid-Level', order: 3, base: [15, 24], bonus: [2, 5], equity: [2, 7] },
  { level: 'Senior', order: 4, base: [26, 40], bonus: [4, 9], equity: [5, 14] },
  { level: 'Staff', order: 5, base: [42, 62], bonus: [8, 16], equity: [10, 25] },
  { level: 'Principal', order: 6, base: [60, 88], bonus: [14, 24], equity: [20, 48] },
];

const cities = ['BANGALORE', 'HYDERABAD', 'MUMBAI', 'PUNE', 'DELHI', 'NOIDA', 'GURGAON', 'CHENNAI', 'REMOTE'];
const categories = ['SOFTWARE_ENGINEERING', 'DATA_SCIENCE', 'PRODUCT_MANAGEMENT', 'DEVOPS', 'DESIGN'];
const rolesByCategory = {
  SOFTWARE_ENGINEERING: ['Software Engineer', 'Backend Engineer', 'Frontend Engineer', 'Full Stack Engineer', 'Mobile Engineer'],
  DATA_SCIENCE: ['Data Scientist', 'ML Engineer', 'Data Engineer', 'Research Scientist'],
  PRODUCT_MANAGEMENT: ['Product Manager', 'Senior PM', 'Group PM'],
  DEVOPS: ['DevOps Engineer', 'SRE', 'Platform Engineer'],
  DESIGN: ['UX Designer', 'Product Designer', 'UI Engineer'],
};

function rand(min, max) { return Math.round((Math.random() * (max - min) + min) * 10) / 10; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

console.log(`\n💰 Inserting salary entries (snake_case: ${hasSnakeCase})...`);
let count = 0;

for (const co of companies) {
  const companyId = companyIds[co.slug];
  const levelSet = levelsByCompany[co.slug] || defaultLevels;
  const numPerLevel = co.size === 'ENTERPRISE' ? 6 : co.size === 'LARGE' ? 5 : 4;

  for (const lvl of levelSet) {
    for (let i = 0; i < numPerLevel; i++) {
      const category = pick(categories);
      const role = pick(rolesByCategory[category]);
      const base = rand(lvl.base[0], lvl.base[1]);
      const bonus = rand(lvl.bonus[0], lvl.bonus[1]);
      const equity = rand(lvl.equity[0], lvl.equity[1]);
      const tc = Math.round((base + bonus + equity) * 10) / 10;
      const city = pick(cities);
      const yoe = Math.round((lvl.order * 1.5 + Math.random() * 2) * 10) / 10;
      const verified = Math.random() > 0.3;

      if (hasSnakeCase) {
        await client.query(
          `INSERT INTO salary_entries (id, company_id, role, role_category, level, level_order, years_of_experience,
            base_salary, bonus, equity, total_compensation, city, employment_type, verified, anonymous, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'FULL_TIME', $12, true, NOW(), NOW())`,
          [companyId, role, category, lvl.level, lvl.order, yoe, base, bonus, equity, tc, city, verified]
        );
      } else {
        const cityLabel = city.charAt(0) + city.slice(1).toLowerCase();
        await client.query(
          `INSERT INTO salary_entries (id, "companyId", role, "roleCategory", level, "levelOrder", "yearsOfExperience",
            "baseSalary", bonus, equity, "totalCompensation", city, location, "employmentType", verified, anonymous, "submittedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::"City", $12, 'FULL_TIME', $13, true, NOW())`,
          [companyId, role, category, lvl.level, lvl.order, yoe, base, bonus, equity, tc, city, cityLabel, verified]
        );
      }
      count++;
      if (count % 50 === 0) process.stdout.write(`\r  ${count} entries...`);
    }
  }
}

console.log(`\n✅ ${count} salary entries inserted!`);
await client.end();
console.log('🎉 Seed complete! Refresh http://localhost:3000');
