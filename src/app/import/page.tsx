'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Info } from 'lucide-react';
import Link from 'next/link';

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
  message: string;
}

const CSV_TEMPLATE = `company,role,level,years_of_experience,base_salary_lpa,bonus_lpa,equity_lpa,city,role_category
Google,Software Engineer,L4,3,35,5.5,12,BANGALORE,SOFTWARE_ENGINEERING
Flipkart,Product Manager,Senior,5,28,4,0,BANGALORE,PRODUCT_MANAGEMENT
Amazon,SDE-II,SDE-II,4,30,3,8,HYDERABAD,SOFTWARE_ENGINEERING
Razorpay,Backend Engineer,Mid-Level,2.5,18,2,1,MUMBAI,SOFTWARE_ENGINEERING`;

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'compiq_salary_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!file) return;
    setStatus('uploading');
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/import', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) throw new Error('Please sign in to import data');
        throw new Error(data.error ?? 'Import failed');
      }
      setResult(data);
      setStatus('done');
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Import failed');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-50 mb-1 flex items-center gap-3">
          <Upload className="w-7 h-7 text-violet-400" />
          CSV Import
        </h1>
        <p className="text-gray-400">Bulk import salary data from a CSV file</p>
      </div>

      {/* Requirements */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-start gap-3 text-sm text-blue-300 mb-4">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>Import multiple salary entries at once. Invalid rows are skipped and reported. Sign in required.</p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-1">Required columns:</h3>
            <div className="flex flex-wrap gap-2">
              {['company', 'role', 'level', 'years_of_experience', 'base_salary_lpa', 'city'].map(col => (
                <span key={col} className="badge badge-purple font-mono">{col}</span>
              ))}
            </div>
            <h3 className="text-sm font-semibold text-gray-300 mt-3 mb-1">Optional columns:</h3>
            <div className="flex flex-wrap gap-2">
              {['bonus_lpa', 'equity_lpa', 'role_category'].map(col => (
                <span key={col} className="badge badge-gray font-mono">{col}</span>
              ))}
            </div>
          </div>
          <button onClick={downloadTemplate} className="btn-secondary flex-shrink-0" id="download-template">
            <Download className="w-4 h-4" />
            Template
          </button>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        id="csv-dropzone"
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 mb-5 ${
          isDragActive
            ? 'border-violet-500 bg-violet-500/10'
            : file
            ? 'border-green-500/50 bg-green-500/5'
            : 'border-gray-700 hover:border-violet-500/50 hover:bg-violet-500/5'
        }`}
      >
        <input {...getInputProps()} id="csv-file-input" />
        {file ? (
          <>
            <FileText className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="font-semibold text-green-400">{file.name}</p>
            <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
          </>
        ) : (
          <>
            <Upload className={`w-12 h-12 mx-auto mb-3 ${isDragActive ? 'text-violet-400' : 'text-gray-600'}`} />
            <p className="font-medium text-gray-300">
              {isDragActive ? 'Drop your CSV here' : 'Drag & drop a CSV file here'}
            </p>
            <p className="text-sm text-gray-600 mt-1">or click to browse · Max 5MB</p>
          </>
        )}
      </div>

      {/* Import Button */}
      <button
        onClick={handleImport}
        disabled={!file || status === 'uploading'}
        className="w-full btn-primary py-3 text-base disabled:opacity-40 mb-5"
        id="import-btn"
      >
        {status === 'uploading' ? (
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Importing...
          </span>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Import CSV
          </>
        )}
      </button>

      {/* Error */}
      {status === 'error' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">{errorMsg}</p>
            {errorMsg.includes('sign in') && (
              <Link href="/auth/signin" className="text-sm underline mt-1 inline-block">Sign in →</Link>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {status === 'done' && result && (
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-3 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">{result.message}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="stat-card text-center">
              <p className="text-2xl font-bold text-green-400 animated-number">{result.imported}</p>
              <p className="text-sm text-gray-500">Imported</p>
            </div>
            <div className="stat-card text-center">
              <p className="text-2xl font-bold text-yellow-400 animated-number">{result.skipped}</p>
              <p className="text-sm text-gray-500">Skipped</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-400 mb-2">Skipped rows:</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-400 font-mono bg-red-500/5 px-2 py-1 rounded">{err}</p>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Link href="/salaries" className="btn-primary">View Salaries</Link>
            <button onClick={() => { setFile(null); setStatus('idle'); setResult(null); }} className="btn-secondary">Import More</button>
          </div>
        </div>
      )}
    </div>
  );
}
