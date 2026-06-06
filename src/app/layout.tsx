import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'CompIQ — Compensation Intelligence for Indian Tech',
  description: 'Level-based salary intelligence platform for Indian tech professionals. Compare compensation by role, level, and company — not just job titles.',
  keywords: 'salary, compensation, tech jobs, India, levels, SDE, engineer, TC, total compensation',
  openGraph: {
    title: 'CompIQ — Know Your Worth',
    description: 'Compensation intelligence for Indian tech. Compare TC by level, role, and company.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-gray-950 text-gray-50 antialiased`}>
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <footer className="border-t border-gray-800 py-8 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
              <p className="mb-1">
                <span className="text-violet-400 font-semibold">CompIQ</span> — Compensation Intelligence for Indian Tech
              </p>
              <p>Data is crowdsourced and anonymized. All amounts in INR Lakhs per annum (LPA).</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
