import Image from 'next/image';
import Link from 'next/link';

import { blogIndexPath } from '@blog/core';

import { CONTACT, FUNDING_PROGRAMS, LOCAL_IMAGES, POLICY_LINKS } from '../brand';
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
 * IT SITS ON THE NAVY TILE, so the page has a floor. A white footer under a
 * white page is the page simply running out, which is the one thing the dark
 * design never had to think about; it was the pale band tone until Denis sent
 * the tiled mark, and `.dl-footer` in globals.css now carries both the artwork
 * and the token inversion that a dark ground needs.
 *
 * Which is also why the wordmark here is LOCAL_IMAGES.logo, the light original,
 * where the header still uses `logoDark`. That is not a reversal of "leave the
 * logo black": `logoDark` is the ink wordmark drawn for a white ground, and the
 * ground under this one is navy again. Same rule, other side of it.
 *
 * WHAT IS DELIBERATELY MISSING: the /get-funded check. The shared footer wraps
 * its CTA band in a client component so the band can hide itself on the
 * application page, where the same sentence is already the <h1>. Daylight
 * serves one route today and that route is not /get-funded, so the band is
 * plain markup and this footer ships no JavaScript at all. Restore the check
 * when this build gains a second page.
 */
export function DaylightFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="dl-footer border-t border-[var(--ft-line)] text-[var(--ft-ink)]">
      <div className="border-b border-[var(--ft-line)]">
        <div
          className={`${CONTAINER} flex flex-col items-center gap-6 py-12 text-center lg:flex-row lg:justify-between lg:text-left`}
        >
          <h2 className="font-[family-name:var(--font-headline)] text-2xl leading-tight sm:text-3xl">
            We Can Secure The Capital You Need For Your Business
          </h2>
          <CtaButton className="shrink-0" />
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-[1.8fr_1fr_1fr] lg:px-8">
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

        <div>
          {/*
            The heading is itself the link to /funding-solutions, which is how
            that page keeps its place now the column below it is the five
            individual programs.
          */}
          <Link
            href="/funding-solutions"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ft-accent)] no-underline hover:text-[var(--ft-ink)]"
          >
            Funding Solutions
          </Link>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-[var(--ft-muted)]">
            {FUNDING_PROGRAMS.map((program) => (
              <li key={program.href}>
                <Link href={program.href} className="no-underline hover:text-[var(--ft-ink)]">
                  {program.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ft-accent)]">
            Resources
          </p>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-[var(--ft-muted)]">
            <li>
              <Link href={blogIndexPath()} className="no-underline hover:text-[var(--ft-ink)]">
                Blog
              </Link>
            </li>
            <li>
              <Link href="/calc" className="no-underline hover:text-[var(--ft-ink)]">
                Loan Calculator
              </Link>
            </li>
            <li>
              <Link href="/programs" className="no-underline hover:text-[var(--ft-ink)]">
                Programs
              </Link>
            </li>
          </ul>
        </div>
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
    </footer>
  );
}
