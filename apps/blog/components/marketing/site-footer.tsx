import Image from 'next/image';
import Link from 'next/link';

import { blogIndexPath } from '@blog/core';

import { CONTACT, LOCAL_IMAGES, POLICY_LINKS } from './brand';
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
 * The 'Blog Articles' link is the one deliberate change of destination: it goes
 * to /blog on this domain instead of blog.nanotomcapital.com. Consolidating the
 * blog onto the apex is the whole reason for this migration.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[var(--color-ground)] text-white">
      {/* Absent on /get-funded, where it would duplicate the h1 — see FooterCta. */}
      <FooterCta />

      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-[1.8fr_1fr_1.2fr] lg:px-8">
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gold)]">
            Quick Links
          </p>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-white/70">
            <li>
              <Link href={blogIndexPath()} className="no-underline hover:text-white">
                Blog Articles
              </Link>
            </li>
            <li>
              <Link href="/programs" className="no-underline hover:text-white">
                Programs
              </Link>
            </li>
            <li>
              <a
                href="https://calc.nanotomcapital.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline hover:text-white"
              >
                Loan Calculator
              </a>
            </li>
          </ul>
        </div>

        {/*
          The "Follow Us" column is gone, not fixed. Its four links pointed at
          instagram.com, facebook.com, linkedin.com and youtube.com — the
          networks' own home pages rather than this company's profiles. See the
          note where SOCIAL used to live in brand.ts; restore this block when
          there are real URLs to put in it.
        */}

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gold)]">
            Give Us A Call
          </p>
          <a
            href={CONTACT.phoneHref}
            className="mt-3 inline-block font-[family-name:var(--font-headline)] text-xl no-underline hover:text-[var(--color-gold)]"
          >
            {CONTACT.phone}
          </a>
          <p className="mt-4 text-sm leading-[1.6] text-white/70">{CONTACT.address}</p>
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
        </div>
      </div>
    </footer>
  );
}
