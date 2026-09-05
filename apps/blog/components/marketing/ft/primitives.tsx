/*
 * The handful of pieces shared by more than one page in this design.
 *
 * Deliberately small. Everything else — GhostButton, SectionHead, PlainHead, the
 * arrow disc — still lives in the page that uses it, because each has exactly
 * one consumer and hoisting them now would be abstraction ahead of need. These
 * two moved the moment a second page wanted them, which is the right trigger:
 * `Chip` gained uppercase tracking in a later round, and a copied version would
 * not have.
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
