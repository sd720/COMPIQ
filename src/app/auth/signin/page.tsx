'use client';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { TrendingUp, Mail } from 'lucide-react';
import { useState } from 'react';

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading('credentials');
    const res = await signIn('credentials', { email, name, callbackUrl, redirect: true });
    setLoading(null);
    if (res?.ok) setDone(true);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/30">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">CompIQ</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to submit salaries and save companies</p>
        </div>

        <div className="glass-card p-6 space-y-5">
          {done ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-green-400 font-medium">Signed in successfully!</p>
              <p className="text-gray-500 text-sm mt-1">Redirecting you back...</p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <span className="text-xs text-gray-500 bg-gray-800/60 px-3 py-1 rounded-full">
                  ✉️ Enter your email to get started — no password needed
                </span>
              </div>

              {/* Email Form */}
              <form onSubmit={handleCredentials} className="space-y-3">
                <input
                  id="signin-name"
                  type="text"
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input-field"
                />
                <input
                  id="signin-email"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field"
                  required
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!!loading || !email}
                  className="w-full btn-primary py-3 disabled:opacity-40"
                  id="email-signin"
                >
                  {loading === 'credentials' ? (
                    <span className="flex items-center gap-2 justify-center">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 justify-center">
                      <Mail className="w-4 h-4" /> Continue with Email
                    </span>
                  )}
                </button>
              </form>

              <p className="text-xs text-gray-600 text-center">
                No password or verification needed. Just enter your email to start contributing.
              </p>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          Just browsing?{' '}
          <a href="/" className="text-violet-400 hover:text-violet-300 underline">
            Explore salaries without signing in →
          </a>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><div className="skeleton w-96 h-80 rounded-2xl" /></div>}>
      <SignInContent />
    </Suspense>
  );
}
