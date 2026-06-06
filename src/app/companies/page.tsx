'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Building2, TrendingUp, Users, ArrowRight, Filter } from 'lucide-react';
import { formatLakhs, cn } from '@/lib/utils';

interface Company {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  industry: string;
  hqLocation: string;
  size: string;
  entryCount: number;
  avgTC: number;
  maxTC: number;
  medianTC: number;
}

const INDUSTRIES = ['Technology', 'E-Commerce', 'FinTech', 'Food Tech', 'Mobility', 'Enterprise Software', 'CRM / Cloud', 'Software'];

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('');

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (industry) params.set('industry', industry);
      try {
        const res = await fetch(`/api/companies?${params}&pageSize=50`);
        const data = await res.json();
        setCompanies(data.data ?? []);
        setMeta(data.meta ?? {});
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(fetchCompanies, 250);
    return () => clearTimeout(timer);
  }, [search, industry]);

  const sizeColor: Record<string, string> = {
    STARTUP: 'badge-yellow',
    SMALL: 'badge-green',
    MEDIUM: 'badge-purple',
    LARGE: 'badge-purple',
    ENTERPRISE: 'badge-red',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-50 mb-1">Companies</h1>
        <p className="text-gray-400">Explore compensation data across <span className="text-violet-400 font-medium">{meta.total}</span> companies</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            id="company-search-input"
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            id="industry-filter"
            value={industry}
            onChange={e => setIndustry(e.target.value)}
            className="input-field pl-9 pr-8 min-w-[160px]"
          >
            <option value="">All Industries</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="skeleton w-12 h-12 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-3 w-20 rounded" />
                </div>
              </div>
              <div className="skeleton h-8 w-24 rounded" />
              <div className="grid grid-cols-3 gap-2">
                {[1,2,3].map(j => <div key={j} className="skeleton h-10 rounded" />)}
              </div>
            </div>
          ))}
        </div>
      ) : companies.length === 0 ? (
        <div className="py-20 text-center glass-card">
          <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No companies found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map(company => (
            <div
              key={company.id}
              onClick={() => router.push(`/companies/${company.slug}`)}
              className="glass-card p-5 cursor-pointer hover:border-violet-500/30 transition-all duration-200 group"
              id={`company-card-${company.slug}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {company.logo ? (
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="w-12 h-12 rounded-xl object-contain bg-white p-1.5"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/30 to-purple-700/30 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-violet-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-100 group-hover:text-violet-300 transition-colors">{company.name}</h3>
                    <p className="text-xs text-gray-500">{company.industry}</p>
                  </div>
                </div>
                <span className={cn('badge', sizeColor[company.size] ?? 'badge-gray')}>{company.size}</span>
              </div>

              {/* TC highlight */}
              <div className="mb-4">
                <p className="text-2xl font-bold gradient-text-gold animated-number">{formatLakhs(company.medianTC)}</p>
                <p className="text-xs text-gray-500">Median TC</p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-700/50">
                <div>
                  <p className="text-sm font-semibold text-gray-200 animated-number">{formatLakhs(company.avgTC)}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">Avg TC</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-200 animated-number">{formatLakhs(company.maxTC)}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">Max TC</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-200">{company.entryCount}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">Reports</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Users className="w-3 h-3" />
                  {company.hqLocation}
                </div>
                <span className="text-xs text-violet-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  View details <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
