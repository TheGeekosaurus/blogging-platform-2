import type { SiteRow } from '@blog/core';

import { switchSite } from '@/app/actions/site';

/**
 * Server Component: a plain form, so switching sites needs no client JS.
 * Auto-submits on change when JS is available, and still works without it.
 */
export function SiteSwitcher({
  sites,
  currentId,
}: {
  sites: SiteRow[];
  currentId: string;
}) {
  if (sites.length <= 1) {
    return <span className="text-sm font-medium">{sites[0]?.name ?? 'No site'}</span>;
  }

  return (
    <form action={switchSite} className="flex items-center gap-2">
      <label htmlFor="site_id" className="sr-only">
        Site
      </label>
      <select
        id="site_id"
        name="site_id"
        defaultValue={currentId}
        className="rounded border border-slate-300 px-2 py-1 text-sm"
      >
        {sites.map((site) => (
          <option key={site.id} value={site.id}>
            {site.name}
          </option>
        ))}
      </select>
      <button type="submit" className="rounded border border-slate-300 px-2 py-1 text-sm">
        Switch
      </button>
    </form>
  );
}
