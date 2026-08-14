import Link from 'next/link';
import { notFound } from 'next/navigation';

import { POSTS_PER_PAGE, countPublishedPosts, listPublishedPosts } from '@blog/core';

import { PostCard } from '@/components/post-card';
import { getClient, getSite } from '@/lib/site';

export const dynamic = 'force-static';
export const revalidate = false;
// Only the page numbers that exist are rendered; anything else 404s rather than
// being generated on demand.
export const dynamicParams = false;

export async function generateStaticParams() {
  const site = await getSite();
  const total = await countPublishedPosts(getClient(), site.id);
  const pageCount = Math.ceil(total / POSTS_PER_PAGE);

  // Page 1 lives at `/`, so numbered pages start at 2.
  return Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) => ({
    page: String(i + 2),
  }));
}

export default async function ArchivePage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const pageNumber = Number(page);

  if (!Number.isInteger(pageNumber) || pageNumber < 2) {
    notFound();
  }

  const site = await getSite();
  const client = getClient();

  const [posts, total] = await Promise.all([
    listPublishedPosts(client, site.id, {
      limit: POSTS_PER_PAGE,
      offset: (pageNumber - 1) * POSTS_PER_PAGE,
    }),
    countPublishedPosts(client, site.id),
  ]);

  if (posts.length === 0) {
    notFound();
  }

  const pageCount = Math.ceil(total / POSTS_PER_PAGE);

  return (
    <>
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">
        Page {pageNumber} of {pageCount}
      </h1>

      <div className="flex flex-col gap-8">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} locale={site.locale} />
        ))}
      </div>

      <nav className="mt-12 flex justify-between text-sm">
        <Link href={pageNumber === 2 ? '/' : `/page/${pageNumber - 1}`}>← Newer posts</Link>
        {pageNumber < pageCount ? (
          <Link href={`/page/${pageNumber + 1}`}>Older posts →</Link>
        ) : (
          <span />
        )}
      </nav>
    </>
  );
}
