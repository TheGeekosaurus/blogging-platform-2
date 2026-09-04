import { createHash, timingSafeEqual } from 'node:crypto';

import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

import { blogIndexPath, browsePath, pagePath, postPath } from '@blog/core';

/**
 * On-demand revalidation, called by the admin after a write.
 *
 * The admin is a separate deployment, so it cannot call revalidatePath() here
 * directly. It sends only WHAT changed; this route — which owns the routing —
 * decides which paths that affects.
 */

export const dynamic = 'force-dynamic';

/**
 * Constant-time secret comparison.
 *
 * Both sides are hashed first so the buffers are always 32 bytes:
 * timingSafeEqual throws on length mismatch, and that throw would itself leak
 * the secret's length. A plain `===` would leak the secret by comparison timing.
 */
function secretMatches(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

type Target =
  | { type: 'post'; slug?: unknown }
  | { type: 'page'; path?: unknown }
  | { type: 'site' };

export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET;

  if (!expected) {
    // Fail closed. Without a configured secret this endpoint would either be
    // open to everyone or silently useless; neither is acceptable.
    return NextResponse.json(
      { error: 'REVALIDATE_SECRET is not set on this deployment.' },
      { status: 500 },
    );
  }

  if (!secretMatches(request.headers.get('x-revalidate-secret'), expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let target: Target;
  try {
    target = (await request.json()) as Target;
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 });
  }

  const revalidated = revalidateFor(target);

  if (revalidated === null) {
    return NextResponse.json(
      {
        error:
          'Unrecognised target. Expected { type: "post", slug }, ' +
          '{ type: "page", path } or { type: "site" }.',
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ revalidated, now: Date.now() });
}

/** Returns the paths invalidated, or null if the target made no sense. */
function revalidateFor(target: Target): string[] | null {
  if (target?.type === 'site') {
    // Blunt but correct: invalidates the whole route tree.
    revalidatePath('/', 'layout');
    return ['/ (layout)'];
  }

  if (target?.type === 'post') {
    const slug = typeof target.slug === 'string' ? target.slug.trim() : '';
    if (!slug) return null;

    // '/' is included because the homepage falls back to a post list when no
    // homepage page is set. sitemap and feed both list posts, so any post change
    // dirties them too.
    const paths = [
      postPath(slug),
      blogIndexPath(),
      '/',
      browsePath(),
      '/sitemap.xml',
      '/feed.xml',
      // The homepage candidate lists posts too, and it is force-static with no
      // timer — so without this line publishing would appear to work while
      // /home-v2 kept serving whatever was published at build time, with no way
      // to flush it. Delete this when the page is promoted to '/', which is
      // already above.
      '/home-v2',
    ];
    for (const path of paths) revalidatePath(path);

    // Dynamic-route form invalidates every generated page of that route, which
    // is what a new or reordered post needs — its position in pagination and in
    // any archive it belongs to can both change.
    const routes = ['/blog/page/[page]', '/blog/category/[slug]', '/blog/tag/[slug]'];
    for (const route of routes) revalidatePath(route, 'page');

    return [...paths, ...routes];
  }

  if (target?.type === 'page') {
    const raw = typeof target.path === 'string' ? target.path.trim() : '';
    if (!raw) return null;

    // A page's own URL, plus '/' in case it is the homepage, plus the sitemap.
    // Re-parenting moves descendants, so the whole catch-all route is dropped
    // rather than trying to enumerate the subtree from here.
    const paths = [pagePath(raw), '/', '/sitemap.xml'];
    for (const path of paths) revalidatePath(path);

    revalidatePath('/[...path]', 'page');

    return [...paths, '/[...path]'];
  }

  return null;
}
