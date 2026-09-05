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

  /*
   * The loan calculator, proxied so it answers on this domain.
   *
   * A REWRITE, not a redirect: the URL stays /calc, so the hero button, the CTA
   * card and the nav can all point at one path on one domain while the app
   * itself keeps running where it already runs.
   *
   * Deliberately one-way. calc.nanotomcapital.com is left up and untouched —
   * pointing it back here would build a chain that has to be unpicked when the
   * rest of the redirects land at domain transfer. That is one pass, later.
   *
   * Two rules because `trailingSlash: true` means /calc/ and /calc/anything are
   * different matches, and a single :path* would not cover the bare path.
   */
  async rewrites() {
    return [
      { source: '/calc', destination: 'https://calc.nanotomcapital.com' },
      { source: '/calc/:path*', destination: 'https://calc.nanotomcapital.com/:path*' },
    ];
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
