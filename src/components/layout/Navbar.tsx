'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';
import { TrendingUp, Search, GitCompare, Upload, BarChart3, Menu, X, ChevronDown, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/salaries', label: 'Salaries', icon: Search },
  { href: '/companies', label: 'Companies', icon: BarChart3 },
  { href: '/compare', label: 'Compare', icon: GitCompare },
  { href: '/analyze', label: 'Offer Analyzer', icon: TrendingUp },
  { href: '/submit', label: 'Add Salary', icon: Upload },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 glass border-b border-gray-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg group-hover:shadow-violet-500/30 transition-shadow">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text">CompIQ</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  pathname === href || pathname.startsWith(href + '/')
                    ? 'bg-violet-500/15 text-violet-300 border border-violet-500/25'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
                )}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-3">
            {status === 'loading' ? (
              <div className="w-8 h-8 skeleton rounded-full" />
            ) : session ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  {session.user?.image ? (
                    <img src={session.user.image} alt="" className="w-7 h-7 rounded-full" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className="text-sm text-gray-300 max-w-[100px] truncate">{session.user?.name ?? session.user?.email}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 glass-card shadow-2xl shadow-black/40 py-1 z-50">
                    <div className="px-4 py-2.5 border-b border-gray-700/50">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-sm text-gray-200 truncate">{session.user?.email}</p>
                    </div>
                    <button
                      onClick={() => { signOut(); setUserMenuOpen(false); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => signIn()}
                className="btn-primary text-sm py-2 px-4"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-white/5 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-800/60 bg-gray-950/95 backdrop-blur-xl">
          <div className="px-4 pt-3 pb-4 space-y-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  pathname === href
                    ? 'bg-violet-500/15 text-violet-300'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-800/60">
              {session ? (
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/5 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              ) : (
                <button
                  onClick={() => signIn()}
                  className="w-full btn-primary"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
