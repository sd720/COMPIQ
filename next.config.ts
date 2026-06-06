import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'logo.clearbit.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  serverExternalPackages: ['pg', '@prisma/client', '@prisma/adapter-pg', 'prisma'],
  experimental: {
    serverActions: {},
  },
};

export default nextConfig;
