import Link from 'next/link';

import { formatPostDate, isLive, pageUrl, postPath, type PostStatus } from '@blog/core';

import { StatusChip } from '@/components/ui/status-chip';
import { EmptyState } from '@/components/ui/empty-state';
import { DataTable } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination, parsePage } from '@/components/pagination';
import { ViewLiveLink } from '@/components/view-live-link';
import { requireCurrentSite } from '@/lib/current-site';
import { ADMIN_PER_PAGE, listAllTerms, listPosts } from '@/lib/queries';

export const dynamic = 'force-dynamic';

const STATUS_TABS: Array<{ value: PostStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
  { value: 'archived', label: 'Archived' },
];

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
  const page = parsePage(typeof params.page === 'string' ? params.page : undefined);

  const [{ posts, total }, terms] = await Promise.all([
    listPosts(site.id, { status, termId, search, page }),
    listAllTerms(site.id),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / ADMIN_PER_PAGE));
  const categories = terms.filter((term) => term.kind === 'category');

  return (
    <>
      <PageHeader
        title="Posts"
        actions={
          <Link
            href="/posts/new"
            className="btn btn-primary"
          >
            New post
          </Link>
        }
      />

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <nav className="flex gap-3 text-sm">
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={`/posts${buildQuery({ status: tab.value === 'all' ? undefined : tab.value, term: termId, q: search })}`}
              className={status === tab.value ? 'font-semibold underline' : 'text-ink-muted'}
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
            className="field field-sm field-inline"
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
                className="field field-sm field-inline"
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
          <button type="submit" className="field field-sm field-inline">
            Filter
          </button>
        </form>
      </div>

      {posts.length === 0 ? (
        <EmptyState>
          No posts match. <Link href="/posts/new">Write one</Link>, or import from WordPress
          with <code>pnpm wp-import</code>.
        </EmptyState>
      ) : (
        /*
         * `overflow-x-auto` on the wrapper, not the table: on a narrow window the
         * table scrolls inside its own box rather than pushing the whole page
         * sideways, which is what a min-width on the table alone would do.
         */
        <DataTable>
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Author</th>
              <th scope="col">Categories</th>
              <th scope="col">Status</th>
              <th scope="col">Date</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td>
                  <div className="flex items-start gap-2">
                    <Link
                      href={`/posts/${post.id}`}
                      className="font-semibold"
                    >
                      {post.title}
                    </Link>
                    {/* Only when the post is actually served — see isLive. */}
                    {isLive(post) ? (
                      <ViewLiveLink
                        href={pageUrl(site, postPath(post.slug))}
                        label={post.title}
                      />
                    ) : null}
                  </div>
                </td>
                <td className="whitespace-nowrap">{post.author_name ?? '—'}</td>
                <td>{post.categories.length > 0 ? post.categories.join(', ') : '—'}</td>
                <td>
                  <StatusChip status={post.status} />
                </td>
                <td className="whitespace-nowrap">
                  {post.published_at ? (
                    formatPostDate(post.published_at, site.locale)
                  ) : (
                    <span className="text-ink-muted">
                      edited {formatPostDate(post.updated_at, site.locale)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}

      {/* Newer/Older rather than Previous/Next: this table is ordered by edit
          date, so the reader is moving through time, not through an index. */}
      <Pagination
        basePath="/posts"
        page={page}
        pageCount={pageCount}
        total={total}
        label="post"
        prevLabel="← Newer"
        nextLabel="Older →"
        query={{
          status: status === 'all' ? undefined : status,
          term: termId,
          q: search,
        }}
      />
    </>
  );
}
