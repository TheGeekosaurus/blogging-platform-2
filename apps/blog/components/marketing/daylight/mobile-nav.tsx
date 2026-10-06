import Link from 'next/link';

import { NAV } from '../brand';
import { CtaButton } from './primitives';

/**
 * Daylight's mobile menu — the light twin of ../mobile-nav.tsx.
 *
 * Built on <details>/<summary> rather than React state, for the reason that one
 * is: a toggle is the only interactive thing in the header, and a client
 * component would pull hydration into the page for one button. The native
 * disclosure widget is keyboard-operable and screen-reader-announced for free.
 *
 * The sheet is the card tone over a hairline and a soft shadow, rather than the
 * dark site's raised near-black. A shadow does more work on white than it does
 * on black, which is why this one has a border AND a shadow where the dark
 * version needs only the border to separate the sheet from the page.
 *
 * It reads the same NAV as the dark header. The two sites' navigation is the
 * same navigation until Denis says otherwise, and a copied array is how one
 * quietly starts advertising a program the other has dropped.
 */
export function DaylightMobileNav() {
  return (
    <details className="group relative lg:hidden [&_summary::-webkit-details-marker]:hidden">
      <summary
        className="flex cursor-pointer list-none items-center p-3 text-[var(--ft-ink)]"
        aria-label="Toggle menu"
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
          <path
            className="group-open:hidden"
            d="M3 6h18M3 12h18M3 18h18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            className="hidden group-open:block"
            d="M6 6l12 12M18 6L6 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </summary>

      {/*
        THE SHEET SCROLLS. It lists every nav item with every child expanded —
        nine funding products, seventeen industry rows and two calculators — and
        with no height limit that is well over a phone screen of menu in an
        absolutely positioned panel, so the bottom of it could not be reached.

        `max-h` is measured from the sheet's own top, which sits just under the
        header, so `100vh` minus that header and the page's top inset is the
        room actually available; 6.5rem covers it with margin.
      */}
      <nav
        aria-label="Mobile"
        className="absolute right-0 top-full z-40 max-h-[calc(100vh-6.5rem)] w-[min(20rem,calc(100vw-2.5rem))] overflow-y-auto overscroll-contain rounded-2xl border border-[var(--ft-line)] bg-[var(--ft-bg)] p-5 shadow-[0_24px_48px_-24px_rgba(16,24,40,0.28)]"
      >
        <ul className="flex flex-col gap-1">
          {NAV.map((item) => (
            <li key={item.label}>
              {item.children ? (
                <>
                  {/*
                    A link when the section has a page of its own — /funding-
                    solutions is a real page, and rendering it as dead text made
                    it reachable only from the homepage.
                  */}
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="block py-2 text-sm font-semibold text-[var(--ft-ink)] no-underline hover:text-[var(--ft-accent)]"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="block py-2 text-sm font-semibold text-[var(--ft-ink)]">
                      {item.label}
                    </span>
                  )}
                  <ul className="mb-2 flex flex-col border-l border-[var(--ft-line)] pl-4">
                    {item.children.map((child) => (
                      <li key={child.label}>
                        {child.href ? (
                          <Link
                            href={child.href}
                            className="block py-1.5 text-sm text-[var(--ft-muted)] no-underline hover:text-[var(--ft-ink)]"
                          >
                            {child.label}
                          </Link>
                        ) : (
                          <span
                            className="block py-1.5 text-sm text-[var(--ft-subtle)]"
                            title="Coming soon"
                          >
                            {child.label}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              ) : item.external ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-2 text-sm font-semibold text-[var(--ft-ink)] no-underline hover:text-[var(--ft-accent)]"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  href={item.href ?? '#'}
                  className="block py-2 text-sm font-semibold text-[var(--ft-ink)] no-underline hover:text-[var(--ft-accent)]"
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>

        <CtaButton className="mt-4 w-full !px-6 !py-3 !text-sm" />
      </nav>
    </details>
  );
}
