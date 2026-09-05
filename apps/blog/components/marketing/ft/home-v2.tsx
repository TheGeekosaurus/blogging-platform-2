import Image from 'next/image';
import Link from 'next/link';

import {
  blogIndexPath,
  categoryPath,
  excerptFor,
  formatPostDate,
  mediaPublicUrl,
  postAuthorName,
  postPath,
  type PostSummary,
  type TermRow,
} from '@blog/core';

import { CTA_HREF, HERO_VIDEO, IMAGES, REVIEWS } from '../brand';
import { CtaButton } from '../cta-button';
import { HighLevelForm } from '../highlevel-form';
import { TestimonialWall } from '../testimonial-wall';
import { FundingCarousel } from './funding-carousel';
import {
  ArrowUpRightIcon,
  CalculatorIcon,
  CashFlowIcon,
  CoinsIcon,
  ConsolidateIcon,
  EquipmentIcon,
  ExpandIcon,
  GrowthIcon,
  HiringIcon,
  InventoryIcon,
  MarketingIcon,
  PayrollIcon,
} from './icons';
import {
  APPLY_LABEL,
  BLOG_SECTION,
  FUNDING_OPTIONS,
  HERO,
  HOW_IT_WORKS,
  QUALIFIER,
  REQUIREMENTS,
  TESTIMONIALS,
  USE_CASES,
} from './content';

/*
 * The Nanotom Capital homepage candidate.
 *
 * Started as a rebuild of a tech-blog Figma template ("FutureTech") and is now a
 * funding lead-gen page. What survives from the template is its VISUAL LANGUAGE
 * — the dark palette, the bordered-cell grid that divides every band, the pill
 * and chip shapes, the section header bands, the -3% tracking, the container
 * width and the type scale. None of its content survives; the sections that were
 * only ever vehicles for it (FutureTech Features, the ebooks/whitepapers
 * resource blocks, the "Future Tech Revolution" closing band) are gone rather
 * than re-labelled, because a funding site has nothing to put in them.
 *
 * The copy is the live GoHighLevel site's, in ./content — see that file's note
 * on why it is duplicated from nntm/homepage.tsx rather than shared with it.
 *
 * Ordering follows the funnel: what we do (hero, proof, options), then how it
 * works, then the qualifier, then the objection handlers (what funding is for,
 * whether you qualify), then social proof, then the blog. The blog is last on
 * purpose — it is the least commercial thing on the page.
 *
 * Deviations from the brief worth knowing:
 *
 *  - "How It Works" is a numbered timeline, not cards, so it cannot be mistaken
 *    for the three-card CTA row directly above it.
 *
 * The hero's CTA sits over the video, where the design puts it. It was briefly
 * moved into the left column alongside a second Loan Calculator button, on the
 * argument that a lone button over footage looked orphaned once the template's
 * placeholder text was stripped out — Denis looked at both and kept the design's
 * arrangement. The placeholder text and avatar discs that used to sit above the
 * button are gone for good; only the button came back.
 *
 * Everything here is a server component except the review wall, which has to be
 * one to call the iframe resizer — see testimonial-wall.tsx.
 */

/* ---------------------------------------------------------------------------
 * Primitives
 * ------------------------------------------------------------------------- */

/** The centred column. Matches the site header's container exactly. */
const CONTAINER = 'mx-auto w-full max-w-7xl px-5 lg:px-8';

/**
 * The left inset that lines a full-bleed row's first cell up with CONTAINER,
 * while its last cell still runs to the viewport edge. Below the container's
 * breakpoint it collapses to the plain gutter.
 */
const BLEED_INSET = 'pl-[max(1.25rem,calc((100vw-80rem)/2+2rem))]';

const TILE_ICONS = {
  coins: CoinsIcon,
  calculator: CalculatorIcon,
  growth: GrowthIcon,
} as const;

const USE_CASE_ICONS = {
  inventory: InventoryIcon,
  payroll: PayrollIcon,
  expand: ExpandIcon,
  marketing: MarketingIcon,
  cashflow: CashFlowIcon,
  equipment: EquipmentIcon,
  hiring: HiringIcon,
  consolidate: ConsolidateIcon,
} as const;

/** The grey chip every section label sits in. */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-lg bg-[var(--ft-card-raised)] px-3 py-1.5 text-sm font-medium uppercase tracking-[0.14em] text-[var(--ft-ink)] sm:text-[0.8125rem]">
      {children}
    </span>
  );
}

/** The dark bordered button with a gold arrow, used for every secondary action. */
function GhostButton({
  children,
  href,
  external,
}: {
  children: React.ReactNode;
  href?: string;
  /** Off-site, so it opens in a new tab — the treatment site-header.tsx uses. */
  external?: boolean;
}) {
  const className =
    'inline-flex shrink-0 items-center gap-3 rounded-xl border border-[var(--ft-line)] bg-[var(--ft-card)] px-6 py-3.5 text-[0.9375rem] text-[var(--ft-muted)] transition-colors hover:border-[var(--ft-accent)] hover:text-[var(--ft-ink)]';
  const label = (
    <>
      {children}
      <ArrowUpRightIcon className="h-4 w-4 text-[var(--ft-accent)]" />
    </>
  );

  /*
   * next/link for internal destinations, a plain anchor for off-site ones.
   * Not cosmetic: `trailingSlash: true` means /funding-solutions/line-of-credit
   * costs a 308 to the slashed form when it is a bare <a>, and Link both avoids
   * that hop and prefetches.
   */
  if (href && !external) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <a
      href={href ?? '#'}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={className}
    >
      {label}
    </a>
  );
}

/** The solid gold disc with a dark arrow, used on the three CTA tiles. */
function ArrowDisc() {
  return (
    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--ft-accent)] text-[var(--ft-bg)] transition-transform group-hover:-translate-y-0.5">
      <ArrowUpRightIcon className="h-[18px] w-[18px]" />
    </span>
  );
}

/** Every "Get Funded" on the page, centred under its section. */
function ApplyRow({ className = '' }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <CtaButton>{APPLY_LABEL}</CtaButton>
    </div>
  );
}

/**
 * A section's header band: darker ground, label chip, display heading, and an
 * optional action pinned right.
 */
function SectionHead({
  label,
  heading,
  cta,
  ctaHref,
  ctaExternal,
  id,
}: {
  label: string;
  heading: string;
  cta?: string;
  ctaHref?: string;
  ctaExternal?: boolean;
  id?: string;
}) {
  return (
    <div className="border-y border-[var(--ft-line)] bg-[var(--ft-band)]">
      <div
        className={`${CONTAINER} flex flex-col gap-8 py-16 md:flex-row md:items-center md:justify-between md:gap-16 lg:py-24`}
      >
        <div className="flex flex-col items-start gap-4">
          <Chip>{label}</Chip>
          <h2
            id={id}
            className="max-w-[26ch] font-[family-name:var(--font-headline)] text-[clamp(1.875rem,4vw,2.875rem)] font-medium leading-[1.12] text-[var(--ft-ink)]"
          >
            {heading}
          </h2>
        </div>
        {cta ? (
          <GhostButton href={ctaHref} external={ctaExternal}>
            {cta}
          </GhostButton>
        ) : null}
      </div>
    </div>
  );
}

/** A centred heading for the sections the design gives no label chip. */
function PlainHead({
  heading,
  body,
  id,
}: {
  heading: string;
  body?: string;
  id?: string;
}) {
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

/**
 * An initial disc standing in for a headshot, on blog posts whose author has no
 * avatar on record.
 *
 * The hue is derived from the name so a given person is always the same colour,
 * and the arithmetic is pure — no randomness, which would differ between the
 * server and client renders and trip hydration.
 */
function Avatar({ name, className = 'h-10 w-10 text-sm' }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('');
  const hue = [...name].reduce((total, char) => total + char.charCodeAt(0), 0) % 360;

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-medium text-[var(--ft-ink)] ring-1 ring-white/15 ${className}`}
      style={{ backgroundColor: `hsl(${hue} 8% 30%)` }}
    >
      {initials}
    </span>
  );
}

/**
 * The ray burst behind the hero, and the fill for a post with no image.
 *
 * Generated at module scope from a deterministic hash so the server and client
 * draw identical markup. `Math.random()` here would hydrate-mismatch every load.
 */
const RAYS = Array.from({ length: 130 }, (_, i) => {
  const hash = (n: number) => {
    const x = Math.sin(n * 127.1) * 43758.5453;
    return x - Math.floor(x);
  };
  const spread = -0.5 + (i / 129) * 1.9; // radians, fanning right and down
  const angle = spread + (hash(i) - 0.5) * 0.06;
  const length = 55 + hash(i + 500) * 75;
  return {
    x2: 2 + Math.cos(angle) * length,
    y2: 18 + Math.sin(angle) * length,
    opacity: 0.06 + hash(i + 900) * 0.5,
    width: 0.07 + hash(i + 1300) * 0.28,
  };
});

function RayBurst({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 60"
      preserveAspectRatio="xMinYMid slice"
      className={`ft-rays ${className ?? ''}`}
      aria-hidden="true"
    >
      {RAYS.map((ray, i) => (
        <line
          key={i}
          x1="2"
          y1="18"
          x2={ray.x2}
          y2={ray.y2}
          stroke="#ffffff"
          strokeWidth={ray.width}
          opacity={ray.opacity}
        />
      ))}
    </svg>
  );
}

/** Stands in for a post's featured image when it has none. */
function ImageSlot({ className }: { className?: string }) {
  return (
    <div
      className={`relative isolate flex items-center justify-center overflow-hidden rounded-xl border border-[var(--ft-line)] bg-[linear-gradient(135deg,#1f1f22,#141414_60%)] ${className ?? ''}`}
    >
      <RayBurst className="absolute inset-0 h-full w-full opacity-[0.18]" />
      <GrowthIcon className="relative h-16 w-16 text-[var(--ft-accent)] opacity-30" />
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Sections
 * ------------------------------------------------------------------------- */

/**
 * The press-logo marquee.
 *
 * FOUR copies of the six logos, not eight. The loop translates by exactly -50%,
 * so the track must be an even number of identical copies and its first half
 * must be wider than the viewport — four is the smallest count that satisfies
 * both on a desktop screen. Eight was simply more repetition than the effect
 * needs, and at 100s it read as the same six logos cycling past twice over.
 *
 * `nt-marquee-track` is what the reduced-motion rule in globals.css targets. It
 * used to target the escaped Tailwind class `.animate-\\[nt-marquee_100s_...\\]`,
 * which meant changing the duration — exactly what this commit does — silently
 * dropped the guard for readers who asked for no motion. A plain class cannot
 * rot that way.
 *
 * The logos are the source art, unfiltered: they are 500x500 with opaque WHITE
 * backgrounds, so they read as white tiles on this dark band. That is expected
 * and temporary — these are placeholders, and the fix is transparent artwork,
 * not a filter stack here.
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
                  className="h-12 w-auto shrink-0 rounded-md object-contain"
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
    <section aria-labelledby="ft-hero" className="border-b border-[var(--ft-line)]">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.78fr)]">
        <div className={`${BLEED_INSET} flex flex-col justify-center pr-5 lg:pr-16`}>
          <div className="flex flex-col gap-6 py-16 lg:py-24">
            <p className="font-[family-name:var(--font-headline)] text-[clamp(1.125rem,2vw,1.5rem)] text-[var(--ft-accent)]">
              {HERO.eyebrow}
            </p>
            <h1
              id="ft-hero"
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
            Three layers, as on the live hero: the still frame is its own element
            rather than only the video's `poster`, so it is what shows while the
            video loads, if it is blocked, and under `prefers-reduced-motion`,
            where globals.css hides `.nt-hero-video`. Keeping that in CSS is what
            lets this stay a server component.
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
            Ties the footage into the page ground on both meeting edges, and
            gives the button below something to sit on.

            Deliberately lighter than the scrim this panel carried when it held
            the template's placeholder paragraph: that text needed the footage
            dimmed to 97% at the base to stay legible over moving frames. A
            button does not — GhostButton paints its own opaque --ft-card — so
            the video keeps its brightness.
          */}
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(20,20,20,0.75),rgba(20,20,20,0.15))]" />

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
                    <p className="mt-1 text-[1.0625rem] text-[var(--ft-subtle)]">{tile.subtitle}</p>
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

/**
 * How it works, as a numbered timeline.
 *
 * Deliberately not three cards: the CTA tiles directly above are already a
 * three-column row of bordered cells, and repeating that shape would make two
 * different things look like one. Steps are not destinations, so there are no
 * arrow buttons either — the only action is the single button underneath.
 *
 * The connecting rule is drawn as a flex-1 hairline after each numeral rather
 * than as one line behind the row, so it stops at the last step and disappears
 * cleanly when the grid stacks.
 */
function HowItWorks() {
  return (
    <section aria-labelledby="ft-how" className="border-b border-[var(--ft-line)]">
      <div className={`${CONTAINER} py-16 lg:py-24`}>
        <PlainHead id="ft-how" heading={HOW_IT_WORKS.heading} />

        {/*
         * The sweep is staggered purely by `animation-delay`, computed here so
         * the order lives with the markup rather than in five CSS rules: numeral,
         * its rule, the next numeral, and so on, 1.2s apart.
         */}
        <ol className="ft-steps mt-14 grid gap-12 md:grid-cols-3 md:gap-8">
          {HOW_IT_WORKS.steps.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-5">
              <div className="flex items-center gap-5">
                <span
                  aria-hidden="true"
                  style={{ animationDelay: `${i * 2.4}s` }}
                  className="ft-step-number font-[family-name:var(--font-headline)] text-[2.75rem] font-semibold leading-none text-[var(--ft-accent)]"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                {i < HOW_IT_WORKS.steps.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="relative hidden h-px flex-1 bg-[var(--ft-line)] md:block"
                  >
                    {/* Drawn over the resting rule, so the rule never disappears. */}
                    <span
                      style={{ animationDelay: `${i * 2.4 + 1.2}s` }}
                      className="ft-step-fill absolute inset-0 block bg-[var(--ft-accent)]"
                    />
                  </span>
                ) : null}
              </div>

              <div>
                <h3 className="text-lg font-medium text-[var(--ft-ink)]">{step.title}</h3>
                <p className="mt-2 max-w-[34ch] text-[1.0625rem] leading-[1.55] text-[var(--ft-muted)]">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <ApplyRow className="mt-14" />
      </div>
    </section>
  );
}

function FundingOptions() {
  return (
    <section aria-labelledby="ft-options">
      <SectionHead
        id="ft-options"
        label={FUNDING_OPTIONS.label}
        heading={FUNDING_OPTIONS.heading}
      />

      <div className={`${CONTAINER} py-14 lg:py-20`}>
        <FundingCarousel label={FUNDING_OPTIONS.heading}>
          {FUNDING_OPTIONS.cards.map((card) => (
            <article
              key={card.title}
              /*
               * The card keeps the width it had as half of a two-column grid, so
               * the carousel changes how many exist and how they move, not how
               * they look. `shrink-0` is what makes the flex track scroll rather
               * than squeeze four cards into the viewport.
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
                    <span
                      aria-hidden="true"
                      className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ft-accent)]"
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

/**
 * The qualifier, embedded rather than rebuilt.
 *
 * This is the same GoHighLevel survey the live homepage runs — ten questions
 * with conditional logic and two consent checkboxes behind CRM automations.
 * Rebuilding it natively would mean reconstructing that logic and the consent
 * wording, where a mistake silently drops leads. HighLevel stays the system of
 * record; see highlevel-form.tsx.
 */
function Qualifier() {
  return (
    <section aria-labelledby="ft-qualifier">
      <SectionHead id="ft-qualifier" label={QUALIFIER.label} heading={QUALIFIER.heading} />

      <div className={`${CONTAINER} py-14 lg:py-20`}>
        <ul className="mx-auto flex max-w-4xl flex-col justify-center gap-4 sm:flex-row sm:gap-10">
          {QUALIFIER.points.map((point) => (
            <li
              key={point}
              className="flex items-center gap-3 text-[1.0625rem] text-[var(--ft-muted)]"
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ft-accent)]"
              />
              {point}
            </li>
          ))}
        </ul>

        {/*
          The survey renders its own white surface, so it sits on a light panel
          rather than straight on the dark ground where its edges would look like
          a rendering fault.
        */}
        <div className="mt-10 overflow-hidden rounded-2xl bg-white">
          <HighLevelForm />
        </div>
      </div>
    </section>
  );
}

function UseCases() {
  return (
    <section aria-labelledby="ft-uses" className="border-y border-[var(--ft-line)]">
      <div className={`${CONTAINER} py-16 lg:py-24`}>
        <PlainHead id="ft-uses" heading={USE_CASES.heading} body={USE_CASES.body} />

        <ul className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--ft-line)] bg-[var(--ft-line)] lg:grid-cols-4">
          {USE_CASES.items.map((item) => {
            const Icon = USE_CASE_ICONS[item.icon];
            return (
              <li
                key={item.label}
                className="flex flex-col items-center gap-4 bg-[var(--ft-bg)] px-5 py-10 text-center"
              >
                <Icon className="h-8 w-8 text-[var(--ft-accent)]" />
                <span className="text-[1.0625rem] leading-[1.4] text-[var(--ft-ink)]">
                  {item.label}
                </span>
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
    <section aria-labelledby="ft-requirements">
      <div className={`${CONTAINER} py-16 lg:py-24`}>
        <PlainHead id="ft-requirements" heading={REQUIREMENTS.heading} />

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
          numbers, decides they do not qualify, and this is the only thing on the
          page that catches them. Styled to be impossible to skim past.
        */}
        <div className="mt-12 rounded-2xl border border-[var(--ft-accent)]/35 bg-[var(--ft-card)] p-8 lg:p-10">
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

function Testimonials() {
  return (
    <section aria-labelledby="ft-testimonials">
      <SectionHead
        id="ft-testimonials"
        label={TESTIMONIALS.label}
        heading={TESTIMONIALS.heading}
        cta={TESTIMONIALS.cta}
        ctaHref={REVIEWS.collectUrl}
        ctaExternal
      />

      <div className={`${CONTAINER} py-14 lg:py-20`}>
        <TestimonialWall />
      </div>
    </section>
  );
}

/**
 * The blog band, fed by the site's real published posts.
 *
 * The left cell is the post's featured image with a small byline under it,
 * mirroring components/blog/post-byline.tsx so a reader gets the same author
 * treatment here as on the post itself.
 *
 * `PostSummary` carries no categories — SUMMARY_COLUMNS does not select
 * post_terms — and nothing here needs one, since the per-post category label
 * lived in the author cell that is now a thumbnail. Widening the shared summary
 * query would have put a join on every post listing in the app for a label this
 * layout does not have room for.
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
    <section aria-labelledby="ft-blog">
      <SectionHead
        id="ft-blog"
        label={BLOG_SECTION.label}
        heading={BLOG_SECTION.heading}
        cta={BLOG_SECTION.cta}
        ctaHref={blogIndexPath()}
      />

      {/*
       * Links to the archives, not tabs. "All" keeps the design's emphasis
       * because it is where the whole list lives, but there is deliberately no
       * `aria-current` — none of these is the page you are on.
       */}
      {categories.length > 0 ? (
        <nav aria-label="Post categories" className="border-b border-[var(--ft-line)]">
          <ul className={`${CONTAINER} flex flex-wrap gap-4 py-10`}>
            <li>
              <Link
                href={blogIndexPath()}
                className="inline-block rounded-[42px] bg-[var(--ft-bg)] px-7 py-3.5 text-[0.9375rem] font-medium text-[var(--ft-ink)] ring-1 ring-[var(--ft-line)] transition-colors hover:ring-[var(--ft-accent)]"
              >
                All
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={categoryPath(category.slug)}
                  className="inline-block rounded-[42px] px-7 py-3.5 text-[0.9375rem] text-[var(--ft-muted)] ring-1 ring-[var(--ft-line)] transition-colors hover:text-[var(--ft-ink)] hover:ring-[var(--ft-accent)]"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {posts.map((post) => {
        const image = post.featured_image;
        const author = postAuthorName(post);
        const avatar = post.byline?.avatar ?? null;

        return (
          <article key={post.id} className="border-b border-[var(--ft-line)]">
            <div
              className={`${CONTAINER} grid gap-8 py-12 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.7fr)_auto] lg:items-start lg:gap-14 lg:py-16`}
            >
              <div>
                {/*
                 * `aria-hidden` + `tabIndex={-1}`, as post-card.tsx does: the
                 * title below already links to the same place, and a screen
                 * reader should not meet the post twice.
                 */}
                <Link href={postPath(post.slug)} aria-hidden="true" tabIndex={-1}>
                  {image ? (
                    <Image
                      src={mediaPublicUrl(image.storage_path)}
                      alt=""
                      width={image.width ?? 480}
                      height={image.height ?? 360}
                      placeholder={image.blur_data_url ? 'blur' : 'empty'}
                      blurDataURL={image.blur_data_url ?? undefined}
                      sizes="(min-width: 1024px) 300px, 100vw"
                      className="aspect-[4/3] w-full rounded-xl object-cover"
                    />
                  ) : (
                    <ImageSlot className="aspect-[4/3] w-full" />
                  )}
                </Link>

                {author ? (
                  <div className="mt-5 flex items-center gap-3">
                    {avatar ? (
                      <Image
                        src={mediaPublicUrl(avatar.storage_path)}
                        alt=""
                        width={72}
                        height={72}
                        className="h-9 w-9 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <Avatar name={author} className="h-9 w-9 text-xs" />
                    )}
                    <div className="leading-tight">
                      <p className="font-medium text-[var(--ft-ink)]">{author}</p>
                      {/* Only an author record carries a role; a plain-text byline has none. */}
                      {post.byline?.title ? (
                        <p className="mt-0.5 text-sm text-[var(--ft-muted)]">{post.byline.title}</p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <div>
                <p className="font-medium text-[var(--ft-muted)]">
                  <time dateTime={post.published_at}>
                    {formatPostDate(post.published_at, locale)}
                  </time>
                </p>
                <h3 className="mt-3 text-[1.5rem] font-semibold leading-[1.25] text-[var(--ft-ink)]">
                  <Link href={postPath(post.slug)} className="hover:text-[var(--ft-accent)]">
                    {post.title}
                  </Link>
                </h3>
                <p className="mt-3 max-w-[70ch] text-[1.0625rem] leading-[1.5] text-[var(--ft-muted)]">
                  {/* Summaries carry no body, so there is nothing to fall back to. */}
                  {excerptFor({ excerpt: post.excerpt, content_html: '' }, 200)}
                </p>
              </div>

              <div className="lg:pt-10">
                <GhostButton href={postPath(post.slug)}>Read More</GhostButton>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}

/* ------------------------------------------------------------------------- */

export function HomeV2({
  posts,
  categories,
  locale,
}: {
  posts: readonly PostSummary[];
  categories: readonly TermRow[];
  locale: string;
}) {
  return (
    <div className="ft-surface">
      <Hero />
      <HowItWorks />
      <FundingOptions />
      <Qualifier />
      <UseCases />
      <Requirements />
      <Testimonials />
      <BlogPosts posts={posts} categories={categories} locale={locale} />
    </div>
  );
}
