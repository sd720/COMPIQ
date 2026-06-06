'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { salarySubmissionSchema, type SalarySubmission } from '@/lib/validators';
import { roleCategoryLabel, cityLabel, formatLakhs, cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, TrendingUp, Info } from 'lucide-react';

const CITIES = ['BANGALORE', 'MUMBAI', 'DELHI', 'HYDERABAD', 'PUNE', 'CHENNAI', 'KOLKATA', 'NOIDA', 'GURGAON', 'REMOTE', 'OTHER'];
const CATEGORIES = ['SOFTWARE_ENGINEERING', 'DATA_SCIENCE', 'PRODUCT_MANAGEMENT', 'DESIGN', 'DEVOPS', 'SECURITY', 'MANAGEMENT', 'SALES', 'MARKETING', 'FINANCE', 'HR', 'OTHER'];
const COMMON_LEVELS = ['Intern', 'Junior', 'Mid-Level', 'Senior', 'Staff', 'Principal', 'Distinguished', 'Fellow', 'L3', 'L4', 'L5', 'L6', 'L7', 'SDE-I', 'SDE-II', 'SDE-III', 'E3', 'E4', 'E5', 'E6'];

export default function SubmitPage() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [previewTC, setPreviewTC] = useState<number | null>(null);

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<SalarySubmission>({
    resolver: zodResolver(salarySubmissionSchema),
    defaultValues: {
      anonymous: true,
      bonus: 0,
      equity: 0,
      employmentType: 'FULL_TIME',
    },
  });

  const watchBase = watch('baseSalary');
  const watchBonus = watch('bonus');
  const watchEquity = watch('equity');
  const realTimeTC = (Number(watchBase) || 0) + (Number(watchBonus) || 0) + (Number(watchEquity) || 0);

  const onSubmit = async (data: SalarySubmission) => {
    setStatus('idle');
    try {
      const res = await fetch('/api/salaries/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Submission failed');
      setStatus('success');
      setPreviewTC(json.data?.totalCompensation ?? null);
      reset();
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  if (status === 'success') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="glass-card p-10">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4 animate-pulse-glow" />
          <h2 className="text-2xl font-bold text-gray-50 mb-3">Salary Submitted!</h2>
          {previewTC && (
            <p className="text-lg text-amber-400 font-semibold mb-2 animated-number">
              TC: {formatLakhs(previewTC)} LPA
            </p>
          )}
          <p className="text-gray-400 mb-6">Thank you for contributing to India&apos;s compensation database. Your entry is anonymized.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setStatus('idle')} className="btn-primary">Submit Another</button>
            <a href="/salaries" className="btn-secondary">Explore Salaries</a>
          </div>
        </div>
      </div>
    );
  }

  const FieldError = ({ name }: { name: keyof typeof errors }) =>
    errors[name] ? <p className="text-xs text-red-400 mt-1.5">{errors[name]?.message as string}</p> : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-50 mb-1 flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-violet-400" />
          Share Your Salary
        </h1>
        <p className="text-gray-400">Help build India&apos;s most accurate compensation database. All data is anonymized.</p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 mb-6 text-sm text-violet-300">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>Your submission is anonymous by default. We never share personal details. All amounts should be in <strong>INR Lakhs per annum (LPA)</strong>.</p>
      </div>

      {/* Error banner */}
      {status === 'error' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Live TC Preview */}
      {realTimeTC > 0 && (
        <div className="glass-card p-4 mb-6 flex items-center justify-between">
          <span className="text-sm text-gray-400">Live Total Compensation Preview</span>
          <span className="text-xl font-bold gradient-text-gold animated-number">{formatLakhs(realTimeTC)} LPA</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-gray-200 border-b border-gray-700/50 pb-2">Company & Role</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Company Name *</label>
              <input {...register('companyName')} id="company-name" placeholder="e.g. Google, Flipkart" className="input-field" />
              <FieldError name="companyName" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Role / Job Title *</label>
              <input {...register('role')} id="job-role" placeholder="e.g. Software Engineer" className="input-field" />
              <FieldError name="role" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Role Category *</label>
              <select {...register('roleCategory')} id="role-category" className="input-field">
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{roleCategoryLabel(c)}</option>)}
              </select>
              <FieldError name="roleCategory" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Level *</label>
              <input {...register('level')} id="job-level" placeholder="e.g. L4, SDE-II, Senior" className="input-field" list="level-suggestions" />
              <datalist id="level-suggestions">
                {COMMON_LEVELS.map(l => <option key={l} value={l} />)}
              </datalist>
              <FieldError name="level" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">City *</label>
              <select {...register('city')} id="job-city" className="input-field">
                <option value="">Select city</option>
                {CITIES.map(c => <option key={c} value={c}>{cityLabel(c)}</option>)}
              </select>
              <FieldError name="city" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Years of Experience *</label>
              <input {...register('yearsOfExperience', { valueAsNumber: true })} id="yoe" type="number" step="0.5" min="0" max="50" placeholder="e.g. 3.5" className="input-field" />
              <FieldError name="yearsOfExperience" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-gray-200 border-b border-gray-700/50 pb-2">
            Compensation <span className="text-gray-500 font-normal text-sm">(in INR Lakhs per annum)</span>
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Base Salary * <span className="text-gray-600">(LPA)</span></label>
              <input {...register('baseSalary', { valueAsNumber: true })} id="base-salary" type="number" step="0.1" min="0" placeholder="e.g. 25" className="input-field" />
              <FieldError name="baseSalary" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Bonus <span className="text-gray-600">(LPA)</span></label>
              <input {...register('bonus', { valueAsNumber: true })} id="bonus" type="number" step="0.1" min="0" placeholder="e.g. 4" className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Equity (Annual) <span className="text-gray-600">(LPA)</span></label>
              <input {...register('equity', { valueAsNumber: true })} id="equity" type="number" step="0.1" min="0" placeholder="e.g. 10" className="input-field" />
            </div>
          </div>
          <p className="text-xs text-gray-600">For equity, divide total grant value by vesting period (usually 4 years)</p>
        </div>

        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-gray-200 border-b border-gray-700/50 pb-2">Optional Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Employment Type</label>
              <select {...register('employmentType')} id="employment-type" className="input-field">
                <option value="FULL_TIME">Full-Time</option>
                <option value="PART_TIME">Part-Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Intern</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Education</label>
              <input {...register('education')} id="education" placeholder="e.g. B.Tech IIT, NIT" className="input-field" />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input {...register('anonymous')} id="anonymous-check" type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-violet-600 focus:ring-violet-500" defaultChecked />
            <span className="text-sm text-gray-300">Submit anonymously <span className="text-gray-500">(recommended)</span></span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn-primary py-3 text-base shadow-lg shadow-violet-500/20"
          id="submit-salary-btn"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Submit Anonymously
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
