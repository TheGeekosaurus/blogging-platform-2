import Link from 'next/link';

import { codedRoutesFor, pagePath, pageUrl, type PostStatus } from '@blog/core';

import { setHomepage } from '@/app/actions/pages';
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
   * Pages that are React components in the repo rather than rows in `pages`.
   * They cannot be edited here, but they have to be VISIBLE here: a page that
   * renders on the live site while the admin says "no pages yet" reads as data
   * loss. Listed read-only, with a link out to the live URL.
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

      {pages.length === 0 ? (
        <p className="mt-10 text-slate-600">
          {coded.length > 0
            ? 'No pages in the database yet. The pages below are built in code — add one here and it will appear in this list.'
            : 'No pages yet. Pages live at the root of the site — /about, /projects/solar — while posts live under /blog.'}
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
          {pages.map((page) => {
            // Ordered by path, so depth can be read off the separators.
            const depth = page.path.split('/').length - 1;

            return (
              <li key={page.id} className="flex flex-wrap items-center gap-3 py-3">
                <span style={{ paddingLeft: `${depth * 1.25}rem` }}>
                  <Link href={`/pages/${page.id}`} className="font-medium">
                    {page.title}
                  </Link>
                </span>
                <code className="text-xs text-slate-500">{pagePath(page.path)}</code>
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLES[page.status]}`}
                >
                  {page.status}
                </span>
                {page.template === 'full' ? (
                  <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-900">
                    full width
                  </span>
                ) : null}
                {site.homepage_page_id === page.id && !homepageIsCoded ? (
                  <span className="rounded bg-slate-900 px-1.5 py-0.5 text-xs text-white">
                    homepage
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {coded.length > 0 ? (
        <section className="mt-10 border-t border-slate-200 pt-6">
          <h2 className="text-lg font-semibold">Built in code</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            These pages are React components, not database rows, so they cannot be edited
            here — their layouts carry embedded forms and custom styling. The copy lives in{' '}
            <code className="text-xs">apps/blog/components/marketing/</code> and changing it
            takes a deploy.
          </p>

          <ul className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
            {coded.map((route) => (
              <li key={route.path} className="flex flex-wrap items-center gap-3 py-3">
                <span className="font-medium">{route.title}</span>
                <code className="text-xs text-slate-500">{pagePath(route.path)}</code>
                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-700">
                  code
                </span>
                {route.path === '' ? (
                  <span className="rounded bg-slate-900 px-1.5 py-0.5 text-xs text-white">
                    homepage
                  </span>
                ) : null}
                {!route.index ? (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900">
                    not in sitemap
                  </span>
                ) : null}
                <a
                  href={pageUrl(site, pagePath(route.path))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-sm underline"
                >
                  View live ↗
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10 max-w-xl border-t border-slate-200 pt-6">
        <h2 className="text-lg font-semibold">Homepage</h2>

        {homepageIsCoded ? (
          <p className="mt-1 text-sm text-slate-600">
            <code>{site.base_url}/</code> is served by a coded route, listed above. That
            takes precedence over any page chosen here, so there is nothing to set.
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
