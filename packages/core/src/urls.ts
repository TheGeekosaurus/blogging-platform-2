import type { SiteRow } from './database.types';
import { supabaseUrl } from './env';

/** Storage bucket holding uploaded images. */
export const MEDIA_BUCKET = 'media';

/**
 * URL construction.
 *
 * Permalinks are flat — `/post-name/` — matching the existing WordPress
 * `/%postname%/` setting. Every public path is built through these helpers so
 * that a future change to permalink shape has exactly one place to touch.
 */

export function postPath(slug: string): string {
  return `/${slug}`;
}

export function categoryPath(slug: string): string {
  return `/category/${slug}`;
}

export function tagPath(slug: string): string {
  return `/tag/${slug}`;
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
