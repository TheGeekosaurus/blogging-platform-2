import Link from 'next/link';

import { ArrowUpRight } from './icons';

/**
 * The design's one recurring control: a ringed arrow followed by an uppercase
 * monospaced label.
 *
 * It appears a dozen times — "Book A Call", "View All", "Open Project", "Visit
 * Website", "View Blog", "All Testimonials" — in three finishes, and building
 * it once is what keeps the ring diameter, gap and tracking from drifting
 * apart between sections. That drift is the specific failure this replaces:
 * the same control hand-rolled per section ends up 40px here and 44px there,
 * which reads as sloppiness rather than as a variant.
 *
 * Rendered as a <span> when there is no href. Several of these point at pages
 * that do not exist yet, and an <a> without a destination is a control that
 * looks operable and is not — worse than plain text for anyone using a
 * keyboard or a screen reader.
 */
type ArrowLinkProps = {
  label: string;
  href?: string;
  /**
   * `outline` — a hairline ring in the current text colour. The default.
   * `solid` — a filled white disc with dark glyph, for overlays on imagery.
   * `accent` — a coral ring and coral label, for the hero's primary call.
   */
  variant?: 'outline' | 'solid' | 'accent';
  className?: string;
};

const RING = {
  outline: 'border border-current text-[var(--nl-ink)]',
  solid: 'border border-white bg-white text-[#0f0f0f]',
  accent: 'border border-[var(--nl-accent)] text-[var(--nl-accent)]',
} as const;

const LABEL = {
  outline: 'text-[var(--nl-ink)]',
  solid: 'text-white',
  accent: 'text-[var(--nl-accent)]',
} as const;

export function ArrowLink({ label, href, variant = 'outline', className }: ArrowLinkProps) {
  const content = (
    <>
      <span
        className={`grid shrink-0 place-items-center rounded-full transition-transform duration-200 group-hover:-translate-y-px ${RING[variant]} size-9 lg:size-11`}
      >
        <ArrowUpRight className="size-4 lg:size-5" />
      </span>
      <span className={`nl-label whitespace-nowrap text-xs lg:text-sm ${LABEL[variant]}`}>
        {label}
      </span>
    </>
  );

  const classes = `group inline-flex items-center gap-3 ${className ?? ''}`;

  if (!href) {
    return <span className={classes}>{content}</span>;
  }

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}

/**
 * A horizontally scrolling strip.
 *
 * `items` is rendered TWICE inside the track, and the keyframe travels exactly
 * -50%: the second copy arrives where the first started, so the loop has no
 * seam. Rendering it once and animating -100% would scroll the strip off the
 * screen and snap it back.
 *
 * `aria-hidden` on the duplicate, so a screen reader hears the service list
 * once rather than twice. The whole strip is decorative motion around content
 * that also appears in full below it, but the words themselves are worth
 * reading, so it is not hidden outright.
 */
export function Marquee({
  items,
  durationSeconds,
  className,
}: {
  items: readonly string[];
  durationSeconds: number;
  className?: string;
}) {
  const strip = (hidden: boolean) => (
    <ul
      className="flex shrink-0 items-center"
      aria-hidden={hidden || undefined}
    >
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex items-center">
          <span className="nl-label px-5 text-xs text-[var(--nl-muted)] lg:px-7 lg:text-sm">
            {item}
          </span>
          <span
            className="size-1.5 shrink-0 rounded-full bg-[var(--nl-accent)]"
            aria-hidden
          />
        </li>
      ))}
    </ul>
  );

  return (
    <div className={`nl-marquee ${className ?? ''}`}>
      <div
        className="nl-marquee-track"
        style={{ ['--nl-marquee-duration' as string]: `${durationSeconds}s` }}
      >
        {strip(false)}
        {strip(true)}
      </div>
    </div>
  );
}

/**
 * The panel every section sits in: the raised tone, the design's 24px radius,
 * and the 1824px content width centred in the viewport.
 *
 * The width comes from the desktop frame (1920 canvas, 48px margins). Below
 * `lg` it collapses to the mobile frame's 16px margins, which is the single
 * biggest difference between the two artboards.
 */
export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`mx-auto w-full max-w-[1824px] rounded-[var(--nl-radius-panel)] bg-[var(--nl-raised)] p-3 lg:p-4 ${className ?? ''}`}
    >
      {children}
    </section>
  );
}

/**
 * A section's heading row: the uppercase title, and an optional link at the
 * far right. Its own card in the design, not merely a heading — which is why
 * it carries the card tone rather than sitting directly on the panel.
 *
 * The link is DESKTOP ONLY. The mobile artboard moves it out of the header and
 * puts it centred beneath the section's content ("ALL Testimonials" sits at
 * y=4780, after the cards, not beside the heading). That is not just a
 * preference: at 390px the heading and the link together need ~352px inside a
 * 294px column, so keeping it in the header pushes the page into horizontal
 * scroll. Callers that pass `link` render `<SectionLink>` at the end of the
 * section to place the mobile half.
 */
export function SectionHeader({
  title,
  link,
  id,
}: {
  title: string;
  link?: { label: string; href?: string };
  id?: string;
}) {
  return (
    <header
      id={id}
      className="flex items-center justify-between gap-4 rounded-[var(--nl-radius-card-lg)] bg-[var(--nl-card)] px-5 py-5 lg:px-10 lg:py-7"
    >
      <h2 className="nl-heading text-2xl leading-none lg:text-5xl">{title}</h2>
      {link ? (
        <div className="hidden lg:block">
          <ArrowLink label={link.label} href={link.href} />
        </div>
      ) : null}
    </header>
  );
}

/** The mobile half of a section's link — centred beneath the content. */
export function SectionLink({ label, href }: { label: string; href?: string }) {
  return (
    <div className="mt-6 flex justify-center lg:hidden">
      <ArrowLink label={label} href={href} />
    </div>
  );
}
