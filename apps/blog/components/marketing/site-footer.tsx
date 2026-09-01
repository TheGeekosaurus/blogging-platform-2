import Link from 'next/link';

import { blogIndexPath } from '@blog/core';

import { CtaButton } from './cta-button';
import { CONTACT, POLICY_LINKS, SOCIAL } from './brand';

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
    <footer className="bg-[var(--color-brand)] text-white">
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-5 py-12 text-center lg:flex-row lg:justify-between lg:px-8 lg:text-left">
          <h2 className="font-[family-name:var(--font-headline)] text-2xl leading-tight sm:text-3xl">
            We Can Secure The Capital You Need For Your Business
          </h2>
          <CtaButton className="shrink-0" />
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="sm:col-span-2">
          <p className="text-sm uppercase tracking-widest text-white/60">Give Us A Call</p>
          <a
            href={CONTACT.phoneHref}
            className="mt-2 inline-block font-[family-name:var(--font-headline)] text-2xl no-underline hover:text-[var(--color-gold)]"
          >
            {CONTACT.phone}
          </a>
          <p className="mt-5 max-w-md text-sm leading-[1.8] text-white/70">
            At Nanotom Capital, we empower businesses to unlock the funding they need. Our
            streamlined approach delivers fast, hassle-free access to capital, letting you
            focus on building what you love.
          </p>
        </div>

        <div>
          <h3 className="font-[family-name:var(--font-headline)] text-lg">Quick Links</h3>
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

        <div>
          <h3 className="font-[family-name:var(--font-headline)] text-lg">Follow Us</h3>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-white/70">
            {SOCIAL.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline hover:text-white"
                >
                  {s.label}
                </a>
              </li>
            ))}
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
            ©{year} Nanotom Capital. All rights reserved. · {CONTACT.address}
          </p>
        </div>
      </div>
    </footer>
  );
}
