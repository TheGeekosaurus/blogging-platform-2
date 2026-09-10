import Link from 'next/link';

import { codedRoutesFor, isLive, pagePath, pageUrl, type PostStatus } from '@blog/core';

import { setHomepage } from '@/app/actions/pages';
import { ViewLiveLink } from '@/components/view-live-link';
import { requireCurrentSite } from '@/lib/current-site';
import { listPages } from '@/lib/queries';

export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<PostStatus, string> = {
  published: 'bg-emerald-100 text-emerald-900',
  draft: 'bg-slate-200 text-slate-700',
  scheduled: 'bg-sky-100 text-sky-900',
  archived: 'bg-amber-100 text-amber-900',
};

export default async function PagesPage() {
  const site = await requireCurrentSite();
  const pages = await listPages(site.id);

  /*
   * Coded routes have their own screen now, at /pages/coded. They are still
   * counted here because the two lists together are "the pages on this site",
   * and a reader who sees an empty table needs to know the other list exists —
   * otherwise the admin appears to have lost pages that are live.
   */
  const coded = codedRoutesFor(site.slug);

  /* The homepage is a coded route on this site, so `homepage_page_id` has no
   * effect no matter what it is set to. Offering the selector anyway would be a
   * control that silently does nothing. */
  const homepageIsCoded = coded.some((route) => route.path === '');

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Pages</h1>
        <Link
          href="/pages/new"
          className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        >
          New page
        </Link>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        Edited here and stored in the database.{' '}
        {coded.length > 0 ? (
          <>
            <Link href="/pages/coded">{coded.length} more</Link> are built in code and
            cannot be edited here.
          </>
        ) : null}
      </p>

      {pages.length === 0 ? (
        <p className="mt-10 text-slate-600">
          {coded.length > 0
            ? 'No pages in the database yet — add one here and it will appear in this table.'
            : 'No pages yet. Pages live at the root of the site — /about, /projects/solar — while posts live under /blog.'}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded border border-slate-300">
          <table className="wp-table">
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Path</th>
                <th scope="col">Template</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => {
                // Ordered by path, so depth can be read off the separators.
                const depth = page.path.split('/').length - 1;

                return (
                  <tr key={page.id}>
                    <td>
                      <div
                        className="flex items-start gap-2"
                        style={{ paddingLeft: `${depth * 1.25}rem` }}
                      >
                        <Link
                          href={`/pages/${page.id}`}
                          className="font-semibold"
                        >
                          {page.title}
                        </Link>
                        {site.homepage_page_id === page.id && !homepageIsCoded ? (
                          <span className="rounded bg-slate-900 px-1.5 py-0.5 text-xs text-white">
                            homepage
                          </span>
                        ) : null}
                        {/*
                          Absent on a draft, a scheduled page, or one dated in
                          the future: the blog serves none of those, so the icon
                          would lead to a 404 and the author could not tell
                          whether the link or their page was broken.
                        */}
                        {isLive(page) ? (
                          <ViewLiveLink
                            href={pageUrl(site, pagePath(page.path))}
                            label={page.title}
                          />
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <code className="text-xs text-slate-500">{pagePath(page.path)}</code>
                    </td>
                    <td className="whitespace-nowrap">
                      {page.template === 'full' ? 'Full width' : 'Prose'}
                    </td>
                    <td>
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLES[page.status]}`}
                      >
                        {page.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <section className="mt-10 max-w-xl border-t border-slate-200 pt-6">
        <h2 className="text-lg font-semibold">Homepage</h2>

        {homepageIsCoded ? (
          <p className="mt-1 text-sm text-slate-600">
            <code>{site.base_url}/</code> is served by a{' '}
            <Link href="/pages/coded">coded route</Link>. That takes precedence over any
            page chosen here, so there is nothing to set.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-slate-600">
              Which page is served at <code>{site.base_url}/</code>. Leave it unset and the
              homepage falls back to a list of recent posts.
            </p>

            <form action={setHomepage} className="mt-3 flex flex-wrap items-center gap-2">
              <label htmlFor="page_id" className="sr-only">
                Homepage
              </label>
              <select
                id="page_id"
                name="page_id"
                defaultValue={site.homepage_page_id ?? ''}
                className="rounded border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="">(recent posts)</option>
                {pages
                  .filter((page) => page.status === 'published')
                  .map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.title} — /{page.path}
                    </option>
                  ))}
              </select>
              <button
                type="submit"
                className="rounded border border-slate-300 px-3 py-2 text-sm"
              >
                Set homepage
              </button>
            </form>
            <p className="mt-2 text-xs text-slate-500">
              Only published pages can be the homepage — a draft would leave the front door
              showing nothing.
            </p>
          </>
        )}
      </section>
    </>
  );
}
