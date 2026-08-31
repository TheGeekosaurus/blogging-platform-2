import type { SiteRow } from './database.types';
import { supabaseUrl } from './env';

/** Storage bucket holding uploaded images. */
export const MEDIA_BUCKET = 'media';

/**
 * URL construction.
 *
 * The site serves pages at the root (`/about`, `/projects/solar`) and posts
 * under `/blog/`. Every public path is built through these helpers, which is
 * what made moving posts under /blog a contained change rather than a hunt
 * through every template.
 */

/** Blog posts live under /blog/. Pages own the root. */
export const BLOG_BASE = '/blog';

export function postPath(slug: string): string {
  return `${BLOG_BASE}/${slug}`;
}

export function blogIndexPath(): string {
  return BLOG_BASE;
}

/**
 * Public path for a page, from its materialised `path` column.
 * An empty path is the homepage.
 */
export function pagePath(path: string): string {
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}` : '/';
}

/** Numbered blog pagination. Page 1 is the blog index itself. */
export function blogPagePath(pageNumber: number): string {
  return pageNumber <= 1 ? BLOG_BASE : `${BLOG_BASE}/page/${pageNumber}`;
}

/** Index of all categories and tags. */
export function browsePath(): string {
  return `${BLOG_BASE}/categories`;
}

export function categoryPath(slug: string): string {
  return `${BLOG_BASE}/category/${slug}`;
}

export function tagPath(slug: string): string {
  return `${BLOG_BASE}/tag/${slug}`;
}

/** Absolute URL for canonical tags, sitemap entries and RSS links. */
export function absoluteUrl(site: Pick<SiteRow, 'base_url'>, path: string): string {
  const base = site.base_url.replace(/\/+$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

/**
 * Public URL for a stored image.
 *
 * Tolerates an absolute URL in `storage_path` so a future importer can record an
 * image it has not yet copied into Storage without breaking rendering.
 */
export function mediaPublicUrl(storagePath: string): string {
  if (/^https?:\/\//i.test(storagePath)) return storagePath;
  const path = storagePath.replace(/^\/+/, '');
  return `${supabaseUrl().replace(/\/+$/, '')}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
}

/** Hostname of the Supabase project, for next.config image remotePatterns. */
export function supabaseHostname(): string {
  return new URL(supabaseUrl()).hostname;
}

/**
 * Derive a URL slug from a title.
 *
 * Used by the admin when creating a post and by the WordPress importer when an
 * export has no `wp:post_name`. Never used to *change* an existing slug — that
 * would break inbound links.
 */
export function slugify(title: string): string {
  const base = title
    .normalize('NFKD')
    // Strip combining diacritical marks left behind by NFKD (é -> e).
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'untitled';
}

/**
 * Absolute URL for a PAGE, with the trailing slash the blog serves.
 *
 * apps/blog sets `trailingSlash: true` so inbound WordPress links like
 * `/some-post/` resolve without a redirect hop. Sitemap and feed entries must
 * match that exactly, or every entry costs a redirect and canonical tags
 * disagree with the URLs being advertised.
 *
 * Paths that name a file (`/feed.xml`) are left alone — those are not pages.
 */
export function pageUrl(site: Pick<SiteRow, 'base_url'>, path: string): string {
  const url = absoluteUrl(site, path);
  const isFile = /\.[a-z0-9]+$/i.test(new URL(url).pathname);
  if (isFile || url.endsWith('/')) return url;
  return `${url}/`;
}
