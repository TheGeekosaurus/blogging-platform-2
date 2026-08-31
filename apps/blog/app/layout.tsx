import type { Metadata } from 'next';
import Link from 'next/link';

import { absoluteUrl } from '@blog/core';

import { getSite } from '@/lib/site';
import './globals.css';

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const site = await getSite();

  return (
    <html lang={site.locale}>
      <body>
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-[var(--color-surface)] focus:px-3 focus:py-2"
        >
          Skip to content
        </a>

        <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5">
          <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--color-line)] py-7">
            <Link
              href="/"
              className="text-xl font-semibold tracking-tight !text-[var(--color-ink)] no-underline"
            >
              {site.name}
            </Link>
            {/* RSS and sitemap land in phase 6, so they are not linked yet. */}
            <nav className="flex gap-5 text-sm">
              <Link href="/">Latest</Link>
              <Link href="/categories">Categories</Link>
            </nav>
          </header>

          <main id="content" className="flex-1 py-10">
            {children}
          </main>

          <footer className="border-t border-[var(--color-line)] py-7 text-sm text-[var(--color-ink-muted)]">
            <p>
              © {new Date().getFullYear()} {site.name}
              {site.description ? ` — ${site.description}` : ''}
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
