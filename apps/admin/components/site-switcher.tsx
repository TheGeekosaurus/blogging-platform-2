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
  /*
   * A raised panel rather than a bare label-and-select.
   *
   * On a dark rail the old treatment read as part of the navigation below it,
   * which is wrong: this is the thing that decides what the navigation points
   * at. Giving it its own surface separates the two without a divider rule.
   */
  if (sites.length <= 1) {
    return (
      <div className="rounded-control bg-rail-raised px-3 py-2">
        <p className="text-[0.625rem] uppercase tracking-[0.12em] text-rail-ink">
          Editing
        </p>
        <p className="truncate text-sm font-semibold text-rail-ink-strong">
          {sites[0]?.name ?? 'No site'}
        </p>
      </div>
    );
  }

  return (
    <form action={switchSite} className="rounded-control bg-rail-raised px-3 py-2">
      <label
        htmlFor="site_id"
        className="block text-[0.625rem] uppercase tracking-[0.12em] text-rail-ink"
      >
        Editing
      </label>
      <select
        id="site_id"
        name="site_id"
        defaultValue={currentId}
        /* No .field here: that class is for controls on white, and its border
           and focus shadow both disappear against the rail. */
        className="mt-0.5 w-full cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-rail-ink-strong focus:outline-none"
      >
        {sites.map((site) => (
          <option key={site.id} value={site.id} className="text-ink">
            {site.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="mt-1 text-xs text-rail-ink underline transition-colors hover:text-rail-ink-strong"
      >
        Switch
      </button>
    </form>
  );
}
