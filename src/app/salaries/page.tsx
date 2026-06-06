'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Filter, ArrowUpDown, Building2, MapPin, Briefcase, TrendingUp, ChevronLeft, ChevronRight, X, SlidersHorizontal } from 'lucide-react';
import { formatLakhs, cityLabel, roleCategoryLabel, cn } from '@/lib/utils';

interface SalaryEntry {
  id: string;
  role: string;
  level: string;
  yearsOfExperience: number;
  baseSalary: number;
  bonus: number;
  equity: number;
  totalCompensation: number;
  city: string;
  roleCategory: string;
  verified: boolean;
  submittedAt: string;
  company: { name: string; slug: string; logo: string | null; industry: string };
}

const CITIES = ['BANGALORE', 'MUMBAI', 'DELHI', 'HYDERABAD', 'PUNE', 'CHENNAI', 'NOIDA', 'GURGAON', 'REMOTE'];
const CATEGORIES = ['SOFTWARE_ENGINEERING', 'DATA_SCIENCE', 'PRODUCT_MANAGEMENT', 'DESIGN', 'DEVOPS', 'SECURITY'];

function SalaryTableContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [entries, setEntries] = useState<SalaryEntry[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageSize: 25, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    company: searchParams.get('company') ?? '',
    role: searchParams.get('role') ?? '',
    roleCategory: searchParams.get('roleCategory') ?? '',
    city: searchParams.get('city') ?? '',
    minYoe: searchParams.get('minYoe') ?? '',
    maxYoe: searchParams.get('maxYoe') ?? '',
    sortBy: searchParams.get('sortBy') ?? 'totalCompensation',
    sortOrder: searchParams.get('sortOrder') ?? 'desc',
    page: Number(searchParams.get('page') ?? 1),
  });

  const fetchSalaries = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
    try {
      const res = await fetch(`/api/salaries?${params}`);
      const data = await res.json();
      setEntries(data.data ?? []);
      setMeta(data.meta ?? { total: 0, page: 1, pageSize: 25, totalPages: 1 });
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchSalaries(); }, [fetchSalaries]);

  const updateFilter = (key: string, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value, page: key === 'page' ? Number(value) : 1 }));
  };

  const clearFilters = () => {
    setFilters({ company: '', role: '', roleCategory: '', city: '', minYoe: '', maxYoe: '', sortBy: 'totalCompensation', sortOrder: 'desc', page: 1 });
  };

  const toggleSort = (col: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: col,
      sortOrder: prev.sortBy === col && prev.sortOrder === 'desc' ? 'asc' : 'desc',
      page: 1,
    }));
  };

  const activeFilterCount = [filters.company, filters.role, filters.roleCategory, filters.city, filters.minYoe, filters.maxYoe].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-50 mb-1">Salary Explorer</h1>
        <p className="text-gray-400">Browse <span className="text-violet-400 font-medium">{meta.total.toLocaleString()}</span> compensation reports from Indian tech professionals</p>
      </div>

      {/* Search + Filter Bar */}
      <div className="glass-card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search company..."
              value={filters.company}
              onChange={e => updateFilter('company', e.target.value)}
              className="input-field pl-9"
              id="company-search"
            />
          </div>
          <div className="relative flex-1">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search role..."
              value={filters.role}
              onChange={e => updateFilter('role', e.target.value)}
              className="input-field pl-9"
              id="role-search"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn('btn-secondary flex items-center gap-2 whitespace-nowrap', showFilters && 'border-violet-500/50 bg-violet-500/15')}
            id="filter-toggle"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-violet-600 text-white text-xs rounded-full flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/5">
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-700/50 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <select
              value={filters.roleCategory}
              onChange={e => updateFilter('roleCategory', e.target.value)}
              className="input-field"
              id="category-filter"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{roleCategoryLabel(c)}</option>
              ))}
            </select>
            <select
              value={filters.city}
              onChange={e => updateFilter('city', e.target.value)}
              className="input-field"
              id="city-filter"
            >
              <option value="">All Cities</option>
              {CITIES.map(c => (
                <option key={c} value={c}>{cityLabel(c)}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Min YoE"
              value={filters.minYoe}
              onChange={e => updateFilter('minYoe', e.target.value)}
              className="input-field"
              min={0} max={50}
              id="min-yoe"
            />
            <input
              type="number"
              placeholder="Max YoE"
              value={filters.maxYoe}
              onChange={e => updateFilter('maxYoe', e.target.value)}
              className="input-field"
              min={0} max={50}
              id="max-yoe"
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-5 py-3 border-b border-gray-700/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span>Company / Role</span>
          <button onClick={() => toggleSort('totalCompensation')} className="flex items-center gap-1 hover:text-gray-300 transition-colors" id="sort-tc">
            Total TC <ArrowUpDown className="w-3 h-3" />
          </button>
          <button onClick={() => toggleSort('baseSalary')} className="flex items-center gap-1 hover:text-gray-300 transition-colors" id="sort-base">
            Base <ArrowUpDown className="w-3 h-3" />
          </button>
          <span className="hidden sm:block">Bonus + Equity</span>
          <button onClick={() => toggleSort('yearsOfExperience')} className="hidden lg:flex items-center gap-1 hover:text-gray-300 transition-colors" id="sort-yoe">
            YoE <ArrowUpDown className="w-3 h-3" />
          </button>
          <span className="hidden lg:block">City</span>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="space-y-0">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-5 py-4 border-b border-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="skeleton w-8 h-8 rounded-lg" />
                  <div className="space-y-1.5">
                    <div className="skeleton h-3.5 w-24 rounded" />
                    <div className="skeleton h-3 w-16 rounded" />
                  </div>
                </div>
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="skeleton h-4 w-16 rounded self-center" />
                ))}
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="py-20 text-center">
            <Filter className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No results found</p>
            <p className="text-gray-600 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-5 py-3.5 border-b border-gray-800/40 hover:bg-violet-500/3 transition-colors cursor-pointer group"
              onClick={() => router.push(`/companies/${entry.company.slug}`)}
            >
              {/* Company + Role */}
              <div className="flex items-center gap-3 min-w-0">
                {entry.company.logo ? (
                  <img
                    src={entry.company.logo}
                    alt={entry.company.name}
                    className="w-8 h-8 rounded-lg object-contain bg-white p-1 flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-gray-500" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-100 truncate group-hover:text-violet-300 transition-colors">{entry.company.name}</p>
                  <p className="text-xs text-gray-500 truncate">{entry.role}</p>
                </div>
                <span className="badge badge-purple hidden sm:inline-flex flex-shrink-0">{entry.level}</span>
              </div>

              {/* TC */}
              <div>
                <p className="text-sm font-bold text-amber-400 animated-number">{formatLakhs(entry.totalCompensation)}</p>
                {entry.verified && <span className="text-[10px] text-green-500">✓ Verified</span>}
              </div>

              {/* Base */}
              <div>
                <p className="text-sm text-gray-300 animated-number">{formatLakhs(entry.baseSalary)}</p>
              </div>

              {/* Bonus + Equity */}
              <div className="hidden sm:block">
                <p className="text-xs text-gray-400">
                  {entry.bonus > 0 && <span className="text-green-400">+{formatLakhs(entry.bonus)}</span>}
                  {entry.equity > 0 && <span className="text-blue-400 ml-1">+{formatLakhs(entry.equity)} eq</span>}
                  {entry.bonus === 0 && entry.equity === 0 && <span className="text-gray-600">—</span>}
                </p>
              </div>

              {/* YoE */}
              <div className="hidden lg:block">
                <p className="text-sm text-gray-400">{entry.yearsOfExperience}y</p>
              </div>

              {/* City */}
              <div className="hidden lg:flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {cityLabel(entry.city)}
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-700/50">
            <p className="text-sm text-gray-500">
              Showing {((meta.page - 1) * meta.pageSize) + 1}–{Math.min(meta.page * meta.pageSize, meta.total)} of {meta.total.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateFilter('page', filters.page - 1)}
                disabled={filters.page <= 1}
                className="btn-ghost p-2 disabled:opacity-30"
                id="prev-page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-400">
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                onClick={() => updateFilter('page', filters.page + 1)}
                disabled={filters.page >= meta.totalPages}
                className="btn-ghost p-2 disabled:opacity-30"
                id="next-page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> TC = Base + Bonus + Equity (annualized). All amounts in INR LPA.</span>
      </div>
    </div>
  );
}

export default function SalariesPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8"><div className="skeleton h-8 w-48 rounded mb-4" /></div>}>
      <SalaryTableContent />
    </Suspense>
  );
}
