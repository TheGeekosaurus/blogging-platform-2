import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  getPageByPath,
  htmlToPlainText,
  listPublishedPagePaths,
  pagePath,
  truncateWords,
} from '@blog/core';

import { PageBody } from '@/components/page-body';
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

async function load(paramsPromise: Promise<{ path?: string[] }>) {
  const { path } = await paramsPromise;
  const joined = (path ?? []).map((segment) => decodeURIComponent(segment)).join('/');
  const site = await getSite();
  const page = joined ? await getPageByPath(getClient(), site.id, joined) : null;
  return { site, page };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}): Promise<Metadata> {
  const { page } = await load(params);
  if (!page) return {};

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
  const { page } = await load(params);

  if (!page) {
    notFound();
  }

  // A 'full' page owns the whole viewport, so it opts out of the site's
  // centred column entirely rather than being constrained by it.
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
