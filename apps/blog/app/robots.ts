import type { MetadataRoute } from 'next';

import { absoluteUrl } from '@blog/core';

import { getSite } from '@/lib/site';

export const dynamic = 'force-static';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSite();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // No public value and it is not a page; keeping crawlers out of it avoids
      // pointless 401s in the logs.
      disallow: '/api/',
    },
    sitemap: absoluteUrl(site, '/sitemap.xml'),
  };
}
