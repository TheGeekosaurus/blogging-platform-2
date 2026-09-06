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

/** Shared by the desktop bar and the mobile drawer, so styling cannot drift. */
function navClasses(item: NavItem): string {
  const base = 'nl-label rounded-full px-4 py-2.5 text-xs transition-colors lg:px-5 lg:text-sm';

  if (item.cta) {
    return `${base} bg-[var(--nl-accent)] text-[#0f0f0f] hover:bg-[var(--nl-accent-strong)]`;
  }

  // The design gives every nav item a resting pill, not just a hover state.
  return `${base} bg-[var(--nl-raised)] text-[var(--nl-body)] hover:text-[var(--nl-ink)]`;
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
      <header className="rounded-[var(--nl-radius-panel)] border border-[var(--nl-line)] bg-[var(--nl-card)]/95 backdrop-blur">
        <div className="flex items-center justify-between gap-4 px-5 py-4 lg:px-10 lg:py-6">
          <Wordmark />

          {/* Desktop: the full bar. */}
          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <NavLink key={item.label} item={item} />
            ))}
          </nav>

          {/*
           * Mobile: a <details> drawer. `group` on the element lets the
           * summary's icon respond to [open] without a class toggle in JS.
           */}
          <details className="group relative lg:hidden">
            <summary
              className="nl-label flex cursor-pointer list-none items-center gap-2 rounded-full border border-[var(--nl-line)] px-4 py-2 text-xs text-[var(--nl-ink)] [&::-webkit-details-marker]:hidden"
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
              className="absolute right-0 top-[calc(100%+12px)] z-50 flex w-56 flex-col gap-1 rounded-[var(--nl-radius-card)] border border-[var(--nl-line)] bg-[var(--nl-card)] p-3 shadow-2xl"
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
