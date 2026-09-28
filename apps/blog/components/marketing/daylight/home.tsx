import Link from 'next/link';

import { blogIndexPath, type PostSummary, type TermRow } from '@blog/core';

import { CTA_HREF, HERO_VIDEO, IMAGES, REVIEWS } from '../brand';
import { FundingCarousel } from '../ft/funding-carousel';
import { Avatar, CategoryPills, PostRow } from '../ft/post-list';
import { ApplyRow, Faq, HowItWorks, Qualifier, UseCases } from '../ft/shared-sections';
import {
  ArrowUpRightIcon,
  CalculatorIcon,
  CoinsIcon,
  GrowthIcon,
  StarIcon,
} from '../ft/icons';
import {
  APPLY_LABEL,
  BLOG_SECTION,
  FUNDING_OPTIONS,
  HERO,
  REQUIREMENTS,
  TESTIMONIALS,
} from '../ft/content';
import { DaylightFooter } from './site-footer';
import { DaylightHeader } from './site-header';
import { ArrowDisc, CONTAINER, Chip, CtaButton, GhostButton, SectionHead } from './primitives';

/*
 * DAYLIGHT — the Nanotom Capital homepage in white.
 *
 * A parallel build, not a theme switch. Denis's read of the live site is "too
 * dark, not inviting"; this is where a light version gets built and compared
 * without the dark one moving, and it is expected to diverge from it — that is
 * the whole point of it being its own file rather than a flag inside
 * ft/home-v2.tsx.
 *
 * WHAT IT SHARES, deliberately:
 *
 *  - THE COPY. Every string comes from ft/content.ts, which stays the single
 *    source. Denis asked to reuse the current site's copy, and two copies of a
 *    headline is how the two versions start quietly saying different things
 *    while the comparison is still running.
 *  - THE SECTIONS THAT PAINT FROM TOKENS. HowItWorks, UseCases, Qualifier and
 *    Faq are imported from ft/shared-sections whole. They read --ft-* and
 *    nothing else, so `.dl-surface` re-themes them with no fork; forking them
 *    now would be four files to keep in step for no benefit yet. Fork one the
 *    day this design wants it to look different — not before.
 *
 * WHAT IT DOES NOT SHARE: the chrome, and anything that bakes the dark ground
 * into artwork rather than reading a token. Those are the four edits below, and
 * each is marked DAYLIGHT where it differs from ft/home-v2.tsx, so the two can
 * still be read side by side.
 *
 * It renders its own header and footer, which is why the page is a <div> that
 * contains them rather than just the sections. The root layout renders the
 * dark pair for every Capital route; globals.css hides that pair on this one.
 * See the note there — it is the piece of this that is a preview-route stopgap
 * rather than a design decision.
 */

/**
 * The left inset that lines a full-bleed row's first cell up with CONTAINER
 * while its last cell still runs to the viewport edge. Below the container's
 * breakpoint it collapses to the plain gutter.
 */
const BLEED_INSET = 'pl-[max(1.25rem,calc((100vw-80rem)/2+2rem))]';

const TILE_ICONS = {
  coins: CoinsIcon,
  calculator: CalculatorIcon,
  growth: GrowthIcon,
} as const;

/** A centred heading for the sections the design gives no label chip. */
function PlainHead({ heading, body, id }: { heading: string; body?: string; id?: string }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
      <h2
        id={id}
        className="font-[family-name:var(--font-headline)] text-[clamp(1.75rem,3.6vw,2.5rem)] font-medium leading-[1.15] text-[var(--ft-ink)]"
      >
        {heading}
      </h2>
      {body ? (
        <p className="text-[1.0625rem] leading-[1.6] text-[var(--ft-muted)]">{body}</p>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Sections
 * ------------------------------------------------------------------------- */

/**
 * The press-logo marquee.
 *
 * FOUR copies of the six logos, not eight: the loop translates by exactly -50%,
 * so the track must be an even number of identical copies and its first half
 * must be wider than the viewport. `nt-marquee-track` is the class the
 * reduced-motion guard in globals.css targets.
 *
 * DAYLIGHT — the tiles have a hairline and the band is the light grey. The
 * source logos are 500x500 with opaque WHITE backgrounds; on the dark design
 * that made them read as white slabs, and here it makes them read as nothing at
 * all, because a white tile on a near-white band has no edge. The border draws
 * that edge back. Still placeholders either way — the real fix is transparent
 * artwork, at which point this border should go.
 */
function FeaturedOn() {
  const track = Array.from({ length: 4 }, (_, dup) => dup);

  return (
    <div className="border-t border-[var(--ft-line)] bg-[var(--ft-band)] py-12">
      <div className={CONTAINER}>
        <Chip>Featured On</Chip>
      </div>

      <div
        className="relative mt-8 overflow-hidden
          [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]
          [-webkit-mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]"
      >
        <div className="nt-marquee-track flex w-max animate-[nt-marquee_160s_linear_infinite]">
          {track.map((dup) => (
            <div key={dup} aria-hidden={dup !== 0} className="flex items-center gap-20 pr-20">
              {IMAGES.featuredOn.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={dup === 0 ? 'Press logo' : ''}
                  className="h-12 w-auto shrink-0 rounded-md border border-[var(--ft-line)] object-contain"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section aria-labelledby="dl-hero" className="border-b border-[var(--ft-line)]">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.78fr)]">
        <div className={`${BLEED_INSET} flex flex-col justify-center pr-5 lg:pr-16`}>
          <div className="flex flex-col gap-6 py-16 lg:py-24">
            <p className="font-[family-name:var(--font-headline)] text-[clamp(1.125rem,2vw,1.5rem)] text-[var(--ft-accent)]">
              {HERO.eyebrow}
            </p>
            <h1
              id="dl-hero"
              className="max-w-[16ch] font-[family-name:var(--font-headline)] text-[clamp(2.25rem,5vw,3.5rem)] font-medium leading-[1.08] text-[var(--ft-ink)]"
            >
              {HERO.heading}
            </h1>
            <p className="max-w-[62ch] text-[1.0625rem] leading-[1.55] text-[var(--ft-subtle)]">
              {HERO.body}
            </p>
          </div>

          <dl className="grid grid-cols-3 border-t border-[var(--ft-line)]">
            {HERO.stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`py-8 pr-4 lg:py-10 ${i > 0 ? 'border-l border-[var(--ft-line)] pl-6 lg:pl-10' : ''}`}
              >
                <dd className="text-[clamp(1.5rem,3vw,2rem)] font-semibold leading-none text-[var(--ft-ink)]">
                  {stat.value}
                  <span className="whitespace-pre text-[var(--ft-accent)]">{stat.unit}</span>
                </dd>
                <dt className="mt-3 max-w-[22ch] text-sm text-[var(--ft-muted)] lg:text-base">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>

        {/* The hero video, bleeding to the viewport edge. */}
        <div className="relative isolate min-h-[320px] overflow-hidden border-t border-[var(--ft-line)] lg:min-h-0 lg:border-l lg:border-t-0">
          {/*
            Three layers, as on the live hero: the still frame is its own
            element rather than only the video's `poster`, so it is what shows
            while the video loads, if it is blocked, and under
            `prefers-reduced-motion`, where globals.css hides `.nt-hero-video`.
            Keeping that in CSS is what lets this stay a server component.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={IMAGES.heroBackground}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={IMAGES.heroBackground}
            src={HERO_VIDEO}
            aria-hidden="true"
            className="nt-hero-video absolute inset-0 h-full w-full object-cover"
          />
          {/*
            DAYLIGHT — the scrim runs to WHITE, where the dark design runs to
            rgba(20,20,20). It is the one layer on the page with the old ground
            written into it rather than read from a token, and left alone it
            puts a black fade along the edge where the footage meets a white
            page.

            Turning it over does the same job in reverse: the footage dissolves
            into the page at the bottom instead of being cut off by it, and the
            button sitting on that fade gets a light ground to hold its own
            light fill. It stops well short of opaque — the point is to soften
            the seam, not to wash the video out.
          */}
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(255,255,255,0.92),rgba(255,255,255,0.35)_38%,rgba(255,255,255,0)_70%)]" />

          <div className="relative flex h-full flex-col items-start justify-end p-8 lg:p-12">
            <GhostButton href={CTA_HREF}>{APPLY_LABEL}</GhostButton>
          </div>
        </div>
      </div>

      <FeaturedOn />

      {/* The three CTA tiles, one bordered cell each. */}
      <div className="border-t border-[var(--ft-line)]">
        <div className={`${CONTAINER} grid md:grid-cols-3`}>
          {HERO.tiles.map((tile, i) => {
            const Icon = TILE_ICONS[tile.icon];
            return (
              <Link
                key={tile.title}
                href={tile.href}
                className={`group flex flex-col gap-8 border-[var(--ft-line)] py-10 lg:py-14 ${
                  i > 0 ? 'border-t md:border-l md:border-t-0 md:pl-10' : ''
                } ${i < HERO.tiles.length - 1 ? 'md:pr-10' : ''}`}
              >
                <Icon className="h-11 w-11 text-[var(--ft-accent)]" />

                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-lg font-medium text-[var(--ft-ink)]">{tile.title}</p>
                    <p className="mt-1 text-[1.0625rem] text-[var(--ft-subtle)]">
                      {tile.subtitle}
                    </p>
                  </div>
                  <ArrowDisc />
                </div>

                <p className="border-t border-[var(--ft-line)] pt-6 font-[family-name:var(--font-headline)] text-[1.0625rem] text-[var(--ft-muted)]">
                  {tile.note}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FundingOptions() {
  return (
    <section aria-labelledby="dl-options">
      <SectionHead
        id="dl-options"
        label={FUNDING_OPTIONS.label}
        heading={FUNDING_OPTIONS.heading}
      />

      <div className={`${CONTAINER} py-14 lg:py-20`}>
        <FundingCarousel label={FUNDING_OPTIONS.heading}>
          {FUNDING_OPTIONS.cards.map((card) => (
            <article
              key={card.title}
              /*
               * The card keeps the width it had as half of a two-column grid,
               * so the carousel changes how many exist and how they move, not
               * how they look. `shrink-0` is what makes the flex track scroll
               * rather than squeeze four cards into the viewport.
               */
              className="flex w-full shrink-0 snap-start flex-col gap-6 rounded-2xl border border-[var(--ft-line)] bg-[var(--ft-card)] p-8 lg:w-[calc(50%-0.75rem)] lg:p-10"
            >
              <div>
                <h3 className="font-[family-name:var(--font-headline)] text-[clamp(1.375rem,2.4vw,1.75rem)] font-semibold leading-[1.2] text-[var(--ft-ink)]">
                  {card.title}
                </h3>
                <p className="mt-4 text-[1.0625rem] leading-[1.55] text-[var(--ft-muted)]">
                  {card.body}
                </p>
              </div>

              <ul className="flex flex-col gap-3 border-t border-[var(--ft-line)] pt-6">
                {card.points.map((point) => (
                  <li key={point.label} className="flex gap-3 text-[1.0625rem] leading-[1.5]">
                    {/*
                      DAYLIGHT — the bullet is the gold FILL, not --ft-accent.
                      A dot carries no text, so the text-contrast rule that
                      pushes the accent down to bronze does not apply to it,
                      and brand gold is worth keeping wherever it still can be.
                    */}
                    <span
                      aria-hidden="true"
                      className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--dl-gold)]"
                    />
                    <span className="text-[var(--ft-muted)]">
                      <strong className="font-medium text-[var(--ft-ink)]">{point.label}</strong>
                      {' — '}
                      {point.body}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex flex-wrap items-center gap-4 pt-2">
                <GhostButton href={card.cta.href}>{card.cta.label}</GhostButton>
                {card.tag ? (
                  <p className="text-[0.9375rem] italic text-[var(--ft-subtle)]">{card.tag}</p>
                ) : null}
              </div>
            </article>
          ))}
        </FundingCarousel>

        <ApplyRow className="mt-14" />
      </div>
    </section>
  );
}

function Requirements() {
  return (
    <section aria-labelledby="dl-requirements">
      <div className={`${CONTAINER} py-16 lg:py-24`}>
        <PlainHead id="dl-requirements" heading={REQUIREMENTS.heading} />

        <dl className="mt-12 grid border-t border-[var(--ft-line)] sm:grid-cols-3">
          {REQUIREMENTS.stats.map((stat, i) => (
            <div
              key={stat.value}
              className={`py-8 lg:py-10 ${i > 0 ? 'border-t border-[var(--ft-line)] sm:border-l sm:border-t-0 sm:pl-8' : ''} ${i < REQUIREMENTS.stats.length - 1 ? 'sm:pr-8' : ''}`}
            >
              <dt className="text-sm text-[var(--ft-muted)]">{stat.lead}</dt>
              <dd className="mt-2 text-[clamp(1.5rem,3vw,2rem)] font-semibold leading-none text-[var(--ft-accent)]">
                {stat.value}
              </dd>
              <dd className="mt-2 text-sm text-[var(--ft-muted)]">{stat.trail}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-8 text-center text-[1.0625rem] text-[var(--ft-subtle)]">
          {REQUIREMENTS.note}
        </p>

        {/*
          The second conversion path, and the reason it gets a tinted panel with
          a gold edge rather than the treatment above: a visitor reads the three
          numbers, decides they do not qualify, and this is the only thing on
          the page that catches them.

          DAYLIGHT — the edge is brand gold at a heavier alpha than the dark
          design's 35%. A translucent gold hairline that reads clearly against
          near-black is nearly invisible against near-white, so the panel lost
          the one thing making it impossible to skim past.
        */}
        <div className="mt-12 rounded-2xl border border-[var(--dl-gold)]/70 bg-[var(--ft-card)] p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
            <div>
              <h3 className="font-[family-name:var(--font-headline)] text-[clamp(1.25rem,2.2vw,1.625rem)] font-semibold leading-[1.25] text-[var(--ft-ink)]">
                {REQUIREMENTS.callout.heading}
              </h3>
              <p className="mt-3 max-w-[60ch] text-[1.0625rem] leading-[1.55] text-[var(--ft-muted)]">
                {REQUIREMENTS.callout.body}
              </p>
            </div>
            <CtaButton href={REQUIREMENTS.callout.cta.href} className="shrink-0">
              {REQUIREMENTS.callout.cta.label}
            </CtaButton>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * A review's score, drawn.
 *
 * The number is the accessible name and the stars are hidden from it: five
 * repetitions of "star" is not what a screen reader should read out, and a
 * rounded-up four would be a different claim than the one the customer made.
 *
 * An empty star is the SAME path at low opacity rather than a different mark,
 * so the five always sit on one baseline at identical width.
 *
 * DAYLIGHT — the filled star is the gold fill rather than --ft-accent. It is a
 * mark, not text, so it keeps the brand colour; and a row of bronze stars reads
 * as a row of dead stars.
 */
function Stars({ score }: { score: number }) {
  return (
    <p className="inline-flex items-center gap-1 rounded-full bg-[var(--ft-card-raised)] px-4 py-2">
      <span className="sr-only">{score} out of 5</span>
      {[1, 2, 3, 4, 5].map((position) => (
        <StarIcon
          key={position}
          className={
            position <= score
              ? 'h-4 w-4 text-[var(--dl-gold)]'
              : 'h-4 w-4 text-[var(--ft-subtle)] opacity-35'
          }
        />
      ))}
    </p>
  );
}

/*
 * How wide a cell is, by how many share its row.
 *
 * The grid is SIX columns so a short last row can fill it instead of ending
 * ragged: three cells take two columns each, two take three, one takes all six.
 * That matters because the hairlines here are `gap-px` over a container painted
 * --ft-line, so a column with no cell in it is not blank — it is a solid bar of
 * rule colour. Filling the row avoids that without centring hacks, and it means
 * any number of reviews lays out properly.
 *
 * Written as whole literal class names. Tailwind generates classes by scanning
 * source text, so `lg:col-span-${n}` would compile to nothing at all.
 */
const REVIEW_SPAN: Record<number, string> = {
  1: 'lg:col-span-6',
  2: 'lg:col-span-3',
  3: 'lg:col-span-2',
};

/**
 * The review wall — our own markup over our own copy.
 *
 * The reviews are quoted exactly as written; see the note over TESTIMONIALS in
 * ft/content.ts. Two of them contain the reviewers' own typos and those are not
 * ours to tidy.
 */
function Testimonials() {
  const { reviews } = TESTIMONIALS;
  /* Cells in the final row — 3 when the count divides evenly, not 0. */
  const lastRow = reviews.length % 3 || 3;
  const lastRowFrom = reviews.length - lastRow;

  return (
    <section aria-labelledby="dl-testimonials">
      <SectionHead
        id="dl-testimonials"
        label={TESTIMONIALS.label}
        heading={TESTIMONIALS.heading}
        cta={TESTIMONIALS.cta}
        ctaHref={REVIEWS.collectUrl}
        ctaExternal
      />

      <div className={`${CONTAINER} py-14 lg:py-20`}>
        <ul className="grid gap-px overflow-hidden rounded-2xl border border-[var(--ft-line)] bg-[var(--ft-line)] lg:grid-cols-6">
          {reviews.map((review, index) => (
            <li
              key={review.name}
              className={`flex flex-col items-center gap-5 bg-[var(--ft-bg)] px-6 py-10 text-center lg:px-8 ${
                REVIEW_SPAN[index < lastRowFrom ? 3 : lastRow]
              }`}
            >
              <div className="flex items-center gap-3">
                {/*
                  No reviewer on the wall has a photo, so this is always the
                  initial disc — the same one the blog list uses, which derives
                  a stable hue from the name rather than randomising it. Its
                  background is an inline style and so cannot be re-themed; the
                  `.dl-surface .ft-avatar` rule in globals.css puts the initials
                  back to white on top of it.
                */}
                <Avatar name={review.name} className="h-10 w-10 text-sm" />
                <div className="text-left leading-tight">
                  <p className="font-medium text-[var(--ft-ink)]">{review.name}</p>
                  <p className="text-sm text-[var(--ft-muted)]">
                    {review.title ? `${review.title} - ${review.company}` : review.company}
                  </p>
                </div>
              </div>

              <Stars score={review.score} />

              <blockquote className="w-full rounded-xl border border-[var(--ft-line)] bg-[var(--ft-card)] px-5 py-5 text-[0.9375rem] leading-[1.55] text-[var(--ft-muted)]">
                <p>{review.quote}</p>
              </blockquote>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * The blog band, fed by the site's real published posts.
 *
 * The rows and the pills are /blog's own components — the band on this page is
 * the first few of the same list, so it has to BE the same list rather than
 * look like it.
 */
function BlogPosts({
  posts,
  categories,
  locale,
}: {
  posts: readonly PostSummary[];
  categories: readonly TermRow[];
  locale: string;
}) {
  // A band with a heading and no posts under it reads as broken.
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="dl-blog">
      <SectionHead
        id="dl-blog"
        label={BLOG_SECTION.label}
        heading={BLOG_SECTION.heading}
        cta={BLOG_SECTION.cta}
        ctaHref={blogIndexPath()}
      />

      <CategoryPills categories={categories} />

      {posts.map((post) => (
        <PostRow key={post.id} post={post} locale={locale} />
      ))}
    </section>
  );
}

/* ------------------------------------------------------------------------- */

export function DaylightHome({
  posts,
  categories,
  locale,
}: {
  posts: readonly PostSummary[];
  categories: readonly TermRow[];
  locale: string;
}) {
  return (
    <div className="dl-surface">
      <DaylightHeader />
      <Hero />
      <HowItWorks />
      <UseCases />
      <FundingOptions />
      <Qualifier />
      <Requirements />
      <Testimonials />
      <BlogPosts posts={posts} categories={categories} locale={locale} />
      <Faq />
      <DaylightFooter />
    </div>
  );
}
