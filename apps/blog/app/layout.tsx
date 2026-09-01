import type { Metadata } from 'next';
import { Lato, Poppins } from 'next/font/google';
import Link from 'next/link';

import { absoluteUrl, blogIndexPath, browsePath } from '@blog/core';

import { Analytics } from '@/components/marketing/analytics';
import { IMAGE_ORIGIN } from '@/components/marketing/brand';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { getSite } from '@/lib/site';
import { isMarketingSite } from '@/lib/marketing';
import './globals.css';

/*
 * Fonts matching the live site: --headlinefont was Lato, --contentfont Poppins.
 * next/font self-hosts the files from our own origin and inlines the @font-face
 * rules, so unlike HighLevel's setup there is no request to fonts.googleapis.com
 * and no render-blocking stylesheet.
 */
const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap',
  variable: '--font-lato',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();

  return {
    // Lets every nested page use relative canonical/OG URLs.
    metadataBase: new URL(site.base_url),
    title: {
      default: site.name,
      template: `%s — ${site.name}`,
    },
    description: site.description ?? undefined,
    alternates: {
      canonical: '/',
      types: {
        'application/rss+xml': absoluteUrl(site, '/feed.xml'),
      },
    },
    openGraph: {
      type: 'website',
      siteName: site.name,
      title: site.name,
      description: site.description ?? undefined,
      url: absoluteUrl(site, '/'),
      locale: site.locale,
    },
    twitter: {
      card: 'summary_large_image',
    },
    icons: site.favicon_url ? { icon: site.favicon_url } : undefined,
  };
}

/** Generic chrome, for any site that is not the coded marketing site. */
function DefaultHeader({ name }: { name: string }) {
  return (
    <header className="mx-auto flex w-full max-w-3xl flex-wrap items-baseline justify-between gap-3 border-b border-[var(--color-line)] px-5 py-7">
      <Link
        href="/"
        className="text-xl font-semibold tracking-tight !text-[var(--color-ink)] no-underline"
      >
        {name}
      </Link>
      <nav className="flex gap-5 text-sm">
        <Link href={blogIndexPath()}>Blog</Link>
        <Link href={browsePath()}>Categories</Link>
        <a href="/feed.xml">RSS</a>
      </nav>
    </header>
  );
}

/*
 * The root layout owns the document and the site chrome — and nothing else.
 *
 * It used to wrap every route in `max-w-3xl`, which suited a blog-only site but
 * makes a full-bleed marketing page impossible. That container now lives in
 * app/blog/layout.tsx, so blog routes are unchanged while marketing pages get
 * the whole viewport. The two routes that used to inherit it — the pages
 * catch-all and the 404 — supply it themselves.
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const site = await getSite();
  const marketing = isMarketingSite();

  return (
    <html lang={site.locale} className={`${lato.variable} ${poppins.variable}`}>
      <head>
        {/*
          Marketing images are hotlinked from HighLevel's CDN by decision, so the
          DNS + TLS handshake to that origin sits on the critical path for the
          hero. Preconnecting overlaps it with HTML parsing instead.
        */}
        {marketing ? <link rel="preconnect" href={IMAGE_ORIGIN} crossOrigin="" /> : null}
      </head>
      <body className={marketing ? 'marketing-root' : undefined}>
        {marketing ? <Analytics /> : null}

        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-[var(--color-surface)] focus:px-3 focus:py-2"
        >
          Skip to content
        </a>

        <div className="flex min-h-screen w-full flex-col">
          {marketing ? <SiteHeader /> : <DefaultHeader name={site.name} />}

          <main id="content" className="flex-1">
            {children}
          </main>

          {marketing ? (
            <SiteFooter />
          ) : (
            <footer className="mx-auto w-full max-w-3xl border-t border-[var(--color-line)] px-5 py-7 text-sm text-[var(--color-ink-muted)]">
              <p>
                © {new Date().getFullYear()} {site.name}
                {site.description ? ` — ${site.description}` : ''}
              </p>
            </footer>
          )}
        </div>
      </body>
    </html>
  );
}
