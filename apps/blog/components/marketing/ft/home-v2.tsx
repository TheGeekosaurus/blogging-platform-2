import Image from 'next/image';

import { LOCAL_IMAGES } from '../brand';
import {
  ArrowUpRightIcon,
  CommentIcon,
  CrescentIcon,
  CloverIcon,
  EyeIcon,
  FacetIcon,
  HeartIcon,
  LeafIcon,
  OrbitIcon,
  PrismIcon,
  ShareIcon,
  SparkIcon,
  StarIcon,
} from './icons';
import { BLOG_SECTION, CLOSING, FEATURES, HERO, RESOURCES, TESTIMONIALS } from './content';

/*
 * The /home-v2 design — a rebuild of the "AI Blog Website UI Template" home
 * frame (Figma node 18:400) as a real page.
 *
 * WHAT IS FAITHFUL: the section order and composition, the grid-rule structure
 * that divides every band into bordered cells, the greys, the two-tone icons
 * (exported as SVG from the file itself, see ./icons), the pill/button shapes,
 * the corner radii, and the -3% tracking. All copy is the template's own,
 * verbatim, in ./content — see that file's note.
 *
 * WHAT IS DELIBERATELY NOT, and why:
 *
 *  - The template's own header and footer are dropped. The site header and
 *    footer come from the root layout, per the brief.
 *  - The design lays out on a 1596px content column inside a 1920px frame. This
 *    uses max-w-7xl (1280px) with the header's own gutters, because a page
 *    1596px wide sitting under a 1280px-wide header reads as a broken layout.
 *    Display type is scaled by the same ~0.8 so the proportions survive; body
 *    text is not, since 14px body would be a readability regression, not a
 *    faithful translation.
 *  - Typefaces are Lato and Poppins, already self-hosted for this site, not the
 *    template's Kumbh Sans and Inter — consistent with the existing decision to
 *    take scale and rhythm from the design and keep the brand's faces.
 *  - The accent is brand gold, not the template's #FFD11A. One line in
 *    globals.css switches it; see the note on `.ft-surface` there.
 *  - Photographs are drawn placeholders (`ImageSlot`). The template's are
 *    licensed stock and the two photos this repo owns are 540x960 portraits
 *    that would upscale badly into a 16:9 slot.
 *  - Avatars are initial discs rather than the template's stock headshots.
 *
 * Everything is a server component. There is no interactivity in the design
 * beyond hover, and the category tabs are presentational — wiring them to real
 * filtering would mean client state this page does not otherwise need.
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

const BRAND_ICONS = {
  spark: SparkIcon,
  clover: CloverIcon,
  leaf: LeafIcon,
  orbit: OrbitIcon,
  prism: PrismIcon,
  crescent: CrescentIcon,
  facet: FacetIcon,
} as const;

function BrandIcon({ name, className }: { name: keyof typeof BRAND_ICONS; className?: string }) {
  const Icon = BRAND_ICONS[name];
  return <Icon className={className} />;
}

/** The grey chip every section label sits in. */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-lg bg-[var(--ft-card-raised)] px-3 py-1.5 text-sm font-medium text-[var(--ft-ink)] sm:text-base">
      {children}
    </span>
  );
}

/** The dark bordered button with a gold arrow, used for every secondary action. */
function GhostButton({ children, href = '#' }: { children: React.ReactNode; href?: string }) {
  return (
    <a
      href={href}
      className="inline-flex shrink-0 items-center gap-3 rounded-xl border border-[var(--ft-line)] bg-[var(--ft-card)] px-6 py-3.5 text-[0.9375rem] text-[var(--ft-muted)] transition-colors hover:border-[var(--ft-accent)] hover:text-[var(--ft-ink)]"
    >
      {children}
      <ArrowUpRightIcon className="h-4 w-4 text-[var(--ft-accent)]" />
    </a>
  );
}

/** The solid gold disc with a dark arrow, used on the hero tiles and closing cards. */
function ArrowDisc() {
  return (
    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--ft-accent)] text-[var(--ft-bg)] transition-transform group-hover:-translate-y-0.5">
      <ArrowUpRightIcon className="h-[18px] w-[18px]" />
    </span>
  );
}

/**
 * A section's header band: darker ground, label chip, display heading, and an
 * optional action pinned right. Every section but the hero opens with one.
 */
function SectionHead({
  label,
  heading,
  cta,
  id,
}: {
  label: string;
  heading: string;
  cta?: string;
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
        {cta ? <GhostButton>{cta}</GhostButton> : null}
      </div>
    </div>
  );
}

/**
 * An initial disc standing in for a headshot.
 *
 * The hue is derived from the name so a given person is always the same colour
 * across the page, and the arithmetic is pure — no randomness, which would
 * differ between the server and client renders and trip hydration.
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
      // 8% saturation, not 18%: at 18% the discs read as a deliberate colour
      // scheme competing with the accent, rather than as absent photographs.
      style={{ backgroundColor: `hsl(${hue} 8% 30%)` }}
    >
      {initials}
    </span>
  );
}

function AvatarStack({ names }: { names: readonly string[] }) {
  return (
    <span className="flex items-center">
      {names.map((name, i) => (
        <Avatar
          key={name}
          name={name}
          className={`h-10 w-10 text-xs ring-2 ring-[var(--ft-card)] ${i > 0 ? '-ml-3' : ''}`}
        />
      ))}
    </span>
  );
}

/**
 * The ray burst behind the hero, and the fill for every image slot.
 *
 * Generated at module scope from a deterministic hash so the server and client
 * draw identical markup. `Math.random()` here would hydrate-mismatch on every
 * load.
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

/**
 * Stands in for a photograph.
 *
 * Deliberately not an empty box: it holds the slot's real aspect ratio so the
 * surrounding layout can be judged, and reads as an intentional graphic rather
 * than a broken image. Swap the whole component for next/image once there are
 * real photographs to use.
 */
function ImageSlot({ icon, className }: { icon: keyof typeof BRAND_ICONS; className?: string }) {
  return (
    <div
      className={`relative isolate flex items-center justify-center overflow-hidden rounded-xl border border-[var(--ft-line)] bg-[linear-gradient(135deg,#1f1f22,#141414_60%)] ${className ?? ''}`}
    >
      {/*
        Much fainter than the hero's burst. At full strength it competes with
        the cards around it and reads as content rather than as a placeholder.
      */}
      <RayBurst className="absolute inset-0 h-full w-full opacity-[0.18]" />
      <BrandIcon name={icon} className="relative h-24 w-auto opacity-25" />
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Sections
 * ------------------------------------------------------------------------- */

function Hero() {
  return (
    <section aria-labelledby="ft-hero" className="border-b border-[var(--ft-line)]">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.78fr)]">
        {/* Left: the headline column, inset to the container's left edge. */}
        <div className={`${BLEED_INSET} flex flex-col justify-center pr-5 lg:pr-16`}>
          <div className="flex flex-col gap-6 py-16 lg:py-24">
            <p className="font-[family-name:var(--font-headline)] text-[clamp(1.125rem,2vw,1.5rem)] text-[var(--ft-faint)]">
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
                  {/* The '+' carries the accent in the design, the digits do not. */}
                  {stat.value.replace('+', '')}
                  <span className="text-[var(--ft-accent)]">+</span>
                </dd>
                <dt className="mt-3 text-sm text-[var(--ft-muted)] lg:text-base">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>

        {/* Right: the ray burst, bleeding to the viewport edge. */}
        <div className="relative isolate min-h-[420px] border-t border-[var(--ft-line)] lg:min-h-0 lg:border-l lg:border-t-0">
          <RayBurst className="absolute inset-0 h-full w-full" />

          {/*
            The overlay copy sits directly on the burst, and white-on-white is
            unreadable at any opacity the burst is worth having. This scrim
            darkens only the lower half it occupies, so the rays keep their
            brightness where there is no text over them.
          */}
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(20,20,20,0.96)_18%,rgba(20,20,20,0.75)_42%,transparent_72%)]" />

          <div className="relative flex h-full flex-col items-start justify-end gap-5 p-8 lg:p-12">
            <AvatarStack names={['Ada Lin', 'Marco Reyes', 'Priya Nair', 'Tom Beck']} />
            <div>
              <p className="text-xl font-medium text-[var(--ft-ink)]">{HERO.card.title}</p>
              <p className="mt-2 max-w-[44ch] text-[1.0625rem] text-[var(--ft-muted)]">
                {HERO.card.body}
              </p>
            </div>
            <GhostButton>{HERO.card.cta}</GhostButton>
          </div>
        </div>
      </div>

      {/* The three proof tiles, one bordered cell each. */}
      <div className="border-t border-[var(--ft-line)]">
        <div className={`${CONTAINER} grid md:grid-cols-3`}>
          {HERO.tiles.map((tile, i) => (
            <a
              key={tile.title}
              href="#"
              className={`group flex flex-col gap-8 border-[var(--ft-line)] py-10 lg:py-14 ${
                i > 0 ? 'border-t md:border-l md:border-t-0 md:pl-10' : ''
              } ${i < HERO.tiles.length - 1 ? 'md:pr-10' : ''}`}
            >
              <BrandIcon name={tile.icon} className="h-12 w-12" />

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
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section aria-labelledby="ft-features">
      <SectionHead id="ft-features" label={FEATURES.label} heading={FEATURES.heading} />

      {FEATURES.blocks.map((block, i) => (
        <div
          key={block.title}
          className={i > 0 ? 'border-b border-[var(--ft-line)]' : 'border-b border-[var(--ft-line)]'}
        >
          <div className={`${CONTAINER} grid gap-10 py-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] lg:gap-20 lg:py-20`}>
            <div className="flex flex-col justify-between gap-10">
              <BrandIcon name={block.icon} className="h-20 w-auto" />
              <div>
                <h3 className="font-[family-name:var(--font-headline)] text-[clamp(1.625rem,3vw,2.25rem)] font-semibold leading-[1.15] text-[var(--ft-ink)]">
                  {block.title}
                </h3>
                <p className="mt-4 max-w-[42ch] text-[1.0625rem] leading-[1.55] text-[var(--ft-muted)]">
                  {block.body}
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {block.cards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-xl bg-[var(--ft-card)] p-7 transition-colors hover:bg-[var(--ft-card-raised)]"
                >
                  <p className="text-[1.375rem] font-medium text-[var(--ft-ink)]">{card.title}</p>
                  <p className="mt-3 text-[1.0625rem] leading-[1.5] text-[var(--ft-muted)]">
                    {card.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

function BlogPosts() {
  return (
    <section aria-labelledby="ft-blog">
      <SectionHead
        id="ft-blog"
        label={BLOG_SECTION.label}
        heading={BLOG_SECTION.heading}
        cta={BLOG_SECTION.cta}
      />

      {/*
        Presentational, not a filter. Marked up as a list rather than buttons so
        it does not promise an interaction that is not wired up; `aria-current`
        carries the selected state to a screen reader.
      */}
      <div className="border-b border-[var(--ft-line)]">
        <ul className={`${CONTAINER} flex flex-wrap gap-4 py-10`}>
          {BLOG_SECTION.tabs.map((tab, i) => (
            <li
              key={tab}
              aria-current={i === 0 ? 'true' : undefined}
              className={`rounded-[42px] px-7 py-3.5 text-[0.9375rem] ${
                i === 0
                  ? 'bg-[var(--ft-bg)] font-medium text-[var(--ft-ink)] ring-1 ring-[var(--ft-line)]'
                  : 'text-[var(--ft-muted)] ring-1 ring-[var(--ft-line)]'
              }`}
            >
              {tab}
            </li>
          ))}
        </ul>
      </div>

      {BLOG_SECTION.posts.map((post) => (
        <article key={post.title} className="border-b border-[var(--ft-line)]">
          <div
            className={`${CONTAINER} grid gap-8 py-12 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.7fr)_auto] lg:items-start lg:gap-14 lg:py-16`}
          >
            <div className="flex items-center gap-4">
              <Avatar name={post.author} className="h-14 w-14 text-base" />
              <div>
                <p className="font-medium text-[var(--ft-ink)]">{post.author}</p>
                <p className="mt-0.5 text-[1.0625rem] text-[var(--ft-muted)]">{post.category}</p>
              </div>
            </div>

            <div>
              <p className="font-medium text-[var(--ft-muted)]">{post.date}</p>
              <h3 className="mt-3 text-[1.5rem] font-semibold leading-[1.25] text-[var(--ft-ink)]">
                {post.title}
              </h3>
              <p className="mt-3 max-w-[70ch] text-[1.0625rem] leading-[1.5] text-[var(--ft-muted)]">
                {post.excerpt}
              </p>

              <ul className="mt-6 flex flex-wrap gap-3">
                <li className="inline-flex items-center gap-2 rounded-full bg-[var(--ft-card)] px-4 py-2 text-[0.9375rem] text-[var(--ft-muted)]">
                  <HeartIcon
                    filled={post.liked}
                    className={`h-[18px] w-[18px] ${post.liked ? 'text-[#FF5500]' : ''}`}
                  />
                  {post.likes}
                  <span className="sr-only"> likes</span>
                </li>
                <li className="inline-flex items-center gap-2 rounded-full bg-[var(--ft-card)] px-4 py-2 text-[0.9375rem] text-[var(--ft-muted)]">
                  <CommentIcon className="h-[18px] w-[18px]" />
                  {post.comments}
                  <span className="sr-only"> comments</span>
                </li>
                <li className="inline-flex items-center gap-2 rounded-full bg-[var(--ft-card)] px-4 py-2 text-[0.9375rem] text-[var(--ft-muted)]">
                  <ShareIcon className="h-[18px] w-[18px]" />
                  {post.shares}
                  <span className="sr-only"> shares</span>
                </li>
              </ul>
            </div>

            <div className="lg:pt-10">
              <GhostButton>View Blog</GhostButton>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

function Resources() {
  return (
    <section aria-labelledby="ft-resources">
      <SectionHead
        id="ft-resources"
        label={RESOURCES.label}
        heading={RESOURCES.heading}
        cta={RESOURCES.cta}
      />

      {RESOURCES.blocks.map((block) => (
        <div key={block.title} className="border-b border-[var(--ft-line)]">
          <div
            className={`${CONTAINER} grid gap-12 py-14 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.5fr)] lg:gap-20 lg:py-20`}
          >
            <div className="flex flex-col gap-8">
              <BrandIcon name={block.icon} className="h-20 w-20" />

              <div>
                <h3 className="font-[family-name:var(--font-headline)] text-[clamp(1.625rem,3vw,2.25rem)] font-semibold leading-[1.15] text-[var(--ft-ink)]">
                  {block.title}
                </h3>
                <p className="mt-4 max-w-[42ch] text-[1.0625rem] leading-[1.55] text-[var(--ft-muted)]">
                  {block.body}
                </p>
              </div>

              <GhostButton>{block.cta}</GhostButton>

              <div className="mt-auto flex items-center justify-between gap-6 rounded-xl bg-[var(--ft-card)] p-6">
                <div>
                  <p className="text-[1.0625rem] text-[var(--ft-muted)]">
                    {RESOURCES.downloadedByLabel}
                  </p>
                  <p className="mt-1 text-[1.375rem] font-semibold text-[var(--ft-ink)]">
                    {block.downloadedBy}
                  </p>
                </div>
                <AvatarStack names={['Ada Lin', 'Marco Reyes', 'Priya Nair', 'Tom Beck']} />
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-10">
                <p className="shrink-0 text-[1.375rem] font-semibold text-[var(--ft-ink)] md:w-48">
                  {block.topicsTitle}
                </p>
                <p className="text-[1.0625rem] leading-[1.5] text-[var(--ft-muted)]">
                  {block.topicsBody}
                </p>
              </div>

              <ImageSlot icon={block.icon} className="aspect-[16/7] w-full" />

              <div className="grid gap-5 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.4fr)]">
                <div className="rounded-xl bg-[var(--ft-card)] p-6">
                  <p className="text-[1.0625rem] text-[var(--ft-muted)]">{block.totalLabel}</p>
                  <p className="mt-1.5 text-lg font-semibold text-[var(--ft-ink)]">
                    {block.totalValue}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-6 rounded-xl bg-[var(--ft-card)] p-6">
                  <div>
                    <p className="text-[1.0625rem] text-[var(--ft-muted)]">
                      {RESOURCES.formatsLabel}
                    </p>
                    <p className="mt-1.5 text-lg font-semibold text-[var(--ft-ink)]">
                      {RESOURCES.formatsValue}
                    </p>
                  </div>
                  <a
                    href="#"
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[var(--ft-line)] px-5 py-3 text-[0.9375rem] text-[var(--ft-muted)] transition-colors hover:border-[var(--ft-accent)] hover:text-[var(--ft-ink)]"
                  >
                    {RESOURCES.previewLabel}
                    <EyeIcon className="h-[18px] w-[18px] text-[var(--ft-accent)]" />
                  </a>
                </div>
              </div>

              <div className="rounded-xl bg-[var(--ft-card)] p-6">
                <p className="text-[1.0625rem] text-[var(--ft-muted)]">
                  {RESOURCES.expertiseLabel}
                </p>
                <p className="mt-1.5 text-lg font-medium leading-[1.45] text-[var(--ft-ink)]">
                  {block.expertise}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
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
      />

      <div className={`${CONTAINER} grid border-[var(--ft-line)] sm:grid-cols-2 lg:grid-cols-3`}>
        {TESTIMONIALS.items.map((item, i) => (
          <figure
            key={item.name}
            className={`flex flex-col items-center gap-6 border-[var(--ft-line)] px-6 py-14 lg:px-10 lg:py-20 ${
              i % 3 !== 0 ? 'lg:border-l' : ''
            } ${i % 2 !== 0 ? 'sm:border-l lg:border-l' : 'sm:border-l-0'} ${
              i >= 3 ? 'lg:border-t' : ''
            } ${i >= 2 ? 'sm:border-t' : ''} ${i > 0 ? 'border-t sm:border-t-0' : ''}`}
          >
            <figcaption className="flex items-center gap-3">
              <Avatar name={item.name} />
              <span>
                <span className="block font-medium text-[var(--ft-ink)]">{item.name}</span>
                <span className="mt-0.5 block text-[1.0625rem] text-[var(--ft-subtle)]">
                  {item.location}
                </span>
              </span>
            </figcaption>

            {/*
              The star pill straddles the card's top edge in the design, so the
              card carries the top padding and the pill is pulled up over it.
            */}
            <div className="relative w-full">
              <span className="absolute -top-[22px] left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[var(--ft-card-raised)] px-5 py-2.5">
                {Array.from({ length: 5 }, (_, star) => (
                  <StarIcon key={star} className="h-[18px] w-[18px] text-[var(--ft-accent)]" />
                ))}
                <span className="sr-only">5 out of 5</span>
              </span>

              <blockquote className="rounded-xl bg-[var(--ft-card)] px-7 pb-8 pt-12 text-center text-[1.0625rem] leading-[1.55] text-[var(--ft-ink)]">
                {item.quote}
              </blockquote>
            </div>
          </figure>
        ))}
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section
      aria-labelledby="ft-closing"
      className="border-t border-[var(--ft-line)] bg-[var(--ft-band)]"
    >
      <div className={`${CONTAINER} flex flex-col gap-16 py-16 lg:py-24`}>
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-14">
          {/*
            The template puts its own logotype here. Ours goes in its place —
            shipping another company's mark on our page would be the one thing
            in this design worth not copying.
          */}
          <Image
            src={LOCAL_IMAGES.logo}
            alt=""
            width={190}
            height={56}
            className="h-14 w-auto shrink-0"
          />

          <div className="flex flex-col items-start gap-4">
            <Chip>{CLOSING.label}</Chip>
            <h2
              id="ft-closing"
              className="max-w-[22ch] font-[family-name:var(--font-headline)] text-[clamp(1.875rem,4vw,2.875rem)] font-medium leading-[1.12] text-[var(--ft-ink)]"
            >
              {CLOSING.heading}
            </h2>
            <p className="max-w-[80ch] text-[1.0625rem] leading-[1.55] text-[var(--ft-subtle)]">
              {CLOSING.body}
            </p>
          </div>
        </div>

        <div className="grid gap-5 rounded-2xl bg-[var(--ft-bg)] p-5 lg:grid-cols-3">
          {CLOSING.cards.map((card) => (
            <a
              key={card.title}
              href="#"
              className="group rounded-xl border border-[var(--ft-line)] p-8 transition-colors hover:border-[var(--ft-accent)]"
            >
              <div className="flex items-center justify-between gap-6">
                <p className="text-[1.3125rem] font-semibold text-[var(--ft-ink)]">{card.title}</p>
                <ArrowDisc />
              </div>
              <p className="mt-5 text-[1.0625rem] leading-[1.5] text-[var(--ft-muted)]">
                {card.body}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------- */

export function HomeV2() {
  return (
    <div className="ft-surface">
      <Hero />
      <Features />
      <BlogPosts />
      <Resources />
      <Testimonials />
      <Closing />
    </div>
  );
}
