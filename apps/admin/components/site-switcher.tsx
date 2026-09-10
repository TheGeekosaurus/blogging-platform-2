import type { SiteRow } from '@blog/core';

import { switchSite } from '@/app/actions/site';

/**
 * Which blog you are editing. Sits at the top of the rail, above the navigation,
 * because it changes what every screen below it means.
 *
 * Server Component: a plain form and a submit button, so switching needs no
 * client JS at all.
 *
 * It does NOT auto-submit on change. The docstring here used to claim it did,
 * which was never true — an `onChange` handler cannot cross the server/client
 * boundary, so adding one would either not compile or force this leaf (and the
 * layout that renders it) into a client component to save one click.
 */
export function SiteSwitcher({
  sites,
  currentId,
}: {
  sites: SiteRow[];
  currentId: string;
}) {
  if (sites.length <= 1) {
    return (
      <div>
        <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--color-wp-nav-ink)]">
          Editing
        </p>
        <p className="truncate text-sm font-semibold text-white">
          {sites[0]?.name ?? 'No site'}
        </p>
      </div>
    );
  }

  return (
    <form action={switchSite}>
      <label
        htmlFor="site_id"
        className="block text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--color-wp-nav-ink)]"
      >
        Editing
      </label>
      <select
        id="site_id"
        name="site_id"
        defaultValue={currentId}
        className="mt-1 w-full rounded border border-white/15 bg-white/5 px-2 py-1.5 text-sm font-semibold text-white"
      >
        {sites.map((site) => (
          <option key={site.id} value={site.id} className="text-slate-900">
            {site.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="mt-1.5 text-xs text-[var(--color-wp-nav-ink)] underline hover:text-white"
      >
        Switch
      </button>
    </form>
  );
}
