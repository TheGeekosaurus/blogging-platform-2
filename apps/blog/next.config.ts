import type { NextConfig } from 'next';

import {
  createPublicClient,
  listRedirects,
  requireSiteBySlug,
  siteSlug,
  supabaseHostname,
} from '@blog/core';

/**
 * Redirects are resolved at BUILD time and emitted into the Vercel routing
 * layer, so an old WordPress URL costs zero function invocations to redirect.
 *
 * The tradeoff, accepted knowingly: adding a redirect needs a redeploy, unlike
 * publishing a post. That suits redirects, which are a migration-time concern.
 *
 * This deliberately does NOT swallow errors. A silently-empty redirect table
 * would look like a successful build while quietly dropping every inbound link
 * from the old site — far worse than a failed build that tells you why.
 */
async function loadRedirects() {
  const client = createPublicClient();
  const site = await requireSiteBySlug(client, siteSlug());
  const rows = await listRedirects(client, site.id);

  return rows.map((row) => ({
    source: row.from_path,
    destination: row.to_path,
    permanent: row.status_code === 301 || row.status_code === 308,
  }));
}

const nextConfig: NextConfig = {
  // @blog/core ships TypeScript source rather than a build artifact, so there is
  // no separate build step between editing a shared module and seeing it apply.
  transpilePackages: ['@blog/core'],

  reactStrictMode: true,
  poweredByHeader: false,

  // Trailing slashes match the WordPress `/%postname%/` convention, so inbound
  // links to `/some-post/` resolve without a redirect hop.
  trailingSlash: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname(),
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  async redirects() {
    return loadRedirects();
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;
