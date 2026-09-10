import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SiteRow } from '@blog/core';

const site = { base_url: 'https://nanotom.test' } as SiteRow;

const ORIGINAL = process.env.INDEXNOW_KEY;
const KEY = 'a1b2c3d4e5f6a7b8c9d0';

async function load() {
  vi.resetModules();
  return import('@/lib/indexnow');
}

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.INDEXNOW_KEY;
  else process.env.INDEXNOW_KEY = ORIGINAL;
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('indexNowKey', () => {
  it('is null when unset, so the ping is simply skipped', async () => {
    delete process.env.INDEXNOW_KEY;
    const { indexNowKey } = await load();
    expect(indexNowKey()).toBeNull();
  });

  it('treats a too-short value as unset', async () => {
    /*
     * A placeholder left in the env would otherwise be submitted and rejected
     * with a 403 on every publish, with nothing on screen explaining why.
     */
    process.env.INDEXNOW_KEY = 'todo';
    const { indexNowKey } = await load();
    expect(indexNowKey()).toBeNull();
  });
});

describe('submitToIndexNow', () => {
  beforeEach(() => {
    process.env.INDEXNOW_KEY = KEY;
  });

  it('does nothing when no key is configured', async () => {
    delete process.env.INDEXNOW_KEY;
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { submitToIndexNow } = await load();

    const result = await submitToIndexNow(site, ['/blog/a-post/']);

    expect(result).toMatchObject({ ok: true, submitted: 0 });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does nothing when there is nothing to submit', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { submitToIndexNow } = await load();

    expect(await submitToIndexNow(site, [])).toMatchObject({ submitted: 0 });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sends absolute URLs, the host, and where the key lives', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('', { status: 200 }));
    const { submitToIndexNow, KEY_PATH } = await load();

    await submitToIndexNow(site, ['/blog/a-post/', '/blog']);

    const body = JSON.parse(String(fetchSpy.mock.calls[0]![1]!.body));
    expect(body.host).toBe('nanotom.test');
    expect(body.key).toBe(KEY);
    expect(body.keyLocation).toBe(`https://nanotom.test${KEY_PATH}`);
    // Absolute, because the protocol takes URLs and not paths.
    expect(body.urlList).toEqual([
      'https://nanotom.test/blog/a-post/',
      'https://nanotom.test/blog',
    ]);
  });

  it('deduplicates, so one save cannot spend quota twice on a URL', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('', { status: 200 }));
    const { submitToIndexNow } = await load();

    const result = await submitToIndexNow(site, ['/blog', '/blog', '/blog']);

    expect(JSON.parse(String(fetchSpy.mock.calls[0]![1]!.body)).urlList).toHaveLength(1);
    expect(result.submitted).toBe(1);
  });

  it('reports a rejection without throwing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Invalid key', { status: 403 }),
    );
    const { submitToIndexNow } = await load();

    const result = await submitToIndexNow(site, ['/blog']);

    expect(result.ok).toBe(false);
    expect(result.error).toContain('403');
    expect(result.error).toContain('Invalid key');
  });

  it('swallows a network failure', async () => {
    // A publish must not fail because a third-party endpoint is down.
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNRESET'));
    const { submitToIndexNow } = await load();

    const result = await submitToIndexNow(site, ['/blog']);

    expect(result.ok).toBe(false);
    expect(result.error).toContain('ECONNRESET');
  });
});

describe('the revalidate route submits content URLs, not purge paths', () => {
  const source = readFileSync(
    join(__dirname, '..', 'app', 'api', 'revalidate', 'route.ts'),
    'utf8',
  );

  it('derives its own narrow list rather than reusing `revalidated`', () => {
    /*
     * `revalidated` includes /sitemap.xml, /feed.xml and route patterns like
     * '/blog/category/[slug]'. A route pattern gets the whole batch rejected,
     * and submitting the sitemap asks a crawler to index the file it should be
     * reading instead.
     */
    expect(source).toContain('function indexNowPaths(');
    expect(source).toContain('indexNowPaths(target)');
    expect(source).not.toContain('indexNowPaths(revalidated');
    expect(source).not.toContain('submitToIndexNow(site, revalidated');
  });

  it('takes its host from the request, not a database round trip', () => {
    /*
     * This route's job is local cache invalidation; making it read the sites
     * row added a hard dependency on SUPABASE_URL and broke its own tests. The
     * admin calls this endpoint AT base_url, so the request host is that value
     * by construction — and using it guarantees the submitted URLs share a
     * host with the key file that proves ownership.
     */
    expect(source).toContain('base_url: new URL(request.url).origin');
    expect(source).not.toContain("from '@/lib/site'");
  });

  it('never lets the ping change the response status', () => {
    // The pages are already live by then; a slow endpoint must not report the
    // publish as failed.
    expect(source).toMatch(/NextResponse\.json\(\{ revalidated, indexNow, now/);
  });

  it('serves the key file at exactly the path the submission names', async () => {
    /*
     * KEY_PATH is what goes out as `keyLocation`; the route DIRECTORY is what
     * actually answers. Nothing but this connects them, and if they diverge
     * ownership verification fails while every page still renders — so compare
     * the constant against the real directory rather than trusting either.
     */
    const { KEY_PATH } = await load();
    const dir = KEY_PATH.replace(/^\//, '');

    expect(existsSync(join(__dirname, '..', 'app', dir, 'route.ts'))).toBe(true);
  });

  it('404s the key file when no key is set', () => {
    // An empty file would fail verification in a way that looks like a content
    // problem rather than a missing setting.
    const route = readFileSync(
      join(__dirname, '..', 'app', 'indexnow-key.txt', 'route.ts'),
      'utf8',
    );

    expect(route).toContain('indexNowKey()');
    expect(route).toContain('status: 404');
  });
});
