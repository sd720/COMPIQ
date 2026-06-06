'use client';
import { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { GitCompare, Search, Plus, X, Building2, TrendingUp, BarChart3 } from 'lucide-react';
import { formatLakhs, cn } from '@/lib/utils';

interface CompanyOption { id: string; name: string; slug: string; logo: string | null; }
interface CompareResult {
  company: { id: string; name: string; slug: string; logo: string | null; industry: string };
  stats: {
    count: number; medianTC: number; avgTC: number; maxTC: number;
    medianBase: number; medianBonus: number; medianEquity: number;
  } | null;
  levelBreakdown: { level: string; medianTC: number; count: number; levelOrder: number }[];
}

const COLORS = ['#8b5cf6', '#22d3ee', '#f59e0b'];

export default function ComparePage() {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<CompanyOption[]>([]);
  const [results, setResults] = useState<CompareResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<CompanyOption[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Search companies
  useEffect(() => {
    if (!search) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/companies?search=${encodeURIComponent(search)}&pageSize=8`);
      const data = await res.json();
      setSearchResults(data.data ?? []);
      setSearchOpen(true);
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addCompany = (company: CompanyOption) => {
    if (selectedSlugs.length >= 3) return;
    if (selectedSlugs.includes(company.slug)) return;
    setSelectedSlugs(prev => [...prev, company.slug]);
    setSelectedCompanies(prev => [...prev, company]);
    setSearch('');
    setSearchOpen(false);
  };

  const removeCompany = (slug: string) => {
    setSelectedSlugs(prev => prev.filter(s => s !== slug));
    setSelectedCompanies(prev => prev.filter(c => c.slug !== slug));
    setResults([]);
  };

  const compare = async () => {
    if (selectedSlugs.length < 2) return;
    setComparing(true);
    try {
      const params = new URLSearchParams();
      selectedSlugs.forEach(s => params.append('slugs', s));
      const res = await fetch(`/api/compare?${params}`);
      const data = await res.json();
      setResults(data.data ?? []);
    } finally {
      setComparing(false);
    }
  };

  // Build chart data from level breakdowns
  const levelChartData = (() => {
    const levelSet = new Set<string>();
    results.forEach(r => r.levelBreakdown.forEach(l => levelSet.add(l.level)));
    return Array.from(levelSet).map(level => {
      const row: Record<string, string | number> = { level };
      results.forEach(r => {
        const found = r.levelBreakdown.find(l => l.level === level);
        row[r.company.name] = found?.medianTC ?? 0;
      });
      return row;
    });
  })();

  const tcCompData = results.map(r => ({
    name: r.company.name,
    'Median TC': r.stats?.medianTC ?? 0,
    'Base': r.stats?.medianBase ?? 0,
    'Bonus': r.stats?.medianBonus ?? 0,
    'Equity': r.stats?.medianEquity ?? 0,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-50 mb-1 flex items-center gap-3">
          <GitCompare className="w-7 h-7 text-violet-400" />
          Company Comparison
        </h1>
        <p className="text-gray-400">Select 2–3 companies for a side-by-side compensation breakdown</p>
      </div>

      {/* Company Selector */}
      <div className="glass-card p-6 mb-6">
        <div className="flex flex-wrap gap-3 mb-4">
          {selectedCompanies.map((company, idx) => (
            <div
              key={company.slug}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-colors"
              style={{ borderColor: COLORS[idx] + '50', background: COLORS[idx] + '12' }}
            >
              {company.logo ? (
                <img src={company.logo} alt="" className="w-6 h-6 rounded object-contain bg-white p-0.5"
                  onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
              ) : (
                <Building2 className="w-5 h-5" style={{ color: COLORS[idx] }} />
              )}
              <span className="text-sm font-medium text-gray-200">{company.name}</span>
              <button
                onClick={() => removeCompany(company.slug)}
                className="text-gray-600 hover:text-red-400 transition-colors ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {selectedSlugs.length < 3 && (
            <div ref={searchRef} className="relative">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-gray-600 hover:border-violet-500/50 cursor-pointer transition-colors">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  id="company-compare-search"
                  type="text"
                  placeholder={`Add company (${3 - selectedSlugs.length} remaining)`}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => search && setSearchOpen(true)}
                  className="bg-transparent text-sm text-gray-300 placeholder-gray-600 outline-none w-44"
                />
              </div>
              {searchOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-64 glass-card shadow-2xl shadow-black/50 z-50 py-1 overflow-hidden">
                  {searchResults
                    .filter(c => !selectedSlugs.includes(c.slug))
                    .map(company => (
                      <button
                        key={company.slug}
                        onClick={() => addCompany(company)}
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 hover:bg-violet-500/10 transition-colors text-left"
                      >
                        {company.logo ? (
                          <img src={company.logo} alt="" className="w-6 h-6 rounded object-contain bg-white p-0.5"
                            onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                        ) : <Building2 className="w-5 h-5 text-gray-500" />}
                        <span className="text-sm text-gray-200">{company.name}</span>
                        <Plus className="w-3.5 h-3.5 text-gray-600 ml-auto" />
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={compare}
          disabled={selectedSlugs.length < 2 || comparing}
          className="btn-primary disabled:opacity-40"
          id="compare-btn"
        >
          {comparing ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Comparing...
            </span>
          ) : (
            <>
              <GitCompare className="w-4 h-4" />
              Compare {selectedSlugs.length >= 2 ? selectedSlugs.length : ''} Companies
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-6">
          {/* TC Breakdown Cards */}
          <div className={cn('grid gap-4', results.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
            {results.map((r, idx) => (
              <div key={r.company.slug} className="glass-card p-5 border-t-2 transition-all"
                style={{ borderTopColor: COLORS[idx] }}>
                <div className="flex items-center gap-2.5 mb-4">
                  {r.company.logo ? (
                    <img src={r.company.logo} alt="" className="w-8 h-8 rounded-lg object-contain bg-white p-1"
                      onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                  ) : <Building2 className="w-7 h-7 text-gray-500" />}
                  <div>
                    <h3 className="font-semibold text-gray-100">{r.company.name}</h3>
                    <p className="text-xs text-gray-500">{r.company.industry}</p>
                  </div>
                </div>

                {r.stats ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-3xl font-bold animated-number" style={{ color: COLORS[idx] }}>
                        {formatLakhs(r.stats.medianTC)}
                      </p>
                      <p className="text-xs text-gray-500">Median Total Comp</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-700/50">
                      <div>
                        <p className="text-sm font-semibold text-gray-200 animated-number">{formatLakhs(r.stats.medianBase)}</p>
                        <p className="text-[10px] text-gray-600">Base</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-400 animated-number">{formatLakhs(r.stats.medianBonus)}</p>
                        <p className="text-[10px] text-gray-600">Bonus</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-400 animated-number">{formatLakhs(r.stats.medianEquity)}</p>
                        <p className="text-[10px] text-gray-600">Equity</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">{r.stats.count} data points</p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No data available</p>
                )}
              </div>
            ))}
          </div>

          {/* TC Component Breakdown Chart */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-400" />
              Compensation Components Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={tcCompData} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => `₹${v}L`} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb', fontSize: 12 }} />
                <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                <Bar dataKey="Base" fill="#6d28d9" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Bonus" fill="#059669" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Equity" fill="#2563eb" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Level-by-Level Comparison */}
          {levelChartData.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-violet-400" />
                Level-by-Level Comparison
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={levelChartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="level" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => `₹${v}L`} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb', fontSize: 12 }} />
                  <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                  {results.map((r, idx) => (
                    <Bar key={r.company.slug} dataKey={r.company.name} fill={COLORS[idx]} radius={[3, 3, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && selectedSlugs.length < 2 && (
        <div className="glass-card p-16 text-center">
          <GitCompare className="w-14 h-14 text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">Start Comparing</h3>
          <p className="text-gray-600 text-sm max-w-sm mx-auto">
            Select 2–3 companies above to see a detailed side-by-side compensation breakdown by level.
          </p>
        </div>
      )}
    </div>
  );
}
