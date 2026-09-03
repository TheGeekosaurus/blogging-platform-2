import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  excerptFor,
  extractHeadings,
  groupHeadings,
  getPostBySlug,
  injectHeadingIds,
  listPublishedSlugs,
  listRelatedPosts,
  mediaPublicUrl,
  postBreadcrumbs,
  postPath,
  tagPath,
} from '@blog/core';

import { Breadcrumbs } from '@/components/blog/breadcrumbs';
import { PostByline } from '@/components/blog/post-byline';
import { PostJsonLd } from '@/components/json-ld';
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
  const headingGroups = groupHeadings(headings);
  const bodyHtml = injectHeadingIds(post.content_html);

  const primaryCategory = post.categories[0];

  // One trail, two renderings: this nav and the BreadcrumbList in PostJsonLd.
  const crumbs = postBreadcrumbs(site, post, primaryCategory);

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
        Three columns: contents, article, metadata.

        Fixed side rails with a flexible centre, rather than the percentages this
        started with. Percentages scale the rails along with the viewport, which
        at the narrow end squeezes them below the width their content needs; the
        article is the only column that genuinely wants the slack, so it takes
        all of it. The prose keeps its own 68ch cap regardless, so a wide window
        buys margin rather than a 100-character line.

        The breakpoint for three columns is `xl` (1280), not `lg`. At 1024 the
        two rails and their gutters take 636 of the available 984px, leaving the
        article about 350px — three columns simply do not fit, so that range
        keeps the two-column arrangement with the contents list above the
        article instead.
      */}
      <div className="mx-auto w-full max-w-7xl px-5 lg:px-8">
        <div className="flex flex-col gap-12 py-12 lg:flex-row lg:gap-12 lg:py-16">
          <div className="min-w-0 flex-1">
            {/*
              The post's top matter, in the reading column rather than a
              full-bleed band above it. Removing the hero also removed a whole
              conditional: a post with no featured image used to need its own
              header variant and now simply has no thumbnail.
            */}
            <header className="mb-10">
              <Breadcrumbs crumbs={crumbs} />

              <h1 className="mt-4 text-balance font-[family-name:var(--font-headline)] text-3xl leading-[1.15] text-[var(--color-ink)] sm:text-4xl">
                {post.title}
              </h1>

              <div className="mt-6 border-y border-[var(--color-line)] py-4">
                <PostByline post={post} locale={site.locale} />
              </div>

              {image ? (
                <Image
                  src={mediaPublicUrl(image.storage_path)}
                  alt={image.alt ?? ''}
                  width={image.width ?? 1920}
                  height={image.height ?? 1080}
                  /*
                    Still the largest paint on the page now that the hero is
                    gone, so it keeps `priority` — it is just inline rather than
                    full-bleed.
                  */
                  priority
                  placeholder={image.blur_data_url ? 'blur' : 'empty'}
                  blurDataURL={image.blur_data_url ?? undefined}
                  /*
                    Fixed 16:9 box. Posts arrive with whatever crop the author
                    had; letting each set its own height makes the article body
                    start at a different place on every post.
                  */
                  className="mt-8 aspect-video w-full rounded-xl object-cover"
                  sizes="(min-width: 1280px) 740px, 100vw"
                />
              ) : null}
            </header>

            {/*
              The same list below `lg`, between the header and the body rather
              than after the post. Stacked below it — where the sidebar used to
              land on a phone — a contents list is something you reach only once
              you no longer need it.
            */}
            <TableOfContents
              groups={headingGroups}
              variant="disclosure"
              id="toc-disclosure"
              className="mb-10 lg:hidden"
            />

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
            Metadata only now that the contents list has its own column — Denis
            has plans for the space this frees.

            Still sticky: it is short enough to sit in the viewport whole, which
            is precisely what stopped being true once the contents list shared
            the column. `self-start` is required for sticky inside a flex row.
          */}
          {/*
            One sidebar, holding the contents list and the reading-theme control.

            The aside is the bounded, sticky box and the contents list scrolls
            INSIDE it — two separate elements, because `overflow` on an ancestor
            breaks `position: sticky` for its descendants, so one element cannot
            be both. The theme control sits above the list and outside the scroll
            area, so it stays put however long the list is.

            `max-h` is sized for the rail's NATURAL top, not the 96px it settles
            at once stuck. Before it sticks it sits below that — ~137px at 1280
            and ~153px at 1024, where the site header wraps taller — so a height
            computed for the stuck position ran past the bottom of the viewport
            until you scrolled. 11rem clears the tallest of those; the ~32px it
            gives up once stuck is not worth chasing with a fixed offset that
            cannot be right at every width.
          */}
          <aside className="lg:sticky lg:top-24 lg:flex lg:max-h-[calc(100vh-11rem)] lg:w-[320px] lg:shrink-0 lg:flex-col lg:self-start">
            <div className="flex shrink-0 flex-col gap-1.5">
              {/*
                aria-hidden, not decorative: the control carries its own sr-only
                legend with this wording, so both in the tree announces it twice.
              */}
              <span aria-hidden="true" className="text-sm text-[var(--color-ink-muted)]">
                Reading theme
              </span>
              <ThemeToggle />
            </div>

            <TableOfContents
              groups={headingGroups}
              variant="rail"
              id="toc-rail"
              className="mt-8 hidden min-h-0 flex-1 lg:flex"
            />
          </aside>
        </div>
      </div>

      <SimilarPosts posts={related} categoryFor={primaryCategoryFor} />
    </article>
  );
}
