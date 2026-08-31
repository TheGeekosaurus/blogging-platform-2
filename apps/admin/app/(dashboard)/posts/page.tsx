import Link from 'next/link';

import { formatPostDate, type PostStatus } from '@blog/core';

import { requireCurrentSite } from '@/lib/current-site';
import { listAllTerms, listPosts, POSTS_PER_PAGE } from '@/lib/queries';

export const dynamic = 'force-dynamic';

const STATUS_TABS: Array<{ value: PostStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
  { value: 'archived', label: 'Archived' },
];

const STATUS_STYLES: Record<PostStatus, string> = {
  published: 'bg-emerald-100 text-emerald-900',
  draft: 'bg-slate-200 text-slate-700',
  scheduled: 'bg-sky-100 text-sky-900',
  archived: 'bg-amber-100 text-amber-900',
};

function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const site = await requireCurrentSite();

  const status = (typeof params.status === 'string' ? params.status : 'all') as
    | PostStatus
    | 'all';
  const termId = typeof params.term === 'string' ? params.term : undefined;
  const search = typeof params.q === 'string' ? params.q : undefined;
  const page = Number(typeof params.page === 'string' ? params.page : '1') || 1;

  const [{ posts, total }, terms] = await Promise.all([
    listPosts(site.id, { status, termId, search, page }),
    listAllTerms(site.id),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
  const categories = terms.filter((term) => term.kind === 'category');

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Posts</h1>
        <Link
          href="/posts/new"
          className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        >
          New post
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <nav className="flex gap-3 text-sm">
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={`/posts${buildQuery({ status: tab.value === 'all' ? undefined : tab.value, term: termId, q: search })}`}
              className={status === tab.value ? 'font-semibold underline' : 'text-slate-600'}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <form action="/posts" className="ml-auto flex items-center gap-2">
          {status !== 'all' ? <input type="hidden" name="status" value={status} /> : null}
          <label htmlFor="q" className="sr-only">
            Search titles
          </label>
          <input
            id="q"
            name="q"
            defaultValue={search ?? ''}
            placeholder="Search titles"
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          />
          {categories.length > 0 ? (
            <>
              <label htmlFor="term" className="sr-only">
                Category
              </label>
              <select
                id="term"
                name="term"
                defaultValue={termId ?? ''}
                className="rounded border border-slate-300 px-2 py-1 text-sm"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </>
          ) : null}
          <button type="submit" className="rounded border border-slate-300 px-2 py-1 text-sm">
            Filter
          </button>
        </form>
      </div>

      {posts.length === 0 ? (
        <p className="mt-10 text-slate-600">
          No posts match. <Link href="/posts/new">Write one</Link>, or import from WordPress
          with <code>pnpm wp-import</code>.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
          {posts.map((post) => (
            <li key={post.id} className="flex flex-wrap items-center gap-3 py-3">
              <Link href={`/posts/${post.id}`} className="font-medium">
                {post.title}
              </Link>
              <span
                className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLES[post.status]}`}
              >
                {post.status}
              </span>
              <span className="ml-auto text-sm text-slate-500">
                {post.published_at
                  ? formatPostDate(post.published_at, site.locale)
                  : `edited ${formatPostDate(post.updated_at, site.locale)}`}
              </span>
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 ? (
        <nav className="mt-6 flex justify-between text-sm">
          {page > 1 ? (
            <Link href={`/posts${buildQuery({ status: status === 'all' ? undefined : status, term: termId, q: search, page: String(page - 1) })}`}>
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-slate-500">
            Page {page} of {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={`/posts${buildQuery({ status: status === 'all' ? undefined : status, term: termId, q: search, page: String(page + 1) })}`}>
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </>
  );
}
