import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatLakhs(value: number): string {
  if (value >= 100) {
    return `₹${(value / 100).toFixed(1)}Cr`;
  }
  return `₹${value.toFixed(1)}L`;
}

export function formatLakhsFull(value: number): string {
  return `₹${value.toFixed(2)} LPA`;
}

export function getPercentile(values: number[], percentile: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

export function calculatePercentileRank(values: number[], target: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const belowCount = sorted.filter((v) => v < target).length;
  return Math.round((belowCount / sorted.length) * 100);
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function normalizeCompanyName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function cityLabel(city: string): string {
  const map: Record<string, string> = {
    BANGALORE: 'Bangalore',
    MUMBAI: 'Mumbai',
    DELHI: 'Delhi',
    HYDERABAD: 'Hyderabad',
    PUNE: 'Pune',
    CHENNAI: 'Chennai',
    KOLKATA: 'Kolkata',
    NOIDA: 'Noida',
    GURGAON: 'Gurgaon',
    REMOTE: 'Remote',
    OTHER: 'Other',
  };
  return map[city] ?? city;
}

export function roleCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    SOFTWARE_ENGINEERING: 'Software Engineering',
    DATA_SCIENCE: 'Data Science',
    PRODUCT_MANAGEMENT: 'Product Management',
    DESIGN: 'Design',
    DEVOPS: 'DevOps',
    SECURITY: 'Security',
    MANAGEMENT: 'Management',
    SALES: 'Sales',
    MARKETING: 'Marketing',
    FINANCE: 'Finance',
    HR: 'HR',
    OTHER: 'Other',
  };
  return map[category] ?? category;
}

export function timeAgo(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
}
