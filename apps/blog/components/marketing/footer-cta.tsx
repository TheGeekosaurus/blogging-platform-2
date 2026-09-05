'use client';

import { usePathname } from 'next/navigation';

import { CTA_HREF } from './brand';
import { CtaButton } from './cta-button';

/**
 * The band above the footer: one line of copy and the Get Funded button.
 *
 * It hides itself on /get-funded, and that is the whole reason it is a component
 * rather than markup inside SiteFooter. The heading here is the same sentence
 * the application page uses as its <h1> — both come from the live HighLevel
 * site, where this band is on every page — so without the check that page shows
 * the line twice and offers a button to the page the visitor is already reading.
 *
 * WHY A CLIENT COMPONENT. The current path is not knowable in a server component
 * without threading it down from every route, and the footer is rendered once in
 * the layout. `usePathname` runs during prerender too, so the band is either in
 * the static HTML or absent from it — there is no flash of a band that then
 * disappears, and nothing here is deferred to the client.
 */
export function FooterCta() {
  const pathname = usePathname();

  // trailingSlash: true, so the rendered path carries one and CTA_HREF does not.
  if (pathname.replace(/\/$/, '') === CTA_HREF.replace(/\/$/, '')) return null;

  return (
    <div className="border-b border-white/10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-5 py-12 text-center lg:flex-row lg:justify-between lg:px-8 lg:text-left">
        <h2 className="font-[family-name:var(--font-headline)] text-2xl leading-tight sm:text-3xl">
          We Can Secure The Capital You Need For Your Business
        </h2>
        <CtaButton className="shrink-0" />
      </div>
    </div>
  );
}
