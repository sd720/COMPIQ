'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, TrendingUp, Building2, Search, GitCompare, Zap, Shield, BarChart3, Users } from 'lucide-react';

const SAMPLE_ENTRIES = [
  { company_name: 'Google', role: 'Software Engineer', level: 'L5', totalCompensation: 95, baseSalary: 60, yearsOfExperience: 5, slug: 'google', color: '#4285f4' },
  { company_name: 'Microsoft', role: 'SDE-II', level: 'SDE-II', totalCompensation: 78, baseSalary: 52, yearsOfExperience: 3, slug: 'microsoft', color: '#00a4ef' },
  { company_name: 'Flipkart', role: 'Senior Engineer', level: 'L5', totalCompensation: 65, baseSalary: 42, yearsOfExperience: 4, slug: 'flipkart', color: '#F7C600' },
  { company_name: 'Amazon', role: 'SDE-II', level: 'SDE-II', totalCompensation: 72, baseSalary: 48, yearsOfExperience: 3, slug: 'amazon', color: '#FF9900' },
  { company_name: 'Razorpay', role: 'Backend Engineer', level: 'Senior', totalCompensation: 55, baseSalary: 38, yearsOfExperience: 4, slug: 'razorpay', color: '#3395FF' },
  { company_name: 'Swiggy', role: 'Staff Engineer', level: 'Staff', totalCompensation: 88, baseSalary: 58, yearsOfExperience: 7, slug: 'swiggy', color: '#FC8019' },
];

const FEATURES = [
  { icon: BarChart3, title: 'Level-Based Data', desc: 'Compare L3 vs L5 vs Staff. Titles lie — levels tell the truth.', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { icon: GitCompare, title: 'Company Comparison', desc: 'Side-by-side TC breakdown for up to 3 companies at the same level.', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { icon: Search, title: 'Offer Analyzer', desc: "Know your percentile before accepting. Don't leave money on the table.", color: 'text-green-400', bg: 'bg-green-500/10' },
  { icon: Shield, title: 'Verified & Anonymous', desc: 'All submissions are anonymized. Verified entries are marked.', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { icon: Zap, title: 'Real-Time Insights', desc: 'Crowdsourced data with percentile distributions, not just averages.', color: 'text-pink-400', bg: 'bg-pink-500/10' },
  { icon: Users, title: 'India-First', desc: 'Built for Indian tech professionals. Levels, cities, companies that matter.', color: 'text-orange-400', bg: 'bg-orange-500/10' },
];

function formatLakhs(v: number) {
  if (!v) return '—';
  return `₹${v.toFixed(1)}L`;
}

export default function HomePage() {
  const [stats, setStats] = useState({ entryCount: 499, companyCount: 20, avgTC: 60 });
  const [topEntries, setTopEntries] = useState<typeof SAMPLE_ENTRIES | null>(null);

  useEffect(() => {
    fetch('/api/companies?pageSize=6&sortBy=entryCount')
      .then(r => r.json())
      .then(d => {
        if (d.meta?.total) setStats(s => ({ ...s, companyCount: d.meta.total }));
      }).catch(() => {});

    fetch('/api/salaries?sortBy=totalCompensation&sortOrder=desc&pageSize=6')
      .then(r => r.json())
      .then(d => {
        if (d.data?.length) {
          setTopEntries(d.data.map((e: Record<string, unknown>) => ({
            company_name: (e.company as Record<string, unknown>)?.name,
            role: e.role, level: e.level,
            totalCompensation: Number(e.totalCompensation),
            baseSalary: Number(e.baseSalary),
            yearsOfExperience: Number(e.yearsOfExperience),
            slug: (e.company as Record<string, unknown>)?.slug,
            logo: (e.company as Record<string, unknown>)?.logo,
            color: '#7c3aed',
          })));
          setStats(s => ({ ...s, entryCount: d.meta?.total ?? s.entryCount }));
        }
      }).catch(() => {});
  }, []);

  const displayEntries = topEntries ?? SAMPLE_ENTRIES;
  const isSample = !topEntries;

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="hero-glow top-[-100px] left-1/2 -translate-x-1/2 opacity-60" />
      </div>

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-violet-500/20 text-xs text-violet-300 mb-6">
            <Zap className="w-3.5 h-3.5" />
            India&apos;s most structured compensation intelligence platform
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-50 leading-tight mb-6">
            Know Your <span className="gradient-text">Worth</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Level-based salary intelligence for Indian tech professionals.
            Compare total compensation by <strong className="text-gray-200">role, level, and company</strong> — not just job titles.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-16">
            <Link href="/salaries" className="btn-primary text-base px-8 py-3 shadow-lg shadow-violet-500/20">
              <Search className="w-4 h-4" /> Explore Salaries <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/submit" className="btn-secondary text-base px-8 py-3">
              <TrendingUp className="w-4 h-4" /> Share Your TC
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              { value: stats.entryCount.toLocaleString(), label: 'Salary Reports' },
              { value: stats.companyCount.toString(), label: 'Companies' },
              { value: formatLakhs(stats.avgTC), label: 'Avg TC' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold gradient-text animated-number">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
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
            {displayEntries.map((entry, i) => (
              <Link key={i} href={`/companies/${entry.slug ?? '#'}`}>
                <div className={`glass-card p-4 hover:border-violet-500/30 transition-all duration-200 group ${isSample ? 'opacity-70' : ''}`}>
                  {isSample && <div className="absolute top-2 right-2 text-[10px] text-gray-600 bg-gray-800/80 px-2 py-0.5 rounded-full">Sample</div>}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-600/20">
                        <Building2 className="w-4 h-4 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-100 group-hover:text-violet-300 transition-colors">{entry.company_name}</p>
                        <p className="text-xs text-gray-500">{entry.role}</p>
                      </div>
                    </div>
                    <span className="badge badge-purple">{entry.level}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold gradient-text-gold animated-number">{formatLakhs(entry.totalCompensation)}</p>
                      <p className="text-xs text-gray-600 mt-0.5">Total Comp</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">{formatLakhs(entry.baseSalary)} base</p>
                      <p className="text-xs text-gray-600">{entry.yearsOfExperience}y exp</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-50 mb-4">Built for <span className="gradient-text">Engineers, by Engineers</span></h2>
            <p className="text-gray-400 max-w-xl mx-auto">Every feature designed to give you real compensation intelligence.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="glass-card p-6 hover:border-violet-500/20 transition-all duration-200 group">
                <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="text-base font-semibold text-gray-100 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
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
            <h2 className="text-3xl font-bold text-gray-50 mb-4 relative">Know what you&apos;re worth. <span className="gradient-text">Negotiate better.</span></h2>
            <p className="text-gray-400 mb-8 relative">Share your compensation anonymously and help build India&apos;s most complete salary intelligence database.</p>
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
