import Image from 'next/image';
import Link from 'next/link';

import { CTA_HREF, LOCAL_IMAGES, NAV, type NavItem } from '../brand';
import { APPLY_LABEL } from '../ft/content';
import { DaylightHeaderShell } from './header-shell';
import { DaylightMobileNav } from './mobile-nav';

/*
 * Daylight's site header — the light twin of ../site-header.tsx.
 *
 * A separate component rather than a themed version of that one. The shared
 * header writes `text-white`, `border-white/10` and `bg-white/5` as literals,
 * so it cannot be re-pointed by tokens the way every section of the page body
 * can; and more to the point, this branch exists so the light build can be
 * changed freely, which a shared component would make impossible without
 * touching the live site on every edit.
 *
 * What it does NOT fork is the navigation itself. NAV comes from ../brand, the
 * same array the dark header reads, because the two sites have the same
 * navigation until Denis says otherwise — and a copied array is how one of them
 * ends up advertising a program the other has dropped.
 */

const TRIGGER_CLASS =
  'flex items-center gap-1.5 py-6 text-sm font-semibold text-[var(--ft-ink)]';

function DesktopItem({ item }: { item: NavItem }) {
  if (item.children) {
    const chevron = (
      <svg
        className="h-3 w-3 text-[var(--ft-subtle)] transition-transform group-hover:rotate-180"
        viewBox="0 0 12 12"
        aria-hidden="true"
      >
        <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );

    return (
      <li className="group relative">
        {item.href ? (
          <Link
            href={item.href}
            className={`${TRIGGER_CLASS} no-underline hover:text-[var(--ft-accent)]`}
          >
            {item.label}
            {chevron}
          </Link>
        ) : (
          <span className={`${TRIGGER_CLASS} cursor-default`}>
            {item.label}
            {chevron}
          </span>
        )}

        {/*
          CSS-only dropdown, so the whole header stays a server component but
          the menu is still reachable by keyboard — `focus-within` covers the
          users a hover-only menu locks out.

          The panel is white over a hairline and a soft shadow. On the dark
          header the raised near-black alone separates the panel from the page;
          on white there is no tonal step available, so the shadow is what does
          the separating and the border is what keeps its edge crisp.
        */}
        <ul className="invisible absolute left-0 top-full z-40 min-w-56 rounded-xl border border-[var(--ft-line)] bg-[var(--ft-bg)] py-2 opacity-0 shadow-[0_24px_48px_-24px_rgba(16,24,40,0.28)] transition-[opacity,visibility] group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
          {item.children.map((child) => (
            <li key={child.label}>
              {child.href ? (
                <Link
                  href={child.href}
                  className="block px-5 py-2 text-sm text-[var(--ft-muted)] no-underline hover:bg-[var(--ft-card)] hover:text-[var(--ft-ink)]"
                >
                  {child.label}
                </Link>
              ) : (
                <span
                  className="block cursor-default px-5 py-2 text-sm text-[var(--ft-subtle)]"
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
          className="block py-6 text-sm font-semibold text-[var(--ft-ink)] no-underline hover:text-[var(--ft-accent)]"
        >
          {item.label}
        </a>
      ) : (
        <Link
          href={item.href ?? '#'}
          className="block py-6 text-sm font-semibold text-[var(--ft-ink)] no-underline hover:text-[var(--ft-accent)]"
        >
          {item.label}
        </Link>
      )}
    </li>
  );
}

export function DaylightHeader() {
  return (
    <DaylightHeaderShell>
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center py-3 no-underline">
          {/*
            The ink wordmark, not the white one the dark header uses — see
            LOCAL_IMAGES.logoDark for why this is a second file rather than a
            CSS filter over the first.
          */}
          <Image
            src={LOCAL_IMAGES.logoDark}
            alt="Nanotom Capital"
            width={190}
            height={56}
            className="h-[42px] w-auto lg:h-[48px]"
            priority
          />
        </Link>

        {/*
          `ml-auto` here and not on the CTA: it pushes the nav and the button
          right together as one group, leaving the logo alone on the left.
        */}
        <nav aria-label="Main" className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-8">
            {NAV.map((item) => (
              <DesktopItem key={item.label} item={item} />
            ))}
          </ul>
        </nav>

        {/*
          The header button is the DARK PILL from the reference, not the gold
          one. Two reasons: the reference reserves its warm colour for the one
          button that starts the flow, and on this page that is the hero card's
          CTA — two gold buttons a hand's width apart would split the click. And
          white on #2D3748 is 11.99:1, so the pill is the most legible control
          in the header rather than the least.
        */}
        <div className="hidden shrink-0 items-center lg:flex">
          <Link
            href={CTA_HREF}
            className="inline-block rounded-full bg-[var(--ft-ink)] px-8 py-3.5 text-sm font-bold text-white no-underline transition-colors hover:bg-[#1f2937]"
          >
            {APPLY_LABEL}
          </Link>
        </div>

        <div className="ml-auto lg:hidden">
          <DaylightMobileNav />
        </div>
      </div>
    </DaylightHeaderShell>
  );
}
