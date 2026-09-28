import Link from 'next/link';

import { blogIndexPath, type PostSummary, type TermRow } from '@blog/core';

import { IMAGES, REVIEWS } from '../brand';
import { Avatar, CategoryPills, PostRow } from '../ft/post-list';
import { Faq, Qualifier, UseCases } from '../ft/shared-sections';
import {
  ArrowUpRightIcon,
  CalculatorIcon,
  CoinsIcon,
  GrowthIcon,
  StarIcon,
} from '../ft/icons';
import {
  BLOG_SECTION,
  FUNDING_OPTIONS,
  LOANS,
  HERO,
  REQUIREMENTS,
  TESTIMONIALS,
} from '../ft/content';
import { AmountSlider } from './amount-slider';
import { DaylightHowItWorks } from './how-it-works';
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
 *  - THE SECTIONS THAT PAINT FROM TOKENS. UseCases, Qualifier and Faq are
 *    imported from ft/shared-sections whole. They read --ft-* and nothing else,
 *    so `.dl-surface` re-themes them with no fork. The rule is to fork one only
 *    the day this design wants it to look different — and HowItWorks is the
 *    first to reach that day: its steps are cards on navy here and a connected
 *    timeline there, which is a change of structure that no token expresses.
 *    See ./how-it-works.tsx.
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
 * The press-logo marquee, on the dark region.
 *
 * FOUR copies of the six logos, not eight: the loop translates by exactly -50%,
 * so the track must be an even number of identical copies and its first half
 * must be wider than the viewport. `nt-marquee-track` is the class the
 * reduced-motion guard in globals.css targets.
 *
 * DAYLIGHT — the source logos are 500x500 with opaque WHITE backgrounds, which
 * is what decided this band's treatment rather than the other way round. On the
 * white page they were invisible tiles needing a drawn border to exist at all;
 * on the navy each one is a floating white card for free, which is the effect
 * the border was faking. The mask that fades the track at both ends is the same
 * one the dark design uses — `black` there is a mask stop, not a colour, so it
 * needs no change for the ground beneath it.
 *
 * Still placeholders. Real transparent artwork would want a lighter treatment
 * than a white card, so revisit this when it arrives.
 */
function FeaturedOn() {
  const track = Array.from({ length: 4 }, (_, dup) => dup);

  return (
    <div className="pb-4 pt-12">
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
            <div key={dup} aria-hidden={dup !== 0} className="flex items-center gap-8 pr-8">
              {IMAGES.featuredOn.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={dup === 0 ? 'Press logo' : ''}
                  className="h-20 w-36 shrink-0 rounded-2xl bg-white object-contain p-3 shadow-[0_12px_28px_-16px_rgba(4,16,46,0.7)]"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
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
    <div className={`${CONTAINER} grid gap-6 pb-2 pt-6 md:grid-cols-3 lg:gap-8 lg:pb-4`}>
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
 * reference leads with "No minimum credit score." We cannot: this page states a
 * 551 minimum FICO three sections down, in REQUIREMENTS.stats. So the bold lead
 * is REQUIREMENTS.note — "We look beyond your credit score to say 'Yes' when
 * others won't" — which is the true version of the same promise and is already
 * our copy, verbatim.
 *
 * THE STATS MOVED rather than being dropped. The reference's left column ends
 * at the paragraph, and keeping three figures under a headline this size pushed
 * the card out of the fold. They are now a full-width row directly beneath, so
 * nothing is lost and the hero keeps the reference's composition.
 */
function Hero() {
  /*
   * The last word carries the accent colour, as in the reference. Split off the
   * end of the existing string rather than adding a second field to content.ts:
   * the dark homepage renders HERO.heading whole, and a `headingAccent` there
   * would be a field one of the two designs always ignores.
   */
  const words = HERO.heading.split(' ');
  const lead = words.slice(0, -1).join(' ');
  const accent = words[words.length - 1];

  return (
    <section aria-labelledby="dl-hero" className="border-b border-[var(--ft-line)]">
      <div
        className={`${CONTAINER} grid items-center gap-12 py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 lg:py-20`}
      >
        <div className="flex flex-col items-start gap-7">
          {/*
            The rating badge. Dark blue on a cyan tint at 10.45:1 — the cyan
            itself is a fill here, never the text, for the reason set out over
            the palette in globals.css.

            Built from HERO.stats rather than written out, so the day the rating
            changes it changes in one place and both designs follow.
          */}
          <p className="rounded-lg bg-[var(--dl-pop-tint)] px-4 py-2 text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-[var(--ft-ink)]">
            {HERO.stats[2]?.value}-Star Average Rating
          </p>

          <h1
            id="dl-hero"
            className="max-w-[13ch] font-[family-name:var(--font-headline)] text-[clamp(2.75rem,6.2vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.02em] text-[var(--ft-ink)]"
          >
            {lead}{' '}
            <span className="text-[var(--dl-display)]">{accent}</span>
          </h1>

          <p className="max-w-[54ch] text-[clamp(1.0625rem,1.5vw,1.1875rem)] leading-[1.7] text-[var(--ft-muted)]">
            <strong className="font-semibold text-[var(--ft-ink)]">{REQUIREMENTS.note}</strong>{' '}
            {HERO.body}
          </p>
        </div>

        {/* The amount card. A client island; see ./amount-slider. */}
        <AmountSlider />
      </div>

      {/*
        The three figures the left column used to carry, given the full width.
        Same markup as the dark hero's <dl>, one row lower.
      */}
      <dl className="border-t border-[var(--ft-line)]">
        <div className={`${CONTAINER} grid grid-cols-3`}>
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
        </div>
      </dl>

    </section>
  );
}

/**
 * The funding options, as a sticky rail beside a scrolling column of products.
 *
 * DAYLIGHT — modelled on the National Funding section Denis sent: the heading
 * holds still on the left while the products scroll past it on the right. The
 * dark design's horizontal carousel is gone from this build, and with it the
 * client component that drove it — this section is now entirely server
 * rendered, because a vertical stack needs no scroll logic at all.
 *
 * WHY THE CARDS LOST FIVE BULLETS EACH. They carried all six `points`, which is
 * a specification, not a teaser, and made each card taller than the viewport in
 * a column of four. The reference's cards are a title, a blurb, one headline
 * figure and a link — so these keep `points[0]`, the lead spec, and send the
 * rest to the product page.
 *
 * Nothing is lost by that: every card links to a /funding-solutions page whose
 * LOAN_PAGES entry carries the amount, the term, the repayment shape, the
 * funding time, the entry requirements and a pros/cons pair — considerably more
 * than the six bullets it replaces.
 *
 * AND THE FIGURE IS THE CARD'S OWN, deliberately. The obvious move was to pull
 * `facts.amount` off the linked LOAN_PAGES entry, which would have given every
 * card a clean "$15,000 to $5,000,000" line exactly like the reference. It is
 * wrong here: the interest-only card links to /revenue-based-financing as the
 * closest fit among the pages that exist, not because it IS that product — see
 * the note on its `cta` in content.ts — so it would have printed another
 * product's limits under its own name. On a page taking live credit
 * applications that is not a cosmetic error.
 */
function FundingOptions() {
  return (
    <section aria-labelledby="dl-options" className="border-t border-[var(--ft-line)]">
      <div
        className={`${CONTAINER} grid gap-10 py-14 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16 lg:py-20`}
      >
        {/*
          The rail. `self-start` is what makes `sticky` work inside a grid — a
          grid item stretches to the row height by default, so it has no room to
          move within its own track and sticks to nothing.

          `top-28` clears the sticky site header, which is itself `top-0`;
          without the offset the heading slides under it.
        */}
        <div className="flex flex-col items-start gap-6 lg:sticky lg:top-28 lg:self-start">
          <Chip>{FUNDING_OPTIONS.label}</Chip>
          <h2
            id="dl-options"
            className="max-w-[16ch] font-[family-name:var(--font-headline)] text-[clamp(1.875rem,3.6vw,2.75rem)] font-bold leading-[1.1] text-[var(--ft-ink)]"
          >
            {FUNDING_OPTIONS.heading}
          </h2>

          {/*
            The rail's paragraph is LOANS.hero.body, not a new sentence written
            for this layout. FUNDING_OPTIONS has no body of its own, and the
            reference's left column is a headline over a paragraph — so rather
            than invent marketing copy for a page that takes credit
            applications, this borrows the line /funding-solutions already
            opens with. It describes exactly this: the options, side by side,
            one application. Give it a sentence of its own and it goes here.
          */}
          <p className="max-w-[46ch] text-[1.0625rem] leading-[1.65] text-[var(--ft-muted)]">
            {LOANS.hero.body}
          </p>

          <CtaButton className="mt-2" />
        </div>

        <ul className="flex flex-col gap-5 lg:gap-6">
          {FUNDING_OPTIONS.cards.map((card) => {
            /*
             * Indexed access, so this is `| undefined` under the build's
             * stricter typecheck even though every card is written with six
             * points. Rendered conditionally rather than asserted — a card
             * added later without points should lose a line, not crash the
             * homepage.
             */
            const lead = card.points[0];

            return (
              <li
                key={card.title}
                className="rounded-2xl border border-[var(--ft-line)] bg-[var(--ft-card)] p-6 lg:p-8"
              >
                <h3 className="font-[family-name:var(--font-headline)] text-[clamp(1.25rem,2vw,1.5rem)] font-semibold leading-[1.25] text-[var(--ft-ink)]">
                  {card.title}
                </h3>

                <p className="mt-3 text-[1.0625rem] leading-[1.55] text-[var(--ft-muted)]">
                  {card.body}
                </p>

                {lead ? (
                  <p className="mt-5 border-t border-[var(--ft-line)] pt-5 text-[1.0625rem] leading-[1.5]">
                    <strong className="font-semibold text-[var(--ft-ink)]">{lead.label}</strong>
                    <span className="text-[var(--ft-muted)]">{' — '}{lead.body}</span>
                  </p>
                ) : null}

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <GhostButton href={card.cta.href}>{card.cta.label}</GhostButton>
                  {card.tag ? (
                    <p className="text-[0.9375rem] italic text-[var(--ft-subtle)]">{card.tag}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
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

      {/*
        THE DARK REGION — one navy ground carrying three bands, per the
        reference: the press marquee, the three destination tiles and How It
        Works. Grouped in a single element rather than given a dark class each,
        so there are no light seams between them and the page has exactly one
        dark anchor. See the long note over `.dl-deep` in globals.css.
      */}
      <div className="dl-deep">
        <FeaturedOn />
        <DestinationTiles />
        <DaylightHowItWorks />
      </div>

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
