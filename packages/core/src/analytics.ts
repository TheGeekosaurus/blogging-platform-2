/**
 * Google Tag Manager container ids.
 *
 * One container per site, stored on the site's row and set in the admin under
 * Settings. GTM is the only tracking mechanism this codebase has: everything
 * else — GA4, the Facebook pixel, conversion tags — is configured as a tag
 * INSIDE the container. Two hardcoded copies of one pixel double-count
 * conversions, and the second copy is invisible to whoever maintains the tag
 * setup.
 *
 * This lives in @blog/core rather than beside the component that renders it
 * because three places have to agree on what a valid id is: the admin's save
 * action, the blog's renderer, and the check constraint in
 * 0012_gtm_container.sql. Two of them are in different deployments.
 */

/**
 * What a container id may contain.
 *
 * `GTM-` plus uppercase alphanumerics, which is the format Google issues, and
 * — not coincidentally — a character set with no way to terminate a string
 * literal or a script tag. That matters because the id is interpolated into an
 * inline <script> on every page of the site that carries it, so a value with a
 * quote or a brace in it would stop being an identifier and start being page
 * JavaScript. Mirrored by `sites_gtm_container_format` in the database.
 */
export const GTM_CONTAINER_PATTERN = /^GTM-[A-Z0-9]+$/;

/**
 * The container id to use, or null if there is not a usable one.
 *
 * Returns null rather than throwing on a bad value, because both callers want
 * the same thing from a malformed id: render nothing. A site with no tracking
 * is a missing report; a site that fails to build, or throws mid-render on a
 * reader's request, is an outage.
 *
 * Case is normalised rather than rejected. Container ids are uppercase and
 * copy-paste from the GTM console gives you an uppercase one, but somebody
 * retyping `gtm-w5d5nv8x` has given us an unambiguous answer and refusing it
 * would be pedantry.
 */
export function readGtmContainerId(value: string | null | undefined): string | null {
  if (!value) return null;

  const id = value.trim().toUpperCase();
  return GTM_CONTAINER_PATTERN.test(id) ? id : null;
}
