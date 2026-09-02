import Image from 'next/image';
import Link from 'next/link';

import { CtaButton } from './cta-button';
import { CONTACT, LOCAL_IMAGES, NAV, type NavItem } from './brand';
import { MobileNav } from './mobile-nav';

function DesktopItem({ item }: { item: NavItem }) {
  if (item.children) {
    return (
      <li className="group relative">
        <span className="flex cursor-default items-center gap-1.5 py-6 text-sm font-semibold text-white">
          {item.label}
          <svg
            className="h-3 w-3 text-white/50 transition-transform group-hover:rotate-180"
            viewBox="0 0 12 12"
            aria-hidden="true"
          >
            <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>

        {/*
          CSS-only dropdown. Keeping this off JavaScript means the whole header
          is a server component; `focus-within` covers keyboard users, who would
          otherwise be locked out of a hover-only menu.
        */}
        <ul className="invisible absolute left-0 top-full z-40 min-w-56 rounded-lg border border-white/10 bg-[var(--color-brand-raised)] py-2 opacity-0 shadow-2xl transition-[opacity,visibility] group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
          {item.children.map((child) => (
            <li key={child.label}>
              {child.href ? (
                <Link
                  href={child.href}
                  className="block px-5 py-2 text-sm text-white/70 no-underline hover:bg-white/5 hover:text-white"
                >
                  {child.label}
                </Link>
              ) : (
                <span
                  className="block cursor-default px-5 py-2 text-sm text-white/40"
                  title="Coming soon"
                >
                  {child.label}
                </span>
              )}
            </li>
          ))}
        </ul>
      </li>
    );
  }

  return (
    <li>
      {item.external ? (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="block py-6 text-sm font-semibold text-white no-underline hover:text-[var(--color-gold)]"
        >
          {item.label}
        </a>
      ) : (
        <Link
          href={item.href ?? '#'}
          className="block py-6 text-sm font-semibold text-white no-underline hover:text-[var(--color-gold)]"
        >
          {item.label}
        </Link>
      )}
    </li>
  );
}

/**
 * Ink-glass header: near-black at 72% opacity with a 14px backdrop blur,
 * matching the design refresh. Sticky rather than the floating pill the design
 * kit sketches for the homepage specifically — this component is shared by
 * every marketing route (blog, programs, get-funded), and reserving its own
 * flow height keeps every one of those pages' spacing simple and keeps the
 * homepage statically prerenderable (a route-aware floating variant would need
 * per-request pathname branching in the root layout, which forces the whole
 * marketing site off `force-static`).
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(11,11,12,0.72)] backdrop-blur-[14px]">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center py-3 no-underline">
          <Image
            src={LOCAL_IMAGES.logo}
            alt="Nanotom Capital"
            width={190}
            height={56}
            className="h-[42px] w-auto lg:h-[48px]"
            priority
          />
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {NAV.map((item) => (
              <DesktopItem key={item.label} item={item} />
            ))}
          </ul>
        </nav>

        <div className="ml-auto hidden shrink-0 items-center gap-7 lg:flex">
          <a
            href={CONTACT.phoneHref}
            className="inline-flex items-center gap-2 font-mono text-sm text-white no-underline hover:text-[var(--color-gold)]"
          >
            <svg
              className="h-[15px] w-[15px] text-[var(--color-gold)]"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6.6 10.8c1.4 2.8 3.7 5.1 6.5 6.5l2.2-2.2a1 1 0 0 1 1-.25c1.1.36 2.3.55 3.5.55a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.6 21 3 13.4 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.2.19 2.4.55 3.5a1 1 0 0 1-.25 1L6.6 10.8Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {CONTACT.phone}
          </a>
          <CtaButton className="!px-8 !py-3 !text-sm" />
        </div>

        <div className="ml-auto lg:hidden">
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
