import Link from 'next/link';

import { codedRoutesFor, isLive, pagePath, pageUrl, type PostStatus } from '@blog/core';

import { setHomepage } from '@/app/actions/pages';
import { Pagination, parsePage } from '@/components/pagination';
import { ViewLiveLink } from '@/components/view-live-link';
import { requireCurrentSite } from '@/lib/current-site';
import { ADMIN_PER_PAGE, listAllPages, listPages } from '@/lib/queries';

export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<PostStatus, string> = {
  published: 'bg-emerald-100 text-emerald-900',
  draft: 'bg-slate-200 text-slate-700',
  scheduled: 'bg-sky-100 text-sky-900',
  archived: 'bg-amber-100 text-amber-900',
};

export default async function PagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const site = await requireCurrentSite();
  const page = parsePage(typeof params.page === 'string' ? params.page : undefined);

  /*
   * Two reads, deliberately. The table shows one page of rows; the homepage
   * selector below has to offer every published page, including ones the table
   * is not currently showing. Sharing one paginated list would silently shrink
   * the dropdown to whatever page the reader happened to be on — a control
   * that cannot reach most of its own options and does not look broken.
   */
  const [{ pages, total }, allPages] = await Promise.all([
    listPages(site.id, page),
    listAllPages(site.id),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / ADMIN_PER_PAGE));

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

      {total === 0 ? (
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
              {pages.map((row) => {
                // Ordered by path, so depth can be read off the separators —
                // and it stays correct across a page break, because the path
                // carries the depth rather than the list position doing it.
                const depth = row.path.split('/').length - 1;

                return (
                  <tr key={row.id}>
                    <td>
                      <div
                        className="flex items-start gap-2"
                        style={{ paddingLeft: `${depth * 1.25}rem` }}
                      >
                        <Link
                          href={`/pages/${row.id}`}
                          className="font-semibold"
                        >
                          {row.title}
                        </Link>
                        {site.homepage_page_id === row.id && !homepageIsCoded ? (
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
                        {isLive(row) ? (
                          <ViewLiveLink
                            href={pageUrl(site, pagePath(row.path))}
                            label={row.title}
                          />
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <code className="text-xs text-slate-500">{pagePath(row.path)}</code>
                    </td>
                    <td className="whitespace-nowrap">
                      {row.template === 'full' ? 'Full width' : 'Prose'}
                    </td>
                    <td>
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLES[row.status]}`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        basePath="/pages"
        page={page}
        pageCount={pageCount}
        total={total}
        label="page"
      />

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
                {allPages
                  .filter((option) => option.status === 'published')
                  .map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title} — /{option.path}
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
