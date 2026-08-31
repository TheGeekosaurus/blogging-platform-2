import type { Metadata } from 'next';
import Link from 'next/link';

import {
  POSTS_PER_PAGE,
  blogIndexPath,
  getPageById,
  htmlToPlainText,
  listPublishedPosts,
  truncateWords,
} from '@blog/core';

import { PageBody } from '@/components/page-body';
import { PostCard } from '@/components/post-card';
import { getClient, getSite } from '@/lib/site';

/*
 * The homepage.
 *
 * Serves the page named by sites.homepage_page_id when one is set. When it is
 * null the site falls back to a short post list, so a freshly-created site is
 * never a blank page — the fallback exists so setup order does not matter.
 */
export const dynamic = 'force-static';
export const revalidate = false;

async function loadHomepage() {
  const site = await getSite();
  if (!site.homepage_page_id) return { site, page: null };

  const page = await getPageById(getClient(), site.id, site.homepage_page_id);
  // A draft or deleted homepage falls back rather than 404ing the front door.
  const usable = page && page.status === 'published' ? page : null;
  return { site, page: usable };
}

export async function generateMetadata(): Promise<Metadata> {
  const { site, page } = await loadHomepage();
  if (!page) return { alternates: { canonical: '/' } };

  const description =
    page.seo_description ?? truncateWords(htmlToPlainText(page.content_html), 160);

  return {
    title: page.seo_title ?? page.title,
    description: description || site.description || undefined,
    alternates: { canonical: '/' },
    robots: page.noindex ? { index: false, follow: true } : undefined,
  };
}

export default async function HomePage() {
  const { site, page } = await loadHomepage();

  if (page) {
    if (page.template === 'full') {
      return <PageBody page={page} />;
    }
    return (
      <article>
        <h1 className="mb-8 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {page.title}
        </h1>
        <PageBody page={page} />
      </article>
    );
  }

  const posts = await listPublishedPosts(getClient(), site.id, { limit: POSTS_PER_PAGE });

  return (
    <>
      {site.description ? (
        <p className="mb-10 text-lg text-[var(--color-ink-muted)]">{site.description}</p>
      ) : null}

      {posts.length === 0 ? (
        <p className="text-[var(--color-ink-muted)]">
          Nothing published yet. Create a page in the admin and set it as the homepage, or
          write a post.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-8">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} locale={site.locale} />
            ))}
          </div>
          <nav className="mt-12 flex justify-end">
            <Link href={blogIndexPath()}>All posts →</Link>
          </nav>
        </>
      )}
    </>
  );
}
