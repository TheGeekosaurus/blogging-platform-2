import Link from 'next/link';

import { codedRoutesFor, pagePath, pageUrl } from '@blog/core';

import { ViewLiveLink } from '@/components/view-live-link';
import { requireCurrentSite } from '@/lib/current-site';

export const dynamic = 'force-dynamic';

/**
 * Pages that are React components in the repo rather than rows in `pages`.
 *
 * They cannot be edited here, but they have to be VISIBLE here: a page that
 * renders on the live site while the admin says "no pages yet" reads as data
 * loss. They used to sit in a second section below the editable pages on
 * /pages; splitting them onto their own screen keeps that table to the rows the
 * button above it can actually create.
 *
 * A static segment beats the `[id]` sibling, so /pages/coded resolves here
 * rather than to a page lookup — the same way /pages/new already does. Page ids
 * are UUIDs, so no real row can be shadowed by this path.
 */
export default async function CodedPagesPage() {
  const site = await requireCurrentSite();
  const coded = codedRoutesFor(site.slug);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Built in Code</h1>
        <Link href="/pages" className="text-sm">
          ← All pages
        </Link>
      </div>

      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        These pages are React components, not database rows, so they cannot be edited here —
        their layouts carry embedded forms and custom styling. The copy lives in{' '}
        <code className="text-xs">apps/blog/components/marketing/</code> and changing it
        takes a deploy.
      </p>

      {coded.length === 0 ? (
        <p className="mt-10 text-slate-600">
          This site has no coded pages. Every page it serves is editable under{' '}
          <Link href="/pages">Pages</Link>.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded border border-slate-300">
          <table className="wp-table">
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Path</th>
                <th scope="col">Sitemap</th>
              </tr>
            </thead>
            <tbody>
              {coded.map((route) => (
                <tr key={route.path}>
                  <td>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-slate-900">{route.title}</span>
                      {route.path === '' ? (
                        <span className="rounded bg-slate-900 px-1.5 py-0.5 text-xs text-white">
                          homepage
                        </span>
                      ) : null}
                      {/* The same control the editable table uses — one action,
                          one affordance. */}
                      <ViewLiveLink
                        href={pageUrl(site, pagePath(route.path))}
                        label={route.title}
                      />
                    </div>
                  </td>
                  <td>
                    <code className="text-xs text-slate-500">{pagePath(route.path)}</code>
                  </td>
                  <td className="whitespace-nowrap">
                    {route.index ? (
                      'Listed'
                    ) : (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900">
                        not in sitemap
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
