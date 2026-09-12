import Image from 'next/image';
import Link from 'next/link';

import {
  excerptFor,
  formatPostDate,
  mediaPublicUrl,
  postAuthorName,
  postPath,
  type PostSummary,
  type TermRow,
} from '@blog/core';

import { BLOG_INDEX } from './content';
import { CategoryPills, ImageSlot, PostRow } from './post-list';
import { Chip, CONTAINER, GhostButton, SectionHead } from './primitives';

/*
 * /blog — the index, in the marketing design.
 *
 * Built from two frames of the FutureTech template: a news hero over a featured
 * story and a three-up of recent ones, then the list page. The list is the
 * homepage's list — literally, via ./post-list — because the band on the
 * homepage is the first few of exactly this, and two layouts that must stay
 * identical are one that will not.
 *
 * NOTHING HERE COUNTS LIKES, COMMENTS OR SHARES. The template's cards carry
 * "14k ♥ / 204 ↗" pills and they are the most eye-catching thing on it, but no
 * such number exists in this database and there is no place one could come
 * from. Inventing engagement figures is inventing social proof, so the pills are
 * dropped rather than filled with plausible-looking numbers. If reactions ever
 * become real, this is where they go.
 */

/* ---------------------------------------------------------------------------
 * Hero
 *
 * Same shape as /funding-solutions': headline left, paragraph set against its
 * LAST line on the right. See the note there — `items-end` is what does it.
 * ------------------------------------------------------------------------- */
function Hero() {
  return (
    <section aria-labelledby="ft-blog-index" className="border-b border-[var(--ft-line)]">
      <div className={`${CONTAINER} py-16 lg:py-24`}>
        <Chip>{BLOG_INDEX.eyebrow}</Chip>

        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:gap-16">
          <h1
            id="ft-blog-index"
            className="max-w-[18ch] flex-1 font-[family-name:var(--font-headline)] text-[clamp(2.25rem,5.5vw,4rem)] font-medium leading-[1.06] text-[var(--ft-ink)]"
          >
            {BLOG_INDEX.heading}
          </h1>

          <p className="max-w-[52ch] flex-1 text-[1.0625rem] leading-[1.65] text-[var(--ft-muted)]">
            {BLOG_INDEX.body}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * The featured post
 * ------------------------------------------------------------------------- */

/** One labelled fact under the featured post. Same dt/dd pairing as the loans page. */
function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-[var(--ft-muted)]">{label}</dt>
      <dd className="mt-1 font-medium text-[var(--ft-ink)]">{children}</dd>
    </div>
  );
}

function Featured({ post, locale }: { post: PostSummary; locale: string }) {
  const image = post.featured_image;
  const author = postAuthorName(post);
  const category = post.categories[0] ?? null;

  return (
    <article
      aria-labelledby="ft-blog-featured"
      className="border-b border-[var(--ft-line)]"
    >
      <div
        className={`${CONTAINER} grid gap-8 py-12 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] lg:gap-14 lg:py-16`}
      >
        {/*
          `aria-hidden` + `tabIndex={-1}`, as post-card.tsx and the list rows
          do: the title beside it already links here, and a screen reader
          should not meet the post twice.
        */}
        <Link href={postPath(post.slug)} aria-hidden="true" tabIndex={-1} className="block">
          {image ? (
            <Image
              src={mediaPublicUrl(image.storage_path)}
              alt=""
              width={image.width ?? 720}
              height={image.height ?? 540}
              placeholder={image.blur_data_url ? 'blur' : 'empty'}
              blurDataURL={image.blur_data_url ?? undefined}
              sizes="(min-width: 1024px) 420px, 100vw"
              priority
              className="aspect-[4/3] w-full rounded-xl object-cover"
            />
          ) : (
            <ImageSlot className="aspect-[4/3] w-full" />
          )}
        </Link>

        <div className="lg:self-center">
          <h2
            id="ft-blog-featured"
            className="font-[family-name:var(--font-headline)] text-[clamp(1.5rem,2.6vw,2rem)] font-semibold leading-[1.2] text-[var(--ft-ink)]"
          >
            <Link href={postPath(post.slug)} className="hover:text-[var(--ft-accent)]">
              {post.title}
            </Link>
          </h2>

          <p className="mt-4 max-w-[70ch] text-[1.0625rem] leading-[1.55] text-[var(--ft-muted)]">
            {/* Summaries carry no body, so there is nothing to fall back to. */}
            {excerptFor({ excerpt: post.excerpt, content_html: '' }, 200)}
          </p>

          {/*
            The template's three facts. Category and author are both optional in
            the data — an uncategorised post and a post with no byline are both
            valid — so each cell is dropped rather than rendered empty, and the
            grid closes up around whatever is left.
          */}
          <dl className="mt-7 grid gap-6 sm:grid-cols-3">
            {category ? <Fact label={BLOG_INDEX.meta.category}>{category.name}</Fact> : null}
            <Fact label={BLOG_INDEX.meta.date}>
              <time dateTime={post.published_at}>
                {formatPostDate(post.published_at, locale)}
              </time>
            </Fact>
            {author ? <Fact label={BLOG_INDEX.meta.author}>{author}</Fact> : null}
          </dl>

          <div className="mt-8">
            <GhostButton href={postPath(post.slug)}>{BLOG_INDEX.readMore}</GhostButton>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ---------------------------------------------------------------------------
 * The three-up
 * ------------------------------------------------------------------------- */

function RecentCard({ post }: { post: PostSummary }) {
  const image = post.featured_image;
  const category = post.categories[0] ?? null;

  return (
    <article className="flex flex-col">
      <Link href={postPath(post.slug)} aria-hidden="true" tabIndex={-1} className="block">
        {image ? (
          <Image
            src={mediaPublicUrl(image.storage_path)}
            alt=""
            width={image.width ?? 480}
            height={image.height ?? 300}
            placeholder={image.blur_data_url ? 'blur' : 'empty'}
            blurDataURL={image.blur_data_url ?? undefined}
            sizes="(min-width: 1024px) 380px, 100vw"
            className="aspect-[16/10] w-full rounded-xl object-cover"
          />
        ) : (
          <ImageSlot className="aspect-[16/10] w-full" />
        )}
      </Link>

      <h3 className="mt-5 text-[1.125rem] font-semibold leading-[1.3] text-[var(--ft-ink)]">
        <Link href={postPath(post.slug)} className="hover:text-[var(--ft-accent)]">
          {post.title}
        </Link>
      </h3>

      {category ? (
        <p className="mt-2 text-[0.9375rem] text-[var(--ft-muted)]">{category.name}</p>
      ) : null}

      {/* `mt-auto` so the buttons line up across a row of uneven titles. */}
      <div className="mt-auto pt-5">
        <GhostButton href={postPath(post.slug)}>{BLOG_INDEX.readMore}</GhostButton>
      </div>
    </article>
  );
}

/* ---------------------------------------------------------------------------
 * The page
 * ------------------------------------------------------------------------- */

/** How many posts the three-up holds, between the featured one and the list. */
const RECENT = 3;

export function FtBlogIndex({
  posts,
  categories,
  locale,
  olderHref,
}: {
  posts: readonly PostSummary[];
  categories: readonly TermRow[];
  locale: string;
  /** Page 2, when there is one. */
  olderHref?: string;
}) {
  /*
   * The hero is the only thing an empty blog can show. A featured slot, a
   * three-up and a list would all be headings over nothing.
   */
  const [featured, ...rest] = posts;
  const recent = rest.slice(0, RECENT);
  const listed = rest.slice(RECENT);

  return (
    <div className="ft-surface">
      <Hero />

      {featured ? <Featured post={featured} locale={locale} /> : null}

      {recent.length > 0 ? (
        <section aria-label="Recent posts" className="border-b border-[var(--ft-line)]">
          <div className={`${CONTAINER} grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-3 lg:py-16`}>
            {recent.map((post) => (
              <RecentCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      ) : null}

      {/*
        The homepage's blog band, minus its "View All Blogs" button — that
        button points here, and a page offering to take you to itself is a dead
        control. Everything below it is the same components the homepage uses.
      */}
      {listed.length > 0 ? (
        <section aria-labelledby="ft-blog-all">
          <SectionHead
            id="ft-blog-all"
            label={BLOG_INDEX.listHead.label}
            heading={BLOG_INDEX.listHead.heading}
          />

          {/* "All" is this page, so the pill is current rather than a link away. */}
          <CategoryPills categories={categories} />

          {listed.map((post) => (
            <PostRow key={post.id} post={post} locale={locale} />
          ))}
        </section>
      ) : null}

      {olderHref ? (
        <nav className={`${CONTAINER} flex justify-center py-12 lg:py-16`}>
          <GhostButton href={olderHref}>{BLOG_INDEX.older}</GhostButton>
        </nav>
      ) : null}
    </div>
  );
}

/**
 * Page two and beyond: the same list with no hero, featured slot or three-up.
 *
 * Those three are the front of the archive and only make sense once. A reader
 * on page 4 wants the rows and a way to page on, which is what this is — and it
 * keeps them on the same dark ground rather than dropping them into the light
 * reading column the numbered pages used to use.
 */
export function FtBlogArchivePage({
  posts,
  categories,
  locale,
  heading,
  newerHref,
  olderHref,
}: {
  posts: readonly PostSummary[];
  categories: readonly TermRow[];
  locale: string;
  heading: string;
  newerHref?: string;
  olderHref?: string;
}) {
  return (
    <div className="ft-surface">
      <section aria-labelledby="ft-blog-page">
        <SectionHead
          id="ft-blog-page"
          label={BLOG_INDEX.listHead.label}
          heading={heading}
        />

        <CategoryPills categories={categories} />

        {posts.map((post) => (
          <PostRow key={post.id} post={post} locale={locale} />
        ))}
      </section>

      {newerHref || olderHref ? (
        <nav className={`${CONTAINER} flex flex-wrap justify-between gap-4 py-12 lg:py-16`}>
          {/* `justify-between` with one child would shove it right, so the
              empty side holds a spacer rather than the row changing shape. */}
          {newerHref ? <GhostButton href={newerHref}>Newer posts</GhostButton> : <span />}
          {olderHref ? <GhostButton href={olderHref}>{BLOG_INDEX.older}</GhostButton> : <span />}
        </nav>
      ) : null}
    </div>
  );
}
