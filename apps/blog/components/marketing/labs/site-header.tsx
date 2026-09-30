import type { CSSProperties } from 'react';
import Link from 'next/link';

import { LOGO, NAV, type NavItem } from './brand';

/*
 * The nav, split the way the opening sequence moves it: the CTA travels with
 * the bar, the rest wait for it. Derived rather than written out, so NAV stays
 * the only list.
 */
const MENU_ITEMS = NAV.filter((item) => !item.cta);
const CTA_ITEM = NAV.find((item) => item.cta);

/**
 * Nanotom Labs' header.
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
 * of duplicated constant that drifts. It is also an ISLAND — inset from all
 * three edges and rounded — rather than a bar attached to the top of the page,
 * which is what lets it shrink to a centred pill for the opening sequence.
 *
 * THAT SEQUENCE IS PURE CSS, in globals.css under `prefers-reduced-motion`.
 * The bar opens from a pill holding only the wordmark, the CTA rides out from
 * behind the logo as it widens, and the menu items arrive afterwards one at a
 * time from the right. The only thing this file contributes is the marker
 * classes and `--nl-i`, the per-item index — counted from the right, because
 * that is the direction the run travels.
 *
 * No state, no effect, no client boundary: this component is in the root
 * layout, so making it interactive would ship a bundle to every route on the
 * site including the blog, and the animation needs nothing that CSS delays do
 * not already give.
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
   * Tighter than the artwork's own pills, deliberately.
   *
   * The artwork's "HOME" is 92x63 — about 28px horizontal and 21px vertical
   * padding — which built a 111px-tall bar that read heavy once the rest of
   * the page slimmed down. The separation between items now comes from the
   * 16px gap rather than from padding inside each one, which is what keeps the
   * bar sleek without crowding the labels.
   */
  const base =
    'nl-label rounded-[var(--nl-radius-control)] px-4 py-2 text-xs transition-colors lg:px-5 lg:py-2.5 lg:text-sm';

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
      /* `nl-header-mark` only raises it above the CTA — see globals.css. */
      className="nl-header-mark flex shrink-0 items-center"
      aria-label={LOGO.alt}
    >
      {/*
        * A plain <img>, hotlinked — see LOGO in ./brand.ts for why it is not
        * next/image and not committed to the repo.
        *
        * `width`/`height` are the file's intrinsic pixels and the height is
        * capped in CSS, so the browser knows the aspect ratio and reserves the
        * right box before the bytes arrive. Without them the header would
        * reflow on load, and it is the first thing on the page.
        *
        * Not lazy: this is above the fold on every route.
        *
        * 40px tall, which is as large as it can be without growing the bar —
        * the nav pills are 41px, so they still set the header's height. At the
        * 32px it started at, the "LABS" line and its rule were too fine to
        * read.
        */}
      <img
        src={LOGO.src}
        alt={LOGO.alt}
        width={LOGO.intrinsic.width}
        height={LOGO.intrinsic.height}
        fetchPriority="high"
        className="h-9 w-auto lg:h-10"
      />
    </Link>
  );
}

export function LabsHeader() {
  return (
    <div className="sticky top-0 z-40 px-4 pt-4 lg:px-[50px] lg:pt-[30px]">
      <header className="nl-header-bar rounded-[var(--nl-radius-card-lg)] border border-[var(--nl-line)] bg-[var(--nl-card)]/95 backdrop-blur">
        <div className="flex items-center justify-between gap-4 px-5 py-3 lg:px-6 lg:py-3">
          <Wordmark />

          {/*
            Desktop: the full bar.

            The CTA is rendered OUTSIDE the <nav> list because the two move at
            different times — it is out and visible for the whole opening,
            while the menu items wait for the bar to finish. Both still come
            from the one NAV array, so nothing is written twice and an item
            added there still appears here.

            `--nl-i` counts from the right: the rightmost menu item is 0 and
            leads the run, so the sequence reads right to left.
          */}
          <div className="hidden items-center gap-4 xl:flex">
            <nav aria-label="Primary" className="nl-header-nav flex items-center gap-4">
              {MENU_ITEMS.map((item, i) => (
                <span
                  key={item.label}
                  className="nl-header-item inline-flex"
                  style={{ '--nl-i': MENU_ITEMS.length - 1 - i } as CSSProperties}
                >
                  <NavLink item={item} />
                </span>
              ))}
            </nav>

            {CTA_ITEM ? (
              <span className="nl-header-cta inline-flex">
                <NavLink item={CTA_ITEM} />
              </span>
            ) : null}
          </div>

          {/*
           * Mobile: a <details> drawer. `group` on the element lets the
           * summary's icon respond to [open] without a class toggle in JS.
           */}
          {/*
            Below xl the whole menu is this one button, so it takes the item
            animation with index 0 — it arrives in the same beat the rightmost
            desktop item would. The drawer inside it is untouched.
          */}
          <details className="nl-header-item group relative xl:hidden">
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
