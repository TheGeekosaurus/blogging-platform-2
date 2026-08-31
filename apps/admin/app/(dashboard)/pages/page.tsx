import Link from 'next/link';

import { pagePath, type PostStatus } from '@blog/core';

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
          No pages yet. Pages live at the root of the site — <code>/about</code>,{' '}
          <code>/projects/solar</code> — while posts live under <code>/blog</code>.
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
                {site.homepage_page_id === page.id ? (
                  <span className="rounded bg-slate-900 px-1.5 py-0.5 text-xs text-white">
                    homepage
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <section className="mt-10 max-w-xl border-t border-slate-200 pt-6">
        <h2 className="text-lg font-semibold">Homepage</h2>
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
          <button type="submit" className="rounded border border-slate-300 px-3 py-2 text-sm">
            Set homepage
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-500">
          Only published pages can be the homepage — a draft would leave the front door
          showing nothing.
        </p>
      </section>
    </>
  );
}
