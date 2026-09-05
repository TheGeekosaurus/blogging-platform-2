import type { Metadata } from 'next';
import Link from 'next/link';

import {
  POSTS_PER_PAGE,
  blogIndexPath,
  getPageById,
  htmlToPlainText,
  listNonEmptyTerms,
  listPublishedPosts,
  truncateWords,
} from '@blog/core';

import { HomeV2 } from '@/components/marketing/ft/home-v2';
import { PageBody } from '@/components/page-body';
import { PostCard } from '@/components/post-card';
import { isMarketingSite } from '@/lib/marketing';
import { getClient, getSite } from '@/lib/site';

/*
 * The homepage.
 *
 * On the marketing site this is a hand-coded route: the page is a bespoke
 * layout with third-party embeds, which is code, not content.
 * `sites.homepage_page_id` is ignored there.
 *
 * Every other site keeps the database-driven behaviour — the page named by
 * homepage_page_id, falling back to a short post list so a freshly-created site
 * is never a blank page.
 */
export const dynamic = 'force-static';
export const revalidate = false;

/**
 * How many posts the design's blog band holds before it stops looking like a
 * highlight and starts looking like the archive. The archive is one click away
 * via "View All Blogs".
 */
const HOMEPAGE_POSTS = 3;

/**
 * And how many category pills fit on one row at the design's width. Ordered by
 * name upstream, so this takes the first few alphabetically rather than an
 * arbitrary slice of an arbitrary order.
 */
const HOMEPAGE_CATEGORIES = 6;

async function loadHomepage() {
  const site = await getSite();
  if (!site.homepage_page_id) return { site, page: null };

  const page = await getPageById(getClient(), site.id, site.homepage_page_id);
  // A draft or deleted homepage falls back rather than 404ing the front door.
  const usable = page && page.status === 'published' ? page : null;
  return { site, page: usable };
}

export async function generateMetadata(): Promise<Metadata> {
  if (isMarketingSite()) {
    return {
      title: 'Business Funding & Working Capital',
      description:
        "Whether you're a startup, established business, or real estate investor, access " +
        'flexible financing solutions to fuel your next big move. Approvals up to $1,500,000.',
      alternates: { canonical: '/' },
    };
  }

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
  if (isMarketingSite()) {
    const site = await getSite();

    /*
     * `listNonEmptyTerms`, not `listTerms`: a pill leading to an archive with
     * nothing in it is a dead end, and on a homepage it is a dead end in the
     * shop window.
     *
     * This route is force-static with `revalidate = false`, exactly like /blog,
     * so both are refreshed by on-demand revalidation rather than a timer. That
     * only works because '/' is one of the post target's paths in
     * app/api/revalidate/route.ts — without it this band would freeze at
     * whatever was published when the site was last built.
     */
    const [posts, categories] = await Promise.all([
      listPublishedPosts(getClient(), site.id, { limit: HOMEPAGE_POSTS }),
      listNonEmptyTerms(getClient(), site.id, 'category'),
    ]);

    return (
      <HomeV2
        posts={posts}
        categories={categories.slice(0, HOMEPAGE_CATEGORIES)}
        locale={site.locale}
      />
    );
  }

  const { site, page } = await loadHomepage();

  if (page) {
    if (page.template === 'full') {
      return <PageBody page={page} />;
    }
    return (
      <article className="mx-auto w-full max-w-3xl px-5 py-10">
        <h1 className="mb-8 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {page.title}
        </h1>
        <PageBody page={page} />
      </article>
    );
  }

  const posts = await listPublishedPosts(getClient(), site.id, { limit: POSTS_PER_PAGE });

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
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
    </div>
  );
}
