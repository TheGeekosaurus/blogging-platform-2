import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  getPageByPath,
  htmlToPlainText,
  listPublishedPagePaths,
  pagePath,
  truncateWords,
} from '@blog/core';

import { STUB_PAGES } from '@/components/marketing/brand';
import { PageBody } from '@/components/page-body';
import { isMarketingSite } from '@/lib/marketing';
import { getClient, getSite } from '@/lib/site';

/*
 * Pages, at any depth: /about, /projects, /projects/solar/phase-two.
 *
 * This is the lowest-precedence route in the app. Static segments win over
 * catch-alls in Next's matcher, so everything under /blog is served by the post
 * routes and never reaches here — which is why a page can never shadow the blog.
 *
 * dynamicParams stays at its default so a page published after the last deploy
 * resolves on demand. See app/blog/[slug]/page.tsx for the full story.
 */
export const dynamic = 'force-static';
export const revalidate = false;

export async function generateStaticParams() {
  const site = await getSite();
  const paths = await listPublishedPagePaths(getClient(), site.id);
  return paths.map((path) => ({ path: path.split('/') }));
}


/**
 * The heading for a path that is linked in the nav but has no page yet, or null.
 *
 * Gated on the marketing site for the same reason the rest of the coded chrome
 * is: `apps/blog` runs once per blog from one codebase, and another blog's
 * domain must not start answering /funding-solutions with a Nanotom heading.
 */
function stubHeading(path: string): string | null {
  if (!isMarketingSite()) return null;
  return STUB_PAGES[path] ?? null;
}

async function load(paramsPromise: Promise<{ path?: string[] }>) {
  const { path } = await paramsPromise;
  const joined = (path ?? []).map((segment) => decodeURIComponent(segment)).join('/');
  const site = await getSite();
  const page = joined ? await getPageByPath(getClient(), site.id, joined) : null;
  return { site, page, path: joined };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}): Promise<Metadata> {
  const { page, path } = await load(params);

  if (!page) {
    const heading = stubHeading(path);
    // noindex, because an empty page in the index is worse than no page at all.
    // `follow` stays on so the header and footer links here are still crawled.
    return heading ? { title: heading, robots: { index: false, follow: true } } : {};
  }

  const description =
    page.seo_description ?? truncateWords(htmlToPlainText(page.content_html), 160);

  return {
    title: page.seo_title ?? page.title,
    description: description || undefined,
    alternates: { canonical: page.canonical_url ?? pagePath(page.path) },
    robots: page.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: 'website',
      title: page.seo_title ?? page.title,
      description: description || undefined,
      url: pagePath(page.path),
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { page, path } = await load(params);

  if (!page) {
    /*
     * A real page at this path always wins — this only runs when the lookup
     * found nothing. So publishing content here retires the stub by itself;
     * there is no route file anyone has to remember to delete.
     */
    const heading = stubHeading(path);
    if (heading) {
      return (
        <article className="mx-auto w-full max-w-3xl px-5 py-24">
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {heading}
          </h1>
        </article>
      );
    }

    notFound();
  }

  // A 'full' page owns the whole viewport. It gets no container at all — which
  // is now literally true, since the root layout stopped supplying one.
  if (page.template === 'full') {
    return <PageBody page={page} />;
  }

  // 'prose' pages supply the reading column themselves. It used to come from the
  // root layout, which no longer wraps anything.
  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-10">
      <h1 className="mb-8 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
        {page.title}
      </h1>
      <PageBody page={page} />
    </article>
  );
}
