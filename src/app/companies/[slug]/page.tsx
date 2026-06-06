'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Area, AreaChart, Legend
} from 'recharts';
import { ArrowLeft, Building2, ExternalLink, TrendingUp, Users, MapPin, BarChart3, Star } from 'lucide-react';
import { formatLakhs, cityLabel, cn } from '@/lib/utils';

interface CompanyData {
  company: {
    id: string; name: string; slug: string; logo: string | null;
    industry: string; hqLocation: string; size: string; website: string | null; description: string | null;
  };
  stats: { entryCount: number; avgTC: number; medianTC: number; maxTC: number; minTC: number };
  levelProgression: { level: string; levelOrder: number; medianTC: number; avgTC: number; p25: number; p75: number; count: number }[];
  roleBreakdown: { role: string; avgTC: number; count: number }[];
  cityDistribution: { city: string; count: number }[];
  recentEntries: { id: string; role: string; level: string; totalCompensation: number; baseSalary: number; bonus: number; equity: number; yearsOfExperience: number; city: string; verified: boolean }[];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 shadow-xl text-sm">
      <p className="font-semibold text-gray-200 mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="text-xs">
          {p.name}: {formatLakhs(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function CompanyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'levels' | 'roles'>('overview');

  useEffect(() => {
    fetch(`/api/companies/${slug}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
      <div className="skeleton h-8 w-32 rounded" />
      <div className="skeleton h-40 w-full rounded-2xl" />
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
      <p className="text-gray-400">{error || 'Company not found'}</p>
      <Link href="/companies" className="btn-secondary mt-4 inline-flex">Back to Companies</Link>
    </div>
  );

  const { company, stats, levelProgression, roleBreakdown, cityDistribution, recentEntries } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/companies" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-200 text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Companies
      </Link>

      {/* Company Header */}
      <div className="glass-card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          <div className="flex-shrink-0">
            {company.logo ? (
              <img src={company.logo} alt={company.name} className="w-16 h-16 rounded-2xl object-contain bg-white p-2 shadow-lg"
                onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/30 to-purple-700/30 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-violet-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-50">{company.name}</h1>
              <span className="badge badge-purple">{company.industry}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {company.hqLocation}</span>
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {company.size}</span>
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-violet-400 hover:text-violet-300 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> Website
                </a>
              )}
            </div>
            {company.description && <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">{company.description}</p>}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Median TC', value: formatLakhs(stats.medianTC), color: 'text-amber-400' },
          { label: 'Avg TC', value: formatLakhs(stats.avgTC), color: 'text-violet-400' },
          { label: 'Max TC', value: formatLakhs(stats.maxTC), color: 'text-green-400' },
          { label: 'Min TC', value: formatLakhs(stats.minTC), color: 'text-gray-400' },
          { label: 'Reports', value: stats.entryCount.toString(), color: 'text-blue-400' },
        ].map(stat => (
          <div key={stat.label} className="stat-card text-center">
            <p className={`text-xl font-bold animated-number ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 glass-card p-1 w-fit">
        {(['overview', 'levels', 'roles'] as const).map(tab => (
          <button
            key={tab}
            id={`tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize',
              activeTab === tab ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Level Progression Chart */}
          {levelProgression.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-400" /> Level Progression
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={levelProgression}>
                  <defs>
                    <linearGradient id="tcGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="level" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => `₹${v}L`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="medianTC" name="Median TC" stroke="#8b5cf6" fill="url(#tcGrad)" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* City Distribution */}
          {cityDistribution.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-violet-400" /> City Distribution
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={cityDistribution.map(c => ({ ...c, city: cityLabel(c.city) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="city" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb' }} />
                  <Bar dataKey="count" name="Reports" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent Entries */}
          <div className="glass-card p-5 lg:col-span-2">
            <h3 className="font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-violet-400" /> Recent Reports
            </h3>
            <div className="space-y-0 divide-y divide-gray-800/50">
              {recentEntries.map(entry => (
                <div key={entry.id} className="py-3 grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 items-center text-sm">
                  <div>
                    <p className="text-gray-200 font-medium">{entry.role}</p>
                    <span className="badge badge-purple mt-1">{entry.level}</span>
                  </div>
                  <div>
                    <p className="text-amber-400 font-bold animated-number">{formatLakhs(entry.totalCompensation)}</p>
                    <p className="text-xs text-gray-600">Total TC</p>
                  </div>
                  <div>
                    <p className="text-gray-400 animated-number">{formatLakhs(entry.baseSalary)}</p>
                    <p className="text-xs text-gray-600">Base</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-xs">{entry.yearsOfExperience}y exp</p>
                    <p className="text-gray-600 text-xs">{cityLabel(entry.city)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Levels Tab */}
      {activeTab === 'levels' && (
        <div className="glass-card p-5">
          <h3 className="font-semibold text-gray-100 mb-5 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400" /> Compensation by Level
          </h3>
          {levelProgression.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No level data available</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={levelProgression} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="level" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={v => `₹${v}L`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                  <Bar dataKey="p25" name="P25" fill="#4c1d95" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="medianTC" name="Median" fill="#7c3aed" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="p75" name="P75" fill="#a855f7" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6 space-y-3">
                {levelProgression.map(l => (
                  <div key={l.level} className="flex items-center gap-4 p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
                    <span className="badge badge-purple w-24 justify-center">{l.level}</span>
                    <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-700 to-purple-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (l.medianTC / (levelProgression[levelProgression.length - 1]?.p75 || 100)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-amber-400 font-bold text-sm animated-number w-20 text-right">{formatLakhs(l.medianTC)}</span>
                    <span className="text-gray-500 text-xs w-16 text-right">{l.count} reports</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="glass-card p-5">
          <h3 className="font-semibold text-gray-100 mb-5">Compensation by Role</h3>
          {roleBreakdown.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No role data available</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={roleBreakdown.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => `₹${v}L`} />
                  <YAxis type="category" dataKey="role" width={140} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="avgTC" name="Avg TC" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-4 space-y-2">
                {roleBreakdown.map(r => (
                  <div key={r.role} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30">
                    <div>
                      <span className="text-gray-200 text-sm font-medium">{r.role}</span>
                      <span className="text-gray-600 text-xs ml-2">{r.count} reports</span>
                    </div>
                    <span className="text-amber-400 font-bold text-sm animated-number">{formatLakhs(r.avgTC)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
