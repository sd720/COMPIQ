import Link from 'next/link';
import { ArrowRight, TrendingUp, Users, Building2, Search, GitCompare, Zap, Shield, BarChart3 } from 'lucide-react';
import { getDb } from '@/lib/db';
import { formatLakhs } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getStats() {
  try {
    const sql = getDb();
    const [countRes, companyRes, avgRes, topRes] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM salary_entries`,
      sql`SELECT COUNT(*) as count FROM companies`,
      sql`SELECT AVG("totalCompensation") as avg FROM salary_entries`,
      sql`SELECT se.id, se.role, se.level, se."totalCompensation", se."baseSalary", se."yearsOfExperience", c.name as company_name, c.slug, c.logo FROM salary_entries se JOIN companies c ON se."companyId" = c.id ORDER BY se."totalCompensation" DESC LIMIT 6`,
    ]);
    return {
      entryCount: Number(countRes[0].count),
      companyCount: Number(companyRes[0].count),
      avgTC: Math.round((Number(avgRes[0].avg) || 0) * 10) / 10,
      topEntries: topRes,
    };
  } catch (e) {
    console.error('getStats error:', e);
    return { entryCount: 0, companyCount: 0, avgTC: 0, topEntries: [] };
  }
}

const features = [
  { icon: BarChart3, title: 'Level-Based Data', description: 'Compare L3 vs L5 vs Staff. Titles lie — levels tell the truth.', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { icon: GitCompare, title: 'Company Comparison', description: 'Side-by-side TC breakdown for up to 3 companies at the same level.', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { icon: Search, title: 'Offer Analyzer', description: "Know your percentile before accepting. Don't leave money on the table.", color: 'text-green-400', bg: 'bg-green-500/10' },
  { icon: Shield, title: 'Verified & Anonymous', description: 'All submissions are anonymized. Verified entries are marked.', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { icon: Zap, title: 'Real-Time Insights', description: 'Crowdsourced data with percentile distributions, not just averages.', color: 'text-pink-400', bg: 'bg-pink-500/10' },
  { icon: Users, title: 'India-First', description: 'Built for Indian tech professionals. Levels, cities, companies that matter.', color: 'text-orange-400', bg: 'bg-orange-500/10' },
];

export default async function HomePage() {
  const stats = await getStats();
  const hasData = stats.entryCount > 0;

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="hero-glow top-[-100px] left-1/2 -translate-x-1/2 opacity-60" />
        <div className="absolute w-[400px] h-[400px] rounded-full top-40 right-0 opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(192,132,252,0.2) 0%, transparent 70%)' }} />
      </div>

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-violet-500/20 text-xs text-violet-300 mb-6">
            <Zap className="w-3.5 h-3.5" />
            India&apos;s most structured compensation intelligence platform
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-50 leading-tight mb-6">
            Know Your{' '}
            <span className="gradient-text">Worth</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Level-based salary intelligence for Indian tech professionals.
            Compare total compensation by <strong className="text-gray-200">role, level, and company</strong> — not just job titles.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-16">
            <Link href="/salaries" className="btn-primary text-base px-8 py-3 shadow-lg shadow-violet-500/20">
              <Search className="w-4 h-4" />Explore Salaries<ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/submit" className="btn-secondary text-base px-8 py-3">
              <TrendingUp className="w-4 h-4" />Share Your TC
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              { value: hasData ? stats.entryCount.toLocaleString() : '499', label: 'Salary Reports' },
              { value: hasData ? stats.companyCount.toString() : '20', label: 'Companies' },
              { value: hasData ? formatLakhs(stats.avgTC) : '₹60L', label: 'Avg TC' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold gradient-text animated-number">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Salaries */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-100">Top Compensation</h2>
            <Link href="/salaries?sortBy=totalCompensation&sortOrder=desc" className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hasData ? (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (stats.topEntries as any[]).map((entry, i) => (
                <Link key={i} href={`/companies/${entry.slug}`}>
                  <div className="glass-card p-4 hover:border-violet-500/30 transition-all duration-200 group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        {entry.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={entry.logo} alt={entry.company_name} className="w-8 h-8 rounded-lg object-contain bg-white p-1" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-violet-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-100 group-hover:text-violet-300 transition-colors">{entry.company_name}</p>
                          <p className="text-xs text-gray-500">{entry.role}</p>
                        </div>
                      </div>
                      <span className="badge badge-purple">{entry.level}</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold gradient-text-gold animated-number">{formatLakhs(Number(entry.totalCompensation))}</p>
                        <p className="text-xs text-gray-600 mt-0.5">Total Comp</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">{formatLakhs(Number(entry.baseSalary))} base</p>
                        <p className="text-xs text-gray-600">{entry.yearsOfExperience}y exp</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              [
                { company: 'Google', role: 'Software Engineer', level: 'L5', tc: '₹95L', base: '₹60L', exp: '5y', color: '#4285f4' },
                { company: 'Microsoft', role: 'SDE-II', level: 'SDE-II', tc: '₹78L', base: '₹52L', exp: '3y', color: '#00a4ef' },
                { company: 'Flipkart', role: 'Senior Engineer', level: 'L5', tc: '₹65L', base: '₹42L', exp: '4y', color: '#F7C600' },
                { company: 'Amazon', role: 'SDE-II', level: 'SDE-II', tc: '₹72L', base: '₹48L', exp: '3y', color: '#FF9900' },
                { company: 'Razorpay', role: 'Backend Engineer', level: 'Senior', tc: '₹55L', base: '₹38L', exp: '4y', color: '#3395FF' },
                { company: 'Swiggy', role: 'Staff Engineer', level: 'Staff', tc: '₹88L', base: '₹58L', exp: '7y', color: '#FC8019' },
              ].map((item) => (
                <div key={item.company} className="glass-card p-4 opacity-70 relative overflow-hidden">
                  <div className="absolute top-2 right-2 text-[10px] text-gray-600 bg-gray-800/80 px-2 py-0.5 rounded-full">Sample</div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: item.color + '30', border: `1px solid ${item.color}40` }}>
                        {item.company[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-100">{item.company}</p>
                        <p className="text-xs text-gray-500">{item.role}</p>
                      </div>
                    </div>
                    <span className="badge badge-purple">{item.level}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold gradient-text-gold">{item.tc}</p>
                      <p className="text-xs text-gray-600 mt-0.5">Total Comp</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">{item.base} base</p>
                      <p className="text-xs text-gray-600">{item.exp} exp</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-50 mb-4">
              Built for <span className="gradient-text">Engineers, by Engineers</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Every feature designed to give you real compensation intelligence — not just salary ranges.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className="glass-card p-6 hover:border-violet-500/20 transition-all duration-200 group">
                <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="text-base font-semibold text-gray-100 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-card p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-purple-900/10 pointer-events-none" />
            <h2 className="text-3xl font-bold text-gray-50 mb-4 relative">
              Know what you&apos;re worth. <span className="gradient-text">Negotiate better.</span>
            </h2>
            <p className="text-gray-400 mb-8 relative">
              Share your compensation anonymously and help build India&apos;s most complete salary intelligence database.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center relative">
              <Link href="/submit" className="btn-primary px-8 py-3 text-base shadow-lg shadow-violet-500/20">Share Your Salary</Link>
              <Link href="/analyze" className="btn-secondary px-8 py-3 text-base">Analyze an Offer</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
