import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from '@/lib/og-card';
import { getSite } from '@/lib/site';

export const alt = 'Site preview';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/**
 * The site-level card.
 *
 * Placed at the app root deliberately: in the App Router an opengraph-image
 * applies to its segment AND every descendant that does not define its own. So
 * this one file gives a card to the homepage, /get-funded, /calc, /services,
 * the policy pages, /blog, the category and tag archives and the pagination —
 * every route that previously shared to LinkedIn or Slack as a bare grey box.
 *
 * Posts, database pages and author archives override it with their own titled
 * versions.
 */
export default async function Image() {
  const site = await getSite();

  return ogCard({
    title: site.name,
    eyebrow: null,
    footer: site.description ?? new URL(site.base_url).host,
  });
}
