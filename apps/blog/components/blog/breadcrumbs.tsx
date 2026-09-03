import Link from 'next/link';

import type { Crumb } from '@blog/core';

/**
 * The visible breadcrumb trail above a post title.
 *
 * Takes the trail rather than building it, because the JSON-LD in json-ld.tsx
 * renders the same `postBreadcrumbs` output. Two lists built independently is
 * how the page and the structured data end up disagreeing.
 *
 * The last crumb is the current page: rendered as text with `aria-current`, not
 * as a link. The trail carries a path for it — schema.org wants one for every
 * position — but a link to the page you are already on is a dead control.
 */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;

          return (
            <li key={crumb.path} className="flex items-center gap-x-2">
              {index > 0 ? (
                <span aria-hidden="true" className="text-[var(--color-ink-muted)]">
                  /
                </span>
              ) : null}

              {last ? (
                <span
                  aria-current="page"
                  /* Long titles would otherwise push the trail onto three lines. */
                  className="line-clamp-1 text-[var(--color-ink-muted)]"
                >
                  {crumb.name}
                </span>
              ) : (
                <Link
                  href={crumb.path}
                  className="!text-[var(--color-ink-muted)] no-underline transition-colors hover:!text-[var(--color-accent)]"
                >
                  {crumb.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
