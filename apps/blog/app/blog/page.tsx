import Link from 'next/link';

import {
  POSTS_PER_PAGE,
  blogPagePath,
  countPublishedPosts,
  listPublishedPosts,
} from '@blog/core';

import { PostCard } from '@/components/post-card';
import { getClient, getSite } from '@/lib/site';
import { ReadingColumn } from '@/components/reading-column';
import { ThemeToggle } from '@/components/blog/theme-toggle';

// Fully static, and never expires on a timer. Pages change only when a publish
// triggers on-demand revalidation (phase 5).
export const dynamic = 'force-static';
export const revalidate = false;

export default async function HomePage() {
  const site = await getSite();
  const client = getClient();

  const [posts, total] = await Promise.all([
    listPublishedPosts(client, site.id, { limit: POSTS_PER_PAGE }),
    countPublishedPosts(client, site.id),
  ]);

  const hasMore = total > POSTS_PER_PAGE;

  return (
    <ReadingColumn themeToggle={false}>
      {/*
        The index had no <h1> at all, only the tagline paragraph — so this is an
        SEO fix as much as a layout one. The wording carries the topic rather
        than describing the page's mechanics ("Latest Posts"), which is what the
        index can actually rank for.
      */}
      <header className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-headline)] text-3xl leading-tight sm:text-4xl">
            Business Funding Insights
          </h1>
          {site.description ? (
            <p className="mt-3 text-lg text-[var(--color-ink-muted)]">{site.description}</p>
          ) : null}
        </div>

        <ThemeToggle className="shrink-0" />
      </header>

      {posts.length === 0 ? (
        <p className="text-[var(--color-ink-muted)]">
          No posts published yet. Run the seed script or import a WordPress export.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} locale={site.locale} />
          ))}
        </div>
      )}

      {hasMore ? (
        <nav className="mt-12 flex justify-end">
          <Link href={blogPagePath(2)}>Older posts →</Link>
        </nav>
      ) : null}
    </ReadingColumn>
  );
}
