import type { PostSummary, TermRow } from '@blog/core';

import { BLOG_INDEX } from '../ft/content';
import { BlogFeatured, BlogRecentCard } from '../ft/blog-index';
import { CategoryPills, PostRow } from '../ft/post-list';
import { CONTAINER, Chip, GhostButton, SectionIntro } from './primitives';

/**
 * DAYLIGHT — /blog and its numbered pages, in white.
 *
 * The light twin of ft/blog-index.tsx, built the way every other conversion was:
 * a parallel file, the dark one left as the revert path, one import swapped in
 * the route.
 *
 * MOST OF IT IS NOT COPIED, WHICH IS THE POINT. The featured story, the three-up
 * cards and the list rows all read --ft-* and nothing else, so `.dl-surface`
 * re-themes them untouched — they are imported from the dark file rather than
 * reproduced. Two copies of a post card is how the index and the homepage band
 * start disagreeing about what a post looks like.
 *
 * WHAT GENUINELY DIFFERS IS TWO THINGS, and both are reasons a theme flag could
 * not have done the job:
 *
 *   THE SECTION HEAD. The dark page opens its list with SectionHead, which
 *   paints a full-bleed band across the page. Denis asked for those bands to go
 *   when Daylight was designed, so this uses SectionIntro — the same chip and
 *   heading with no ground of its own. That is a change of structure, not of
 *   colour.
 *
 *   THE HERO WEIGHT. Section headlines are bold across Daylight since
 *   2026-10-06; the dark hero is `font-medium`. See the note over SectionIntro.
 *
 * `dl-bloglist` on the list section is the marker the homepage's band already
 * wears — it restores the stacked row rhythm, which globals.css scopes to that
 * class so the index keeps it too.
 */

/** How many posts the three-up holds, between the featured one and the list. */
const RECENT = 3;

function Hero() {
  return (
    <section aria-labelledby="dl-blog-index" className="border-b border-[var(--ft-line)]">
      <div className={`${CONTAINER} py-16 lg:py-24`}>
        <Chip>{BLOG_INDEX.eyebrow}</Chip>

        {/*
          Headline left, paragraph set against its LAST line on the right —
          `items-end` is what does it. Same shape as the dark page; only the
          weight moved.
        */}
        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:gap-16">
          <h1
            id="dl-blog-index"
            className="max-w-[18ch] flex-1 font-[family-name:var(--font-headline)] text-[clamp(2.25rem,5.5vw,4rem)] font-bold leading-[1.06] tracking-[-0.01em] text-[var(--ft-ink)]"
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

export function DaylightBlogIndex({
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
    /* Header and footer come from the root layout — see the note there. */
    <div className="dl-surface">
      <Hero />

      {featured ? <BlogFeatured post={featured} locale={locale} /> : null}

      {recent.length > 0 ? (
        <section aria-label="Recent posts" className="border-b border-[var(--ft-line)]">
          <div className={`${CONTAINER} grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-3 lg:py-16`}>
            {recent.map((post) => (
              <BlogRecentCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      ) : null}

      {/*
        The homepage's blog band, minus its "View All Blogs" button — that
        button points here, and a page offering to take you to itself is a dead
        control.
      */}
      {listed.length > 0 ? (
        <section aria-labelledby="dl-blog-all" className="dl-bloglist">
          <div className={`${CONTAINER} pb-10 pt-14 lg:pb-12 lg:pt-20`}>
            <SectionIntro
              id="dl-blog-all"
              label={BLOG_INDEX.listHead.label}
              heading={BLOG_INDEX.listHead.heading}
            />
          </div>

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
 * on page 4 wants the rows and a way to page on — and it keeps them on the same
 * ground the index put them on, which is the whole reason this twin exists
 * rather than page 2 dropping back to the dark build one click from a white
 * index.
 */
export function DaylightBlogArchivePage({
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
    <div className="dl-surface">
      <section aria-labelledby="dl-blog-page" className="dl-bloglist">
        <div className={`${CONTAINER} pb-10 pt-14 lg:pb-12 lg:pt-20`}>
          <SectionIntro
            id="dl-blog-page"
            label={BLOG_INDEX.listHead.label}
            heading={heading}
          />
        </div>

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
