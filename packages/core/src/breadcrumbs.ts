import type { SiteRow, TermRow } from './database.types';
import { blogIndexPath, categoryPath, postPath } from './urls';

/**
 * The breadcrumb trail for a post.
 *
 * One source for two renderings: the visible `<nav>` on the page and the
 * schema.org BreadcrumbList in the JSON-LD. They used to be independent — the
 * structured data existed with no trail on the page — and hand-writing the
 * second would have given two lists that agree the day they are written and
 * quietly disagree after the next edit. Google comparing a trail it can see
 * against one it is told about is exactly the disagreement worth avoiding.
 *
 * Paths are relative. The nav uses them as-is; the JSON-LD makes them absolute,
 * which is what schema.org requires and the page does not want.
 */
export interface Crumb {
  name: string;
  path: string;
}

/**
 * The last crumb — the post itself — is included.
 *
 * It carries a path even though the page never links it: schema.org wants an
 * `item` for every position, while a breadcrumb whose last entry links to the
 * page you are on is a dead control. The renderer decides; the trail just
 * describes.
 */
export function postBreadcrumbs(
  site: Pick<SiteRow, 'name'>,
  post: { slug: string; title: string },
  category: Pick<TermRow, 'slug' | 'name'> | undefined,
): Crumb[] {
  return [
    { name: site.name, path: '/' },
    { name: 'Blog', path: blogIndexPath() },
    ...(category ? [{ name: category.name, path: categoryPath(category.slug) }] : []),
    { name: post.title, path: postPath(post.slug) },
  ];
}
