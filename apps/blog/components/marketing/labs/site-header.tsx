import Link from 'next/link';

import { NAV, type NavItem } from './brand';

/**
 * NNTM Labs' header.
 *
 * A server component with no JavaScript of its own, matching Capital's: the
 * mobile menu is a <details> element, so it opens and closes natively. The
 * alternative — a `useState` toggle — would make the header a client
 * component and put a bundle on every route on the site, including the blog,
 * to do what the platform already does.
 *
 * NO ACTIVE-PAGE STATE, deliberately. The design shows "Services" highlighted
 * because the exported frame is the Services page, and reproducing that would
 * need the current pathname, which is only readable from a client component.
 * Trading the server-rendered header for a permanent highlight is a bad deal,
 * and a hardcoded one would be wrong on every route but one. It comes back
 * for free if the nav ever moves client-side for another reason.
 *
 * The bar is `sticky`, not `fixed`: fixed would take the header out of flow
 * and require the page below to reserve its height, which is exactly the kind
 * of duplicated constant that drifts.
 */

/**
 * Shared by the desktop bar and the mobile drawer, so styling cannot drift.
 *
 * The bar itself appears at `xl`, not `lg`. At the artwork's spacing the seven
 * items need about 950px and a 1024px viewport only leaves the header 844px
 * inside its own padding, so the row overflowed the page. The drawer covers
 * everything below that.
 */
function navClasses(item: NavItem): string {
  /*
   * Padding is the artwork's: its "HOME" pill is 92x63 around 14px monospaced
   * text, which works out at roughly 28px of horizontal and 21px of vertical
   * padding.
   */
  const base =
    'nl-label rounded-[var(--nl-radius-control)] px-4 py-2.5 text-xs transition-colors xl:px-7 xl:py-5 xl:text-sm';

  if (item.cta) {
    return `${base} bg-[var(--nl-accent)] text-[#0f0f0f] hover:bg-[var(--nl-accent-strong)]`;
  }

  /*
   * The resting pill is the PAGE GROUND, not the raised tone — the artwork
   * fills these with #0F0F0F, the same black the page sits on, so they read as
   * wells cut into the bar rather than as chips raised off it. Hover lifts the
   * label instead of the surface.
   */
  return `${base} bg-[var(--nl-bg)] text-[var(--nl-body)] hover:text-[var(--nl-ink)]`;
}

function NavLink({ item }: { item: NavItem }) {
  // Unbuilt destinations render as text in the same style rather than as links
  // that 404 — see the note at the top of ./brand.ts.
  if (!item.href) {
    return (
      <span className={`${navClasses(item)} cursor-default`} aria-disabled>
        {item.label}
      </span>
    );
  }

  return (
    <Link href={item.href} className={navClasses(item)}>
      {item.label}
    </Link>
  );
}

function Wordmark() {
  return (
    <Link
      href="/"
      className="nl-label text-lg tracking-[0.12em] text-[var(--nl-ink)] lg:text-xl"
    >
      NexGen
    </Link>
  );
}

export function LabsHeader() {
  return (
    <div className="sticky top-0 z-40 px-4 pt-4 lg:px-[50px] lg:pt-[30px]">
      <header className="rounded-[var(--nl-radius-card-lg)] border border-[var(--nl-line)] bg-[var(--nl-card)]/95 backdrop-blur">
        <div className="flex items-center justify-between gap-4 px-5 py-4 lg:px-10 lg:py-6">
          <Wordmark />

          {/* Desktop: the full bar. */}
          <nav aria-label="Primary" className="hidden items-center gap-4 xl:flex">
            {NAV.map((item) => (
              <NavLink key={item.label} item={item} />
            ))}
          </nav>

          {/*
           * Mobile: a <details> drawer. `group` on the element lets the
           * summary's icon respond to [open] without a class toggle in JS.
           */}
          <details className="group relative xl:hidden">
            <summary
              className="nl-label flex cursor-pointer list-none items-center gap-2 rounded-[var(--nl-radius-control)] border border-[var(--nl-line)] px-4 py-2 text-xs text-[var(--nl-ink)] [&::-webkit-details-marker]:hidden"
              aria-label="Open menu"
            >
              Menu
              <span aria-hidden className="grid gap-[3px]">
                <span className="block h-px w-4 bg-current" />
                <span className="block h-px w-4 bg-current" />
                <span className="block h-px w-4 bg-current" />
              </span>
            </summary>

            <nav
              aria-label="Primary"
              className="absolute right-0 top-[calc(100%+12px)] z-50 flex w-56 flex-col gap-1 rounded-[var(--nl-radius-card-lg)] border border-[var(--nl-line)] bg-[var(--nl-card)] p-3 shadow-2xl"
            >
              {NAV.map((item) => (
                <NavLink key={item.label} item={item} />
              ))}
            </nav>
          </details>
        </div>
      </header>
    </div>
  );
}
