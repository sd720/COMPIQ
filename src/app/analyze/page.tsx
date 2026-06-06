'use client';
import { useState } from 'react';
import { TrendingUp, Search, AlertCircle, CheckCircle, Info, BarChart3 } from 'lucide-react';
import { formatLakhs, cityLabel, cn } from '@/lib/utils';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine
} from 'recharts';

interface AnalysisResult {
  percentile: number;
  verdict: string;
  marketData: {
    sampleSize: number;
    p10: number; p25: number; p50: number; p75: number; p90: number;
  };
  topPayers: {
    company: string; slug: string; tc: number; level: string; city: string;
  }[];
}

const CITIES = ['BANGALORE', 'MUMBAI', 'DELHI', 'HYDERABAD', 'PUNE', 'CHENNAI', 'KOLKATA', 'NOIDA', 'GURGAON', 'REMOTE'];

function PercentileGauge({ percentile }: { percentile: number }) {
  const color = percentile >= 75 ? '#22c55e' : percentile >= 50 ? '#8b5cf6' : percentile >= 25 ? '#f59e0b' : '#ef4444';
  const data = [{ name: 'percentile', value: percentile, fill: color }, { name: 'remaining', value: 100 - percentile, fill: '#1f2937' }];

  return (
    <div className="relative flex items-center justify-center">
      <ResponsiveContainer width={200} height={200}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" startAngle={90} endAngle={-270} data={data}>
          <RadialBar dataKey="value" cornerRadius={6} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute text-center">
        <p className="text-4xl font-bold animated-number" style={{ color }}>{percentile}th</p>
        <p className="text-xs text-gray-500">percentile</p>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  const [form, setForm] = useState({ role: '', level: '', city: '', tc: '' });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!form.tc || Number(form.tc) <= 0) {
      setError('Please enter your total compensation');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const params = new URLSearchParams();
      if (form.role) params.set('role', form.role);
      if (form.level) params.set('level', form.level);
      if (form.city) params.set('city', form.city);
      params.set('tc', form.tc);
      const res = await fetch(`/api/analyze?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed');
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const verdictColor = (verdict: string) => {
    if (verdict.includes('Excellent')) return 'text-green-400';
    if (verdict.includes('Good')) return 'text-violet-400';
    if (verdict.includes('Fair')) return 'text-yellow-400';
    return 'text-red-400';
  };

  const marketChartData = result ? [
    { label: 'P10', value: result.marketData.p10, isUser: false },
    { label: 'P25', value: result.marketData.p25, isUser: false },
    { label: 'P50 (Median)', value: result.marketData.p50, isUser: false },
    { label: 'Your TC', value: Number(form.tc), isUser: true },
    { label: 'P75', value: result.marketData.p75, isUser: false },
    { label: 'P90', value: result.marketData.p90, isUser: false },
  ].sort((a, b) => a.value - b.value) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-50 mb-1 flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-violet-400" />
          Offer Analyzer
        </h1>
        <p className="text-gray-400">Know your market percentile before accepting any offer</p>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-6 text-sm text-blue-300">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        Enter your offer details to see where it ranks in the market. Broader searches give more accurate results.
      </div>

      {/* Input Form */}
      <div className="glass-card p-6 mb-6">
        <h3 className="font-semibold text-gray-200 mb-4">Your Offer Details</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Total Compensation (LPA) *</label>
            <input
              id="analyze-tc"
              type="number"
              step="0.5"
              min="0"
              placeholder="e.g. 45"
              value={form.tc}
              onChange={e => setForm(prev => ({ ...prev, tc: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Role (optional)</label>
            <input
              id="analyze-role"
              type="text"
              placeholder="e.g. Software Engineer"
              value={form.role}
              onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Level (optional)</label>
            <input
              id="analyze-level"
              type="text"
              placeholder="e.g. Senior, L5"
              value={form.level}
              onChange={e => setForm(prev => ({ ...prev, level: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">City (optional)</label>
            <select
              id="analyze-city"
              value={form.city}
              onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))}
              className="input-field"
            >
              <option value="">All Cities</option>
              {CITIES.map(c => <option key={c} value={c}>{cityLabel(c)}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={analyze}
          disabled={loading || !form.tc}
          className="btn-primary w-full py-3 text-base disabled:opacity-40"
          id="analyze-btn"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing...
            </span>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Analyze My Offer
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-5">
          {/* Percentile + Verdict */}
          <div className="glass-card p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <PercentileGauge percentile={result.percentile} />
              <div className="flex-1 text-center sm:text-left">
                <p className={`text-xl font-bold mb-2 ${verdictColor(result.verdict)}`}>{result.verdict}</p>
                <p className="text-gray-400 text-sm mb-3">
                  Your offer of <span className="text-white font-semibold">{formatLakhs(Number(form.tc))}</span> is
                  higher than <span className="text-violet-400 font-semibold">{result.percentile}%</span> of
                  similar roles in the market.
                </p>
                <p className="text-xs text-gray-600">Based on {result.marketData.sampleSize} data points</p>

                {result.percentile < 50 && (
                  <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-300">
                    💡 <strong>Negotiation tip:</strong> The market median for similar roles is {formatLakhs(result.marketData.p50)}.
                    You can reference this data in your negotiation.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Market Distribution Chart */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-400" />
              Market Distribution
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={marketChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => `₹${v}L`} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb', fontSize: 12 }}
                  formatter={(v) => [typeof v === 'number' ? formatLakhs(v) : '—', 'TC']} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}
                  fill="#7c3aed"
                  className="transition-all"
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-5 gap-2 mt-4 text-center">
              {[
                { label: 'P10', value: result.marketData.p10, color: 'text-gray-500' },
                { label: 'P25', value: result.marketData.p25, color: 'text-yellow-500' },
                { label: 'P50', value: result.marketData.p50, color: 'text-blue-400' },
                { label: 'P75', value: result.marketData.p75, color: 'text-violet-400' },
                { label: 'P90', value: result.marketData.p90, color: 'text-green-400' },
              ].map(item => (
                <div key={item.label}>
                  <p className={`text-sm font-bold animated-number ${item.color}`}>{formatLakhs(item.value)}</p>
                  <p className="text-[10px] text-gray-600">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Payers */}
          {result.topPayers.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="font-semibold text-gray-100 mb-4">Top Paying Companies for This Role</h3>
              <div className="space-y-2">
                {result.topPayers.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                        idx === 0 ? 'bg-amber-500 text-black' : idx === 1 ? 'bg-gray-400 text-black' : 'bg-orange-700 text-white'
                      )}>{idx + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-200">{p.company}</p>
                        <p className="text-xs text-gray-500">{p.level} · {cityLabel(p.city)}</p>
                      </div>
                    </div>
                    <span className="text-amber-400 font-bold text-sm animated-number">{formatLakhs(p.tc)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
