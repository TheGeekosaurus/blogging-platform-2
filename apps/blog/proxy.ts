import { NextResponse, type NextRequest } from 'next/server';

/**
 * Redirects the old blog subdomain onto the apex, under /blog.
 *
 * The blog used to live at blog.example.com/<slug>; it now lives at
 * example.com/blog/<slug>. Every one of those old URLs has to 301 or the
 * accumulated ranking is thrown away — consolidating onto one domain is the
 * whole reason for this move.
 *
 * Vercel's built-in domain redirect cannot do this: it preserves the path, and
 * we need to PREFIX it with /blog. Hence a proxy.
 *
 * Runs before the CDN cache, so it costs nothing on cached pages, and it does
 * not touch requests already on the apex.
 */

/** Set to the apex, e.g. "https://example.com". Redirect is skipped if unset. */
const APEX = process.env.SITE_APEX_URL;

export function proxy(request: NextRequest) {
  if (!APEX) return NextResponse.next();

  const host = request.headers.get('host') ?? '';

  // Only the literal `blog.` subdomain. Matching more loosely risks catching
  // preview deployments, which must keep serving normally.
  if (!host.toLowerCase().startsWith('blog.')) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  const apex = APEX.replace(/\/+$/, '');

  // The old site's root maps to the blog index, not the new homepage.
  const suffix = pathname === '/' ? '/blog' : `/blog${pathname}`;

  return NextResponse.redirect(`${apex}${suffix}${search}`, 301);
}

export const config = {
  // Static assets and the revalidation endpoint are never subject to this.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
