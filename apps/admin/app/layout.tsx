import type { Metadata } from 'next';
import { Public_Sans } from 'next/font/google';

import './globals.css';

/**
 * Public Sans, which is the typeface the reference dashboards use.
 *
 * Self-hosted by next/font from our own origin, so there is no request to
 * Google at runtime and no layout shift while a webfont arrives — the same
 * arrangement the blog already uses for its four faces.
 *
 * The variable is consumed by `--font-sans` in globals.css rather than by a
 * class on <body>, so anything rendered outside the body's subtree — a portal,
 * the Next error overlay — still gets it.
 */
const publicSans = Public_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-public-sans',
});

export const metadata: Metadata = {
  title: 'Blog admin',
  // Never index the dashboard.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={publicSans.variable}>
      {/* Background and colour come from the base layer now, so that the canvas
          is one decision in one file rather than a utility here as well. */}
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
