import Link from 'next/link';

import { ArrowUpRightIcon } from './icons';

/*
 * The handful of pieces shared by more than one page in this design.
 *
 * Deliberately small. PlainHead and the arrow disc still live in the homepage,
 * because each has exactly one consumer and hoisting them now would be
 * abstraction ahead of need. Everything here moved the moment a SECOND page
 * wanted it, which is the right trigger: `Chip` gained uppercase tracking in a
 * later round, and a copied version would not have. GhostButton and SectionHead
 * moved when /funding-solutions wanted the header band; GhostButton came with
 * it because SectionHead's optional action is one.
 */

/** The centred column. Matches the site header's container exactly. */
export const CONTAINER = 'mx-auto w-full max-w-7xl px-5 lg:px-8';

/** The grey chip every section label and page eyebrow sits in. */
export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-lg bg-[var(--ft-card-raised)] px-3 py-1.5 text-sm font-medium uppercase tracking-[0.14em] text-[var(--ft-ink)] sm:text-[0.8125rem]">
      {children}
    </span>
  );
}

/** The dark bordered button with a gold arrow, used for every secondary action. */
export function GhostButton({
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

/**
 * A section's header band: darker ground, label chip, display heading, and an
 * optional action pinned right.
 */
export function SectionHead({
  label,
  heading,
  body,
  cta,
  ctaHref,
  ctaExternal,
  id,
}: {
  label: string;
  heading: string;
  /** Only the use-of-funds band carries one; the rest are heading-only. */
  body?: string;
  cta?: string;
  ctaHref?: string;
  ctaExternal?: boolean;
  id?: string;
}) {
  return (
    <div className="border-y border-[var(--ft-line)] bg-[var(--ft-band)]">
      <div
        className={`${CONTAINER} flex flex-col gap-8 py-10 md:flex-row md:items-center md:justify-between md:gap-16 lg:py-14`}
      >
        <div className="flex flex-col items-start gap-4">
          <Chip>{label}</Chip>
          <h2
            id={id}
            className="max-w-[26ch] font-[family-name:var(--font-headline)] text-[clamp(1.875rem,4vw,2.875rem)] font-medium leading-[1.12] text-[var(--ft-ink)]"
          >
            {heading}
          </h2>
          {body ? (
            <p className="max-w-[54ch] text-[1.0625rem] leading-[1.6] text-[var(--ft-muted)]">
              {body}
            </p>
          ) : null}
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
