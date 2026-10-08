import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@blog/core', '@blog/ui'],
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
