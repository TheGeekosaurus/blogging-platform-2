import Link from 'next/link';

import { blogIndexPath, type PostSummary, type TermRow } from '@blog/core';

import { IMAGES } from '../brand';
import { CategoryPills, PostRow } from '../ft/post-list';
import { Faq } from '../ft/shared-sections';
import { ArrowUpRightIcon, CalculatorIcon, CoinsIcon, GrowthIcon } from '../ft/icons';
import {
  BLOG_SECTION,
  FUNDING_OPTIONS,
  LOANS,
  HERO,
  REQUIREMENTS,
} from '../ft/content';
import { DaylightDifference } from './difference';
import { DaylightFundingRail } from './funding-rail';
import { DaylightHero } from './hero';
import { DaylightTestimonials } from './testimonials';
import { DaylightHowItWorks } from './how-it-works';
import { DaylightUseCases } from './use-cases';
import { ArrowDisc, CONTAINER, Chip, SectionIntro } from './primitives';

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
 *  - THE SECTIONS THAT PAINT FROM TOKENS. Faq is imported from
 *    ft/shared-sections whole. They read --ft-* and
 *    nothing else, so `.dl-surface` re-themes them with no fork; forking them
 *    would be four files to keep in step for no benefit. HowItWorks was briefly
 *    forked here as cards on a navy ground and Denis reverted it — the fork is
 *    deleted rather than parked behind a flag, so there is one of it again.
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

const TILE_ICONS = {
  coins: CoinsIcon,
  calculator: CalculatorIcon,
  growth: GrowthIcon,
} as const;

/* ---------------------------------------------------------------------------
 * Sections
 * ------------------------------------------------------------------------- */

/**
 * The press-logo marquee, on the dark region.
 *
 * FOUR copies of the six logos, not eight: the loop translates by exactly -50%,
 * so the track must be an even number of identical copies and its first half
 * must be wider than the viewport. `nt-marquee-track` is the class the
 * reduced-motion guard in globals.css targets.
 *
 * DAYLIGHT — its own section on the white ground, with the logos as cards
 * floating over it. The source images are 500x500 with opaque WHITE
 * backgrounds, so on white there is no tile edge to see and the card has to be
 * drawn rather than inherited.
 *
 * It is a SHADOW that draws it, not the border an earlier pass used. A hairline
 * gives a white rectangle on white a hard edge and no depth, which reads as a
 * mistake; a shadow lifts it off the page, which is what "floating" means. The
 * shadow is a tinted navy rather than neutral black — a grey shadow under a
 * card on a page this blue reads as dirt.
 *
 * The mask that fades the track at both ends is unaffected by the ground:
 * `black` there is a mask stop, not a colour.
 *
 * Still placeholders. Real transparent artwork would want a lighter treatment
 * than a white card, so revisit this when it arrives.
 */
function FeaturedOn() {
  const track = Array.from({ length: 4 }, (_, dup) => dup);

  return (
    <section aria-label="Press coverage" className="py-10 lg:py-12">
      <div className={CONTAINER}>
        <Chip>Featured On</Chip>
      </div>

      {/*
        `py-8` is not spacing — it is headroom for the cards' shadows.

        This element has to be `overflow-hidden`: the track is four copies of
        the logos and is far wider than the viewport, so without it the page
        scrolls sideways. But overflow clips BOTH axes, and the shadow reaches
        about 26px below each card, so it was being cut off flat along the top
        and bottom edges of the strip. Padding gives it room inside the clip.

        `overflow-x-hidden` is not the fix. Setting one axis to hidden computes
        the other to `auto`, which turns this into a scroll container — the
        shadow would be reachable by scrolling rather than visible.

        The mask needs no adjustment: it fades horizontally and covers the
        padding at full opacity.
      */}
      <div
        className="relative mt-6 overflow-hidden py-8
          [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]
          [-webkit-mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]"
      >
        <div className="nt-marquee-track flex w-max animate-[nt-marquee_160s_linear_infinite]">
          {track.map((dup) => (
            <div key={dup} aria-hidden={dup !== 0} className="flex items-center gap-8 pr-8">
              {IMAGES.featuredOn.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={dup === 0 ? 'Press logo' : ''}
                  className="h-20 w-36 shrink-0 rounded-2xl bg-white object-contain p-3 shadow-[0_10px_26px_-12px_rgba(11,45,114,0.38)]"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * The three destination tiles, as floating cards on the dark region.
 *
 * Where the dark design draws them as three cells of one bordered grid, these
 * are separated cards — the treatment Denis pointed at. The consequence worth
 * noting is that the hairline rules between the cells are gone, and with them
 * the internal divider above each tile's footnote: on a card, whitespace does
 * that job and a rule would be one line too many.
 *
 * Each card is still a single <Link>, so the whole card is the target rather
 * than just the title — the arrow disc is decoration inside the link, not a
 * second control.
 */
function DestinationTiles() {
  return (
    <div className={`${CONTAINER} grid gap-6 py-14 md:grid-cols-3 lg:gap-8 lg:py-20`}>
      {HERO.tiles.map((tile) => {
        const Icon = TILE_ICONS[tile.icon];
        return (
          <Link
            key={tile.title}
            href={tile.href}
            className="dl-card group flex flex-col gap-7 p-8 transition-transform duration-200 hover:-translate-y-1 lg:p-10"
          >
            <Icon className="h-11 w-11 text-[var(--ft-accent)]" />

            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-lg font-semibold text-[var(--ft-ink)]">{tile.title}</p>
                <p className="mt-1 text-[1.0625rem] text-[var(--ft-subtle)]">{tile.subtitle}</p>
              </div>
              <ArrowDisc />
            </div>

            <p className="mt-auto font-[family-name:var(--font-headline)] text-[1.0625rem] leading-[1.5] text-[var(--ft-muted)]">
              {tile.note}
            </p>
          </Link>
        );
      })}
    </div>
  );
}

/**
 * The hero.
 *
 * DAYLIGHT — this is the section that departs furthest from ft/home-v2.tsx, on
 * a reference Denis sent: a large two-column hero with the pitch on the left
 * and a single interactive card on the right. The dark design's autoplaying
 * video panel is gone from this build entirely; what replaces it is a control
 * the visitor can actually touch, which is the whole argument for the change.
 *
 * THE COPY IS OURS, not the reference's, and one line of it matters. The
 * reference leads with "No minimum credit score." We cannot: there is one, 551,
 * and FAQ's `credit-score` answer states it further down THIS page. So the bold
 * lead is REQUIREMENTS.note — "We look beyond your credit score to say 'Yes'
 * when others won't" — which is the true version of the same promise and is
 * already our copy, verbatim.
 *
 * It still reads REQUIREMENTS although Daylight no longer renders that section
 * (Denis removed it): the sentence is the qualifying copy's own summary of
 * itself, and should the 551 stance ever soften, the hero ought to move with it
 * rather than keep hedging against a minimum nobody applies any more.
 *
 * THE STATS MOVED rather than being dropped. The reference's left column ends
 * at the paragraph, and keeping three figures under a headline this size pushed
 * the card out of the fold. They are now a full-width row directly beneath, so
 * nothing is lost and the hero keeps the reference's composition.
 */
/*
 * The funding options. The markup moved to ./funding-rail.tsx on 2026-10-05,
 * when Denis asked the industry pages to mimic this section — see the note
 * there. What stays here is which copy and which products the homepage hands
 * it, which is the only part that was ever about the homepage.
 *
 * THE RAIL'S PARAGRAPH IS LOANS.hero.body, not a sentence written for this
 * layout. FUNDING_OPTIONS has no body of its own, and the reference's left
 * column is a headline over a paragraph — so rather than invent marketing copy
 * for a page that takes credit applications, this borrows the line
 * /funding-solutions already opens with. It describes exactly this: the
 * options, side by side, one application. Give it a sentence of its own and it
 * goes here.
 */
function FundingOptions() {
  return (
    <DaylightFundingRail
      label={FUNDING_OPTIONS.label}
      heading={FUNDING_OPTIONS.heading}
      body={LOANS.hero.body}
      cards={FUNDING_OPTIONS.cards}
    />
  );
}

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
    <section aria-labelledby="dl-blog" className="dl-bloglist border-t border-[var(--ft-line)]">
      <div className={`${CONTAINER} pb-10 pt-14 lg:pb-12 lg:pt-20`}>
        <SectionIntro
          id="dl-blog"
          label={BLOG_SECTION.label}
          heading={BLOG_SECTION.heading}
          cta={BLOG_SECTION.cta}
          ctaHref={blogIndexPath()}
        />
      </div>

      <CategoryPills categories={categories} />

      {posts.map((post) => (
        <PostRow key={post.id} post={post} locale={locale} showAuthor={false} />
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
    /*
      NO HEADER OR FOOTER HERE. Both are in the root layout now, which renders
      Daylight's pair for every Capital route — see the note there. This used to
      draw its own and rely on a CSS rule to hide the layout's dark pair.
    */
    <div className="dl-surface">
      {/* Shared with /funding-solutions — see ./hero.tsx. */}
      <DaylightHero heading={HERO.heading} lead={REQUIREMENTS.note} body={HERO.body} />

      {/*
        One navy band, carrying the three destination cards and nothing else.
        The press marquee above it and How It Works below are both on white —
        each was on a colour at some point and each came back. See the note over
        `.dl-deep` in globals.css for how that settled.
      */}
      <FeaturedOn />
      <div className="dl-deep">
        <DestinationTiles />
      </div>

      <DaylightHowItWorks />

      {/*
        Use of funds, on the band artwork rather than on white.

        A wrapper rather than a prop, because UseCases is shared with the dark
        homepage and takes none — and it needs none: everything it draws is
        opaque, so it sits ON the artwork without knowing the artwork is there.
        Its header band covers its own strip in cream and the grid covers its
        own in white; the picture shows in the margins between them.
      */}
      <div className="dl-art">
        <DaylightUseCases />
      </div>
      <FundingOptions />
      <DaylightDifference />
      <DaylightTestimonials />
      <BlogPosts posts={posts} categories={categories} locale={locale} />
      {/* One row at a time, and no second Ask-a-Question beside the list — see
          the notes on both props in ft/shared-sections. */}
      <Faq exclusive blurb={false} label="FAQ" />
    </div>
  );
}
