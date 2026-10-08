import type { SiteRow } from '@blog/core';

import { switchSite } from '@/app/actions/site';

/**
 * Which blog you are editing. Lives in the account panel at the foot of the
 * rail, with the settings and the way out, because it is the widest-scoped
 * control in the app — every list, editor and URL below it is scoped to
 * whatever it says — and none of those three is a place you navigate to.
 *
 * IT USED TO SIT ON THE DARK RAIL, as a raised panel of its own above the
 * navigation. The treatment it needed there is gone with it, and the comment
 * that used to sit on the select said why it was needed: ".field is for
 * controls on white, and its border and focus shadow both disappear against the
 * rail". On white, that stops being true, so this is now the same field as
 * every other select in the admin instead of a bespoke transparent one.
 *
 * STILL NO AUTO-SUBMIT ON CHANGE, and now that is a choice rather than a
 * limitation. The old docstring blamed the server/client boundary — an
 * `onChange` handler cannot cross it — and the panel around this is a client
 * component now, so it could. It does not, because a <select> fires `change`
 * on arrow-key navigation in some browsers, and arrowing past an entry would
 * swap the entire workspace out from under you. The roadmap's priority picker
 * commits on select because the cost of a wrong one is one field; the cost here
 * is every screen.
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
        <p className="text-[0.625rem] uppercase tracking-[0.12em] text-ink-muted">
          Editing
        </p>
        <p className="truncate text-sm font-semibold text-ink">
          {sites[0]?.name ?? 'No site'}
        </p>
      </div>
    );
  }

  return (
    <form action={switchSite}>
      <label
        htmlFor="site_id"
        className="block text-[0.625rem] uppercase tracking-[0.12em] text-ink-muted"
      >
        Editing
      </label>
      {/* One row, not two stacked full-width controls: a select and its own
          submit button are one gesture, and giving Switch the whole width made
          it read as the panel's main action rather than the select's. */}
      <div className="mt-1 flex items-center gap-2">
        <select
          id="site_id"
          name="site_id"
          defaultValue={currentId}
          className="field field-sm min-w-0 flex-1"
        >
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-ghost btn-sm shrink-0">
          Switch
        </button>
      </div>
    </form>
  );
}
