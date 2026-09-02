import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  categoryPath,
  excerptFor,
  extractHeadings,
  getPostBySlug,
  injectHeadingIds,
  listPublishedSlugs,
  listRelatedPosts,
  mediaPublicUrl,
  postPath,
  tagPath,
} from '@blog/core';

import { PostJsonLd } from '@/components/json-ld';
import { PostMeta } from '@/components/blog/post-meta';
import { SimilarPosts } from '@/components/blog/similar-posts';
import { TableOfContents } from '@/components/blog/table-of-contents';
import { ThemeToggle } from '@/components/blog/theme-toggle';
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

  /*
   * Anchors are added here, not stored: `id` is not in the sanitiser's
   * allowedAttributes, so none survives a write. Both calls run the same regex
   * over the same string, so the generated ids match the contents list — which
   * is the whole reason the links land. Build/revalidation time only.
   */
  const headings = extractHeadings(post.content_html);
  const bodyHtml = injectHeadingIds(post.content_html);

  const primaryCategory = post.categories[0];

  const primaryCategoryFor = new Map(
    related.flatMap((item) => {
      const term = post.categories[0];
      return term ? [[item.id, term] as const] : [];
    }),
  );

  return (
    <article className="blog-surface">
      <PostJsonLd site={site} post={post} description={description} />

      {/*
        Full-bleed hero with the title over it. The gradient is a separate layer
        rather than baked into the image so the same treatment works for any
        photo, and the title keeps its contrast whatever the image is.
      */}
      {image ? (
        <header className="relative isolate flex min-h-[clamp(300px,32vw,560px)] items-end overflow-hidden">
          <Image
            src={mediaPublicUrl(image.storage_path)}
            alt={image.alt ?? ''}
            width={image.width ?? 1920}
            height={image.height ?? 800}
            // Above the fold and the largest paint on the page.
            priority
            placeholder={image.blur_data_url ? 'blur' : 'empty'}
            blurDataURL={image.blur_data_url ?? undefined}
            className="absolute inset-0 -z-10 h-full w-full object-cover"
            sizes="100vw"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(11,11,12,.35)_0%,rgba(11,11,12,.55)_45%,rgba(11,11,12,.92)_100%)]"
          />
          <div className="mx-auto w-full max-w-7xl px-5 pb-12 pt-24 lg:px-8 lg:pb-16">
            {/* Centred, matching the design's hero type style (64px, CENTER). */}
            <h1 className="mx-auto max-w-4xl text-balance text-center font-[family-name:var(--font-headline)] text-3xl leading-[1.15] text-white sm:text-4xl lg:text-5xl">
              {post.title}
            </h1>

            {/*
              Category moved here from the sidebar grid. It is the post page's
              only link to the category archive, so it had to keep a home when
              the sidebar's second row became Author + theme control — and it is
              more visible here than it was buried in the metadata.
            */}
            {primaryCategory ? (
              <p className="mt-5 text-center">
                <Link
                  href={categoryPath(primaryCategory.slug)}
                  className="text-sm font-semibold uppercase tracking-[0.16em] !text-white/80 no-underline hover:!text-white"
                >
                  {primaryCategory.name}
                </Link>
              </p>
            ) : null}
          </div>
        </header>
      ) : (
        // No featured image: the title still needs a band of its own rather than
        // sitting flush against the site header.
        <header className="border-b border-[var(--color-line)]">
          <div className="mx-auto w-full max-w-7xl px-5 py-16 lg:px-8">
            <h1 className="max-w-4xl text-balance font-[family-name:var(--font-headline)] text-3xl leading-[1.15] text-[var(--color-ink)] sm:text-4xl lg:text-5xl">
              {post.title}
            </h1>

            {primaryCategory ? (
              <p className="mt-5">
                <Link
                  href={categoryPath(primaryCategory.slug)}
                  className="text-sm font-semibold uppercase tracking-[0.16em] !text-[var(--color-accent)] no-underline"
                >
                  {primaryCategory.name}
                </Link>
              </p>
            ) : null}
          </div>
        </header>
      )}

      {/*
        Two columns at the design's proportions (roughly 69/31). The prose itself
        is capped at 68ch inside its column: the design's measure is ~996px,
        which at 18px runs past 100 characters a line, well beyond comfortable
        reading. Flagged as a deliberate departure.
      */}
      <div className="mx-auto w-full max-w-7xl px-5 lg:px-8">
        <div className="flex flex-col gap-12 py-12 lg:flex-row lg:gap-16 lg:py-16">
          <div className="min-w-0 lg:w-[69%]">
            <div
              className="post-body max-w-[68ch]"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />

            {post.tags.length > 0 ? (
              <footer className="mt-12 border-t border-[var(--color-line)] pt-6">
                <h2 className="sr-only">Tags</h2>
                <p className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={tagPath(tag.slug)}
                      className="rounded-full border border-[var(--color-line)] px-4 py-1.5 text-sm !text-[var(--color-ink-muted)] no-underline transition-colors hover:border-[var(--color-accent)] hover:!text-[var(--color-accent)]"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </p>
              </footer>
            ) : null}
          </div>

          {/*
            `lg:sticky` with its own `top`: the contents list is the reason a
            sidebar earns its space on a long post, and it is useless once it has
            scrolled away. `self-start` is required for sticky to work inside a
            flex row.
          */}
          <aside className="flex flex-col gap-10 lg:w-[31%] lg:self-start lg:sticky lg:top-24">
            <PostMeta
              post={post}
              locale={site.locale}
              themeControl={<ThemeToggle />}
            />
            <TableOfContents headings={headings} />
          </aside>
        </div>
      </div>

      <SimilarPosts posts={related} categoryFor={primaryCategoryFor} />
    </article>
  );
}
