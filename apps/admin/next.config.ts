import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@blog/core'],
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
