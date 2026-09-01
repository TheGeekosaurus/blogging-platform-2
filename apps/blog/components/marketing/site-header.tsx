import Link from 'next/link';

import { CtaButton } from './cta-button';
import { IMAGES, NAV, type NavItem } from './brand';
import { MobileNav } from './mobile-nav';

function DesktopItem({ item }: { item: NavItem }) {
  if (item.children) {
    return (
      <li className="group relative">
        <span className="flex cursor-default items-center gap-1 py-6 text-sm font-medium">
          {item.label}
          <svg
            className="h-3 w-3 transition-transform group-hover:rotate-180"
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
        <ul className="invisible absolute left-0 top-full z-40 min-w-56 rounded-md border border-black/5 bg-white py-2 opacity-0 shadow-lg transition-[opacity,visibility] group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
          {item.children.map((child) => (
            <li key={child.label}>
              {child.href ? (
                <Link
                  href={child.href}
                  className="block px-5 py-2 text-sm no-underline hover:bg-black/5"
                >
                  {child.label}
                </Link>
              ) : (
                <span
                  className="block cursor-default px-5 py-2 text-sm text-black/45"
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
          className="block py-6 text-sm font-medium no-underline"
        >
          {item.label}
        </a>
      ) : (
        <Link href={item.href ?? '#'} className="block py-6 text-sm font-medium no-underline">
          {item.label}
        </Link>
      )}
    </li>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center py-3 no-underline">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={IMAGES.logo}
            alt="Nanotom Capital"
            width={190}
            height={55}
            className="h-[55px] w-auto"
            fetchPriority="high"
          />
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {NAV.map((item) => (
              <DesktopItem key={item.label} item={item} />
            ))}
          </ul>
        </nav>

        <div className="hidden shrink-0 lg:block">
          <CtaButton className="!px-8 !py-3 !text-sm" />
        </div>

        <MobileNav />
      </div>
    </header>
  );
}
