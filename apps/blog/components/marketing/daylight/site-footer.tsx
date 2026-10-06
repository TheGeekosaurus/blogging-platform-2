import Image from 'next/image';
import Link from 'next/link';

import { blogIndexPath } from '@blog/core';

import {
  CALCULATORS,
  CONTACT,
  FUNDING_PROGRAMS,
  INDUSTRIES,
  LOCAL_IMAGES,
  POLICY_LINKS,
} from '../brand';
import { FOOTER_CTA } from './content';
import { CONTAINER, CtaButton } from './primitives';

/**
 * Daylight's footer — the light twin of ../site-footer.tsx.
 *
 * Same structure, same links, same legal text, in the light palette. It is a
 * separate component for the reason the header is: the shared one writes
 * `text-white/70` and `border-white/10` as literals, and this branch is meant
 * to be edited without the live footer moving under it.
 *
 * THE LEGAL COPY IS THE SAME COPY, verbatim, and that is not incidental. The
 * operator paragraph, the funding disclaimer, the third-party notice and the
 * platform disclaimer are compliance text supplied by Denis, not marketing —
 * this file must not paraphrase, tighten or shorten any of it. If any of it
 * changes, it changes in both footers together.
 *
 * IT SITS ON FLAT NAVY, so the page has a floor. A white footer under a white
 * page is the page simply running out, which is the one thing the dark design
 * never had to think about. It was the pale band tone, then briefly the tiled
 * Nanotom mark, which Denis took off; `.dl-footer` in globals.css is now the
 * ground colour and the token inversion a dark ground needs.
 *
 * Which is also why the wordmark here is LOCAL_IMAGES.logo, the light original,
 * where the header still uses `logoDark`. That is not a reversal of "leave the
 * logo black": `logoDark` is the ink wordmark drawn for a white ground, and the
 * ground under this one is navy. Same rule, other side of it.
 *
 * THE CTA IS PART OF THIS COMPONENT, not of the homepage, and that is the point
 * of it living here: Denis asked for the card to travel with the footer, so
 * every page that gains this footer gains the card with it. It sits on a WHITE
 * section rather than being a full-bleed navy band — the white around it is
 * what makes it read as a card at all.
 *
 * WHAT IS DELIBERATELY MISSING: the /get-funded check. The shared footer wraps
 * its CTA band in a client component so the band can hide itself on the
 * application page, where the same sentence is already the <h1>. Daylight
 * serves one route today and that route is not /get-funded, so the card is
 * plain markup and this footer ships no JavaScript at all. Restore the check
 * when this build gains a second page — it matters more now the card is
 * bigger than the band was.
 */
/**
 * One link column in the navy footer.
 *
 * Four of these where there were two, so they stopped being worth writing out:
 * the heading, an optional page of its own behind it, and a list. The heading
 * takes --ft-accent, which `.dl-footer` points at the brand gold.
 */
function FooterColumn({
  heading,
  href,
  links,
}: {
  heading: string;
  href?: string;
  links: readonly { label: string; href: string }[];
}) {
  /*
   * `block w-fit` is what makes the four headings line up.
   *
   * A linked heading is an <a>, which is inline, so it sits on a line box with
   * leading above it; an unlinked one is a <p>, which is block and starts at
   * the cell's top edge. Measured in the browser, that put Funding Solutions
   * and About Us exactly 5px below Industries and Resources. `block` removes
   * the line box, and `w-fit` keeps the click target the width of the words
   * rather than the whole column.
   */
  const headingClass =
    'block w-fit text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ft-accent)]';

  return (
    <div>
      {href ? (
        <Link href={href} className={`${headingClass} no-underline hover:text-[var(--ft-ink)]`}>
          {heading}
        </Link>
      ) : (
        <p className={headingClass}>{heading}</p>
      )}

      <ul className="mt-4 flex flex-col gap-2 text-sm text-[var(--ft-muted)]">
        {links.map((link) => (
          <li key={link.href}>
            {/*
              `tel:` is not in-app navigation, so those rows are plain anchors —
              next/link is for routes, not for handing a URI scheme to the OS.
            */}
            {link.href.startsWith('tel:') ? (
              <a href={link.href} className="no-underline hover:text-[var(--ft-ink)]">
                {link.label}
              </a>
            ) : (
              <Link href={link.href} className="no-underline hover:text-[var(--ft-ink)]">
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DaylightFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--ft-line)]">
      {/*
        The CTA card, on white. Copy in ./content.ts, which records the line
        each part of it was already saying elsewhere on the page.
      */}
      <div className={`${CONTAINER} py-14 lg:py-20`}>
        <div className="dl-cta-card overflow-hidden rounded-2xl px-7 py-9 sm:px-10 sm:py-11 lg:px-14 lg:py-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-14">
            <div className="max-w-[34rem]">
              <h2 className="font-[family-name:var(--font-headline)] text-[clamp(1.5rem,3vw,2.125rem)] font-semibold leading-[1.15] text-[var(--ft-ink)]">
                {FOOTER_CTA.heading}
              </h2>
              <p className="mt-4 text-[1.0625rem] leading-[1.6] text-[var(--ft-muted)]">
                {FOOTER_CTA.body}
              </p>
            </div>

            {/*
              The button and its reassurance line, right-hand side. `text-center`
              only once they sit under a centred button — stacked on a phone they
              are a left-aligned column under the paragraph.
            */}
            <div className="flex shrink-0 flex-col items-start gap-4 lg:items-center lg:text-center">
              <CtaButton className="!px-10 !py-4" />
              {/*
                White, not --ft-muted, and that is what lets the artwork show:
                this line is the only text in the card's right half, so the
                scrim there only has to clear white. See `.dl-cta-card`.
              */}
              <p className="max-w-[18rem] text-[0.9375rem] leading-snug text-[var(--ft-ink)]">
                {FOOTER_CTA.reassurance}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="dl-footer text-[var(--ft-ink)]">
        {/*
          Five tracks: the brand block, then the four link columns. Two columns
          on a tablet and one on a phone, which is what the arbitrary track list
          is for — `lg:grid-cols-5` would give the brand block the same width as
          a link column and leave its paragraph in a 200px gutter.
        */}
        <div
          className={`${CONTAINER} grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] lg:gap-8`}
        >
          <div>
            {/* The light original, because the footer ground is navy again. */}
            <Image
              src={LOCAL_IMAGES.logo}
              alt="Nanotom Capital"
              width={190}
              height={56}
              className="h-11 w-auto"
            />
            <p className="mt-6 max-w-sm text-sm leading-[1.8] text-[var(--ft-muted)]">
              At Nanotom Capital, we empower businesses to unlock the funding they need. Our
              streamlined approach delivers fast, hassle-free access to capital, letting you
              focus on building what you love.
            </p>
          </div>

          {/*
            A heading links to the section's own page where there IS one, which
            is how those pages keep their place now the columns below them are
            the individual entries. The headings are gold rather than the brand
            cyan — see --ft-accent in `.dl-footer`.

            INDUSTRIES HAS NO `href`, and that is not an oversight. /industries
            is a static route belonging to the Labs deployment and calls
            notFound() on Capital, so it answers 404 here — checked against the
            running build, not assumed. Its two child pages are real. The header
            still points its Industries trigger at that path; fixing that means
            editing NAV, which the dark site reads too, so it is Denis's call
            rather than a change to make in passing.
          */}
          <FooterColumn heading="Funding Solutions" href="/funding-solutions" links={FUNDING_PROGRAMS} />
          <FooterColumn heading="Industries" links={INDUSTRIES} />
          <FooterColumn
            heading="About Us"
            href="/about-us"
            links={[
              { label: 'Get Funded', href: '/get-funded' },
              /*
               * The phone as its own row rather than a "Contact" label, because
               * the number IS the contact route — this site has no contact form,
               * and a link reading "Contact" that opens a dialer is a surprise.
               */
              { label: CONTACT.phone, href: CONTACT.phoneHref },
            ]}
          />
          {/*
            BOTH CALCULATORS, from the same array the header menu reads. This
            column listed one row, "Loan Calculator", pointing at /calc — so
            the DSCR calculator was a live page the footer never mentioned.
            Spreading CALCULATORS keeps the two lists from drifting the way a
            hand-written row already had.
          */}
          <FooterColumn
            heading="Resources"
            links={[
              { label: 'Blog', href: blogIndexPath() },
              ...CALCULATORS,
              { label: 'Programs', href: '/programs' },
            ]}
          />
        </div>

      <div className="border-t border-[var(--ft-line)]">
        <div className="mx-auto max-w-7xl space-y-5 px-5 py-10 text-xs leading-relaxed text-[var(--ft-subtle)] lg:px-8">
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            {POLICY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="no-underline hover:text-[var(--ft-ink)]">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <p>
            This website is operated and maintained by Nanotom Capital, a DBA of{' '}
            {CONTACT.legalEntity}. Use of the website is governed by its{' '}
            <Link href="/terms-of-use" className="underline hover:text-[var(--ft-ink)]">
              Terms Of Use
            </Link>{' '}
            and{' '}
            <Link href="/privacy-policy" className="underline hover:text-[var(--ft-ink)]">
              Privacy Policy
            </Link>
            {'.'}
          </p>

          {/*
            The funding disclaimer, supplied by Denis, directly under the
            paragraph naming the operator because the two answer the same
            reader in order: who runs this site, then who actually lends the
            money and on what terms.

            Note what it says about the lender. Nanotom Capital is not the
            funding provider on these products — a network of unaffiliated
            third parties is, named in the agreement before signing. Nothing
            elsewhere on the site says otherwise, and nothing should start to.
          */}
          <p>
            Business loans and revenue advances are issued by a network of unaffiliated
            third-party funding providers. The provider will be identified in the loan or
            revenue advance agreement prior to signing. Financing is not guaranteed and is
            subject to approval based on underwriting criteria which includes, but is not
            limited to, business &amp; personal credit history, time in business, cash flow,
            revenue consistency, industry-specific underwriting rules, and in certain
            financings, approval by third-party funding providers. Eligibility, maximum
            amounts, funding and approval times vary based on program, provider, and
            applicant qualifications. All applications require completed documentation and
            will be reviewed during business hours. Each application is subject to a soft
            credit check that will not affect credit scores. Terms, conditions, and
            restrictions may apply.
          </p>

          <p>
            The Company may link to content or refer to content and/or services created by
            or provided by third parties that are not affiliated with the Company. The
            Company is not responsible for such content and does not endorse or approve it.
            The Company may provide services by or refer you to third-party businesses. Some
            of these businesses have common interest and ownership with the Company.
          </p>

          <p>
            This site is not a part of the YouTube, Bing, Google or Facebook website; Google
            Inc, Microsoft Inc or Meta Inc. Additionally, this site is NOT endorsed by
            YouTube, Google, Bing or Facebook in any way. FACEBOOK is a trademark of
            FACEBOOK, Inc. YOUTUBE is a trademark of GOOGLE Inc. BING is a trademark of
            MICROSOFT Inc.
          </p>

          <p className="text-center">©{year} Nanotom Capital. All rights reserved.</p>

          <p className="text-center">{CONTACT.address}</p>
        </div>
        </div>
      </div>
    </footer>
  );
}
