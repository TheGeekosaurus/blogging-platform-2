import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  categoryPath,
  excerptFor,
  formatPostDate,
  getPostBySlug,
  listPublishedSlugs,
  listRelatedPosts,
  mediaPublicUrl,
  postPath,
  tagPath,
} from '@blog/core';

import { PostJsonLd } from '@/components/json-ld';
import { getClient, getSite } from '@/lib/site';

export const dynamic = 'force-static';
export const revalidate = false;
// `dynamicParams` is deliberately left at its DEFAULT of true.
//
// Setting it to false — as this route originally did — restricts the route to
// the params generateStaticParams returned at BUILD time. Any post published
// since the last deploy then 404s permanently, and no amount of cache flushing
// helps. That silently broke publishing until it surfaced in production.
//
// With the default: generateStaticParams still prerenders known content at
// deploy time, an unknown slug renders once on demand and is then cached, and a
// slug with no matching row falls through to notFound() below.
//
// Verified empirically that `force-static` above is NOT what caused the 404. It
// is only an assertion that this route renders statically, kept so the page
// cannot quietly become dynamic.

export async function generateStaticParams() {
  const site = await getSite();
  const slugs = await listPublishedSlugs(getClient(), site.id);
  return slugs.map((slug) => ({ slug }));
}

async function loadPost(slugPromise: Promise<{ slug: string }>) {
  const { slug } = await slugPromise;
  const site = await getSite();
  const post = await getPostBySlug(getClient(), site.id, decodeURIComponent(slug));
  return { site, post };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { site, post } = await loadPost(params);
  if (!post) return {};

  const description = post.seo_description ?? excerptFor(post, 160);
  const canonical = post.canonical_url ?? postPath(post.slug);

  return {
    title: post.seo_title ?? post.title,
    description,
    alternates: { canonical },
    robots: post.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: 'article',
      title: post.seo_title ?? post.title,
      description,
      url: canonical,
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      siteName: site.name,
      locale: site.locale,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { site, post } = await loadPost(params);

  if (!post) {
    notFound();
  }

  const related = await listRelatedPosts(getClient(), site.id, post.id, 3);
  const image = post.featured_image;

  const description = post.seo_description ?? excerptFor(post, 160);

  return (
    <article>
      <PostJsonLd site={site} post={post} description={description} />

      <header className="mb-8">
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {post.title}
        </h1>

        <p className="mt-3 text-sm text-[var(--color-ink-muted)]">
          <time dateTime={post.published_at}>
            {formatPostDate(post.published_at, site.locale)}
          </time>
          {post.author_name ? <> · {post.author_name}</> : null}
          {post.reading_minutes ? <> · {post.reading_minutes} min read</> : null}
        </p>

        {post.categories.length > 0 ? (
          <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm">
            {post.categories.map((category) => (
              <Link key={category.id} href={categoryPath(category.slug)}>
                {category.name}
              </Link>
            ))}
          </p>
        ) : null}
      </header>

      {image ? (
        <Image
          src={mediaPublicUrl(image.storage_path)}
          alt={image.alt ?? ''}
          width={image.width ?? 1200}
          height={image.height ?? 630}
          // The only above-the-fold image on the page, so it is not lazy-loaded.
          priority
          placeholder={image.blur_data_url ? 'blur' : 'empty'}
          blurDataURL={image.blur_data_url ?? undefined}
          className="mb-8 h-auto w-full rounded-lg"
          sizes="(max-width: 768px) 100vw, 768px"
        />
      ) : null}

      {/*
        content_html was sanitised on write (see packages/core/src/sanitize.ts),
        so this is a plain string echo — no client JavaScript, no per-request
        sanitisation cost.
      */}
      <div
        className="post-body"
        dangerouslySetInnerHTML={{ __html: post.content_html }}
      />

      {post.tags.length > 0 ? (
        <footer className="mt-12 border-t border-[var(--color-line)] pt-6">
          <h2 className="sr-only">Tags</h2>
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
            {post.tags.map((tag) => (
              <Link key={tag.id} href={tagPath(tag.slug)}>
                #{tag.name}
              </Link>
            ))}
          </p>
        </footer>
      ) : null}

      {related.length > 0 ? (
        <aside className="mt-14 border-t border-[var(--color-line)] pt-8">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Read next</h2>
          <ul className="flex flex-col gap-3">
            {related.map((item) => (
              <li key={item.id}>
                <Link href={postPath(item.slug)}>{item.title}</Link>
                <span className="ml-2 text-sm text-[var(--color-ink-muted)]">
                  {formatPostDate(item.published_at, site.locale)}
                </span>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </article>
  );
}
