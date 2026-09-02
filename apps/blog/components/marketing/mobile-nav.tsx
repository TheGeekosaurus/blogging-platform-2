import Link from 'next/link';

import { CtaButton } from './cta-button';
import { NAV } from './brand';

/**
 * The mobile menu, built on <details> rather than React state.
 *
 * A toggle is the only interactive thing in the header, and making it a client
 * component would pull hydration into every marketing page for one button.
 * <details>/<summary> is a native disclosure widget: keyboard-operable and
 * screen-reader-announced with no JavaScript, so the header stays a server
 * component and the page ships no extra bundle.
 */
export function MobileNav() {
  return (
    <details className="group relative lg:hidden [&_summary::-webkit-details-marker]:hidden">
      <summary
        className="flex cursor-pointer list-none items-center p-3 text-white"
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

      <nav
        aria-label="Mobile"
        className="absolute right-0 top-full z-40 w-[min(20rem,calc(100vw-2.5rem))] rounded-lg border border-white/10 bg-[var(--color-brand-raised)] p-5 shadow-2xl"
      >
        <ul className="flex flex-col gap-1">
          {NAV.map((item) => (
            <li key={item.label}>
              {item.children ? (
                <>
                  <span className="block py-2 text-sm font-semibold text-white">
                    {item.label}
                  </span>
                  <ul className="mb-2 flex flex-col border-l border-white/10 pl-4">
                    {item.children.map((child) => (
                      <li key={child.label}>
                        {child.href ? (
                          <Link
                            href={child.href}
                            className="block py-1.5 text-sm text-white/70 no-underline hover:text-white"
                          >
                            {child.label}
                          </Link>
                        ) : (
                          <span
                            className="block py-1.5 text-sm text-white/35"
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
                  className="block py-2 text-sm font-semibold text-white no-underline hover:text-[var(--color-gold)]"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  href={item.href ?? '#'}
                  className="block py-2 text-sm font-semibold text-white no-underline hover:text-[var(--color-gold)]"
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
