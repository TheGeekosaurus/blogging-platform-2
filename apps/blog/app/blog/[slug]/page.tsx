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

import { AuthorBox } from '@/components/blog/author-box';
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

  return (
    <article className="blog-surface">
      <PostJsonLd
        site={site}
        post={post}
        description={description}
        imageUrl={image ? mediaPublicUrl(image.storage_path) : null}
      />

      {/*
        The post section is a FRAME, not a set of floating dividers.

        The four strokes that make it — this bottom line, the two around the
        byline, the column rule, and the intro rule in globals.css — are
        --color-line, the same quiet grey as every other border on the page.

        They were briefly the accent colour, gold on dark and copper on light.
        That is reverted: picking the frame out in a bright hue turned a set of
        dividers into a drawn box, and the page read as boxy rather than as
        framed prose. The strokes still MEET — that is structural and is what
        the rest of this comment is about — they just do not announce it.
        Accent stays where it earns attention: links, list markers, the
        category label on a card.

        Three things make the strokes meet, and none of them is decoration:

        1. The bottom rule lives on this wrapper, which is full-bleed, so it
           runs edge to edge and gives the vertical rule something to land on.
           It is here rather than left to <SimilarPosts> because a post with no
           related posts renders no SimilarPosts at all — and the frame must
           still close. The two coincide when both are present, as they do in
           the Figma, where the columns and the following section each carry a
           stroke at that line.

        2. The vertical padding is INSIDE each column rather than on the row.
           Padding on the row would hold both columns short of the header and
           the bottom line, which no amount of border-placement can recover.

        3. There is no `gap`. Both columns pad themselves by --frame-gutter
           instead, so each column's BOX ends exactly at the divider while its
           content sits a gutter clear of it. A `gap` cannot do that: it holds
           the whole box away, taking the strokes with it — which is how
           everything here ended up 48px short of the rule it should meet.
           The rules bleed back out over that padding (see .post-rule in
           globals.css), so they land on the divider and only the content is
           inset.

        Widths are unchanged by all this. The old arrangement spent 48px of gap
        plus a 352px rail; this one spends 400px on the sidebar wrapper, of
        which 48px is the gutter — so the article is exactly as wide as before
        and the contents list gains the 32px the old `pl-8` was taking.
      */}
      <div className="post-frame border-b border-[var(--color-line)]">
        <div className="mx-auto w-full max-w-7xl px-5 lg:flex lg:px-8">
          <div className="min-w-0 flex-1 py-12 lg:py-16 lg:pr-[var(--frame-gutter)]">
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

              {/*
                `post-rule` runs both strokes out to the screen edge on the
                left and over the column's right padding on the right, so they
                reach the divider while this row's own content — the name, and
                the date opposite it — stops a gutter short of it.
              */}
              <div className="post-rule mt-6 border-y border-[var(--color-line)] py-4">
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
                  sizes="(min-width: 1280px) 768px, 100vw"
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

            {/*
              No width cap here. It used to be `max-w-[68ch]`, which also
              capped the h2 — and so the rule drawn above the second one, which
              is why that line was short. The reading measure now lives on the
              prose's text children (see .blog-surface .post-body in
              globals.css), leaving headings free to span the column.
            */}
            <div className="post-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />

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

            {/*
              Only with an author RECORD. A post carrying just a free-text
              byline gets nothing: a box with one name, an empty photo frame and
              no bio advertises missing data rather than earning trust.
            */}
            {post.byline ? <AuthorBox byline={post.byline} /> : null}

          </div>

          {/*
            The sidebar is TWO nested boxes, and the nesting is the fix for the
            rule that used to float.

            The outer one is an ordinary flex child, so it stretches to the
            row's full height and its left border runs from the header boundary
            to the bottom line. The border cannot live on the sticky element: a
            sticky, `self-start`, `max-h`-bounded box is by definition only as
            tall as its own content, so its border was only ever as long as the
            contents list.

            The inner one is the bounded sticky box, with the contents list
            scrolling inside it — still two elements, because `overflow` on an
            ancestor breaks `position: sticky` for its descendants. The theme
            control sits above the list and outside the scroll area, so it stays
            put however long the list is.

            `max-h` is sized for the rail's NATURAL top, not the 96px it settles
            at once stuck. Before it sticks it sits below that — ~137px at 1280
            and ~153px at 1024, where the site header wraps taller — so a height
            computed for the stuck position ran past the bottom of the viewport
            until you scrolled. 11rem clears the tallest of those; the ~32px it
            gives up once stuck is not worth chasing with a fixed offset that
            cannot be right at every width.
          */}
          <div className="pb-12 lg:w-[400px] lg:shrink-0 lg:border-l lg:border-[var(--color-line)] lg:py-16 lg:pl-[var(--frame-gutter)]">
            <aside className="lg:sticky lg:top-24 lg:flex lg:max-h-[calc(100vh-11rem)] lg:flex-col">
              <div className="flex shrink-0 flex-col gap-1.5">
                {/*
                  aria-hidden, not decorative: the control carries its own
                  sr-only legend with this wording, so both in the tree
                  announces it twice.
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
      </div>

      <SimilarPosts posts={related} locale={site.locale} />
    </article>
  );
}
