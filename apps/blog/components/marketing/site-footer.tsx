import Image from 'next/image';
import Link from 'next/link';

import { blogIndexPath } from '@blog/core';

import { CONTACT, FUNDING_PROGRAMS, LOCAL_IMAGES, POLICY_LINKS } from './brand';
import { FooterCta } from './footer-cta';

/**
 * Site footer.
 *
 * The live HighLevel footer is reproduced with four defects repaired, all of
 * them visible to a visitor today:
 *
 *  1. It renders TWICE (a desktop copy and a mobile copy, both in the DOM).
 *     Here it is one responsive footer.
 *  2. The two copies disagree about the year: '©2026' and '© 2023'.
 *  3. One copy reads 'Nanotom Capital is a DBA of .' — the entity name is
 *     missing from the HighLevel field.
 *  4. 'Contact', 'Cookie Policy', 'Manage Your Data' and 'About Us' all point at
 *     URLs that soft-404. They are dropped rather than shipped broken; add them
 *     back once those pages exist.
 *
 * The 'Blog' link is the one deliberate change of destination: it goes to /blog
 * on this domain instead of blog.nanotomcapital.com. Consolidating the blog onto
 * the apex is the whole reason for this migration.
 *
 * TWO LINK COLUMNS, at Denis's request: the funding programs and the things a
 * visitor reads or uses. The 'Give Us A Call' column is gone with them — the
 * ADDRESS moved to the bottom line under the copyright, and the PHONE NUMBER is
 * no longer in the footer at all. It has not left the site (the calculator's
 * two advisor prompts and the FAQ's "Ask a Question" button still dial it), but
 * this is the second place it has been removed from: the header dropped it
 * earlier on the argument that it lived in the footer. Nothing now shows a
 * phone number on the homepage or /funding-solutions. Put a row back here if
 * that turns out to cost calls.
 *
 * The 'Follow Us' column stays gone, as it has been since the migration: its
 * four links pointed at instagram.com, facebook.com, linkedin.com and
 * youtube.com — the networks' own home pages rather than this company's
 * profiles. See the note where SOCIAL used to live in brand.ts.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[var(--color-ground)] text-white">
      {/* Absent on /get-funded, where it would duplicate the h1 — see FooterCta. */}
      <FooterCta />

      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-[1.8fr_1fr_1fr] lg:px-8">
        <div>
          <Image
            src={LOCAL_IMAGES.logo}
            alt="Nanotom Capital"
            width={190}
            height={56}
            className="h-11 w-auto"
          />
          <p className="mt-6 max-w-sm text-sm leading-[1.8] text-white/70">
            At Nanotom Capital, we empower businesses to unlock the funding they need. Our
            streamlined approach delivers fast, hassle-free access to capital, letting you
            focus on building what you love.
          </p>
        </div>

        <div>
          {/*
            The heading is the link to /funding-solutions, which is how that
            page keeps its place in the footer now the column below it is the
            five individual programs. The alternative was a sixth list item
            ("All Funding Solutions") sitting above the five it summarises.
          */}
          <Link
            href="/funding-solutions"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gold)] no-underline hover:text-white"
          >
            Funding Solutions
          </Link>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-white/70">
            {FUNDING_PROGRAMS.map((program) => (
              <li key={program.href}>
                <Link href={program.href} className="no-underline hover:text-white">
                  {program.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          {/*
            "Resources", not "Quick Links". The column next to it is now links
            too, so "quick" said nothing about what was in this one — these are
            the things a visitor reads or uses rather than applies for.
          */}
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gold)]">
            Resources
          </p>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-white/70">
            <li>
              <Link href={blogIndexPath()} className="no-underline hover:text-white">
                Blog
              </Link>
            </li>
            <li>
              {/*
                /calc, not the calc.nanotomcapital.com subdomain this used to
                open in a new tab. The calculator is a page in this repo now, and
                the header has always pointed at the on-domain path — the footer
                sending people somewhere else was the odd one out.
              */}
              <Link href="/calc" className="no-underline hover:text-white">
                Loan Calculator
              </Link>
            </li>
            <li>
              <Link href="/programs" className="no-underline hover:text-white">
                Programs
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl space-y-5 px-5 py-10 text-xs leading-relaxed text-white/50 lg:px-8">
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            {POLICY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="no-underline hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <p>
            This website is operated and maintained by Nanotom Capital, a DBA of{' '}
            {CONTACT.legalEntity}. Use of the website is governed by its{' '}
            <Link href="/terms-of-use" className="underline hover:text-white">
              Terms Of Use
            </Link>{' '}
            and{' '}
            <Link href="/privacy-policy" className="underline hover:text-white">
              Privacy Policy
            </Link>
            {'.'}
          </p>

          {/*
            The funding disclaimer, supplied by Denis. It sits directly under
            the paragraph naming the operator because the two answer the same
            reader in order: who runs this site, then who actually lends the
            money and on what terms.

            Note what it says about the lender. Nanotom Capital is not the
            funding provider on these products — a network of unaffiliated
            third parties is, named in the agreement before signing. Nothing
            elsewhere on the site says otherwise, and nothing should start to:
            the marketing copy says "we" about placing and advising on a file,
            never about being the party extending the credit.
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

          <p className="text-center">
            ©{year} Nanotom Capital. All rights reserved.
          </p>

          {/* The address, which used to head its own column beside the phone. */}
          <p className="text-center">{CONTACT.address}</p>
        </div>
      </div>
    </footer>
  );
}
