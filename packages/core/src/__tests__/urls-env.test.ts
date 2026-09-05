import { afterEach, describe, expect, it } from 'vitest';

import { mediaPublicUrl } from '../urls';
import { isLive } from '../queries';

/**
 * Pins the mechanism behind apps/admin/__tests__/client-env.test.ts.
 *
 * `mediaPublicUrl` needs SUPABASE_URL. In a browser that variable does not
 * exist — Next only inlines NEXT_PUBLIC_-prefixed names — so calling this from a
 * client component throws where the user can see it. Keeping the failure
 * asserted here means the reason the admin guard exists stays legible even if
 * someone reads that test in isolation.
 */
const ORIGINAL = process.env.SUPABASE_URL;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.SUPABASE_URL;
  else process.env.SUPABASE_URL = ORIGINAL;
});

describe('mediaPublicUrl and the environment', () => {
  it('throws when SUPABASE_URL is absent, as it is in any browser', () => {
    delete process.env.SUPABASE_URL;
    expect(() => mediaPublicUrl('site-1/x.webp')).toThrow(/SUPABASE_URL/);
  });

  it('builds a public object URL when the variable is present', () => {
    process.env.SUPABASE_URL = 'https://ref.supabase.co';
    expect(mediaPublicUrl('site-1/x.webp')).toBe(
      'https://ref.supabase.co/storage/v1/object/public/media/site-1/x.webp',
    );
  });

  it('passes an absolute URL straight through, for imported content', () => {
    process.env.SUPABASE_URL = 'https://ref.supabase.co';
    expect(mediaPublicUrl('https://old.example/x.png')).toBe('https://old.example/x.png');
  });
});

describe('isLive — does a row have a public URL?', () => {
  const past = '2020-01-01T00:00:00.000Z';
  const future = new Date(Date.now() + 86_400_000).toISOString();

  it('is true only for a published row dated in the past', () => {
    expect(isLive({ status: 'published', published_at: past })).toBe(true);
  });

  it.each([
    ['draft', { status: 'draft' as const, published_at: null }],
    ['scheduled', { status: 'scheduled' as const, published_at: future }],
    ['archived', { status: 'archived' as const, published_at: past }],
  ])('is false for %s', (_label, row) => {
    expect(isLive(row)).toBe(false);
  });

  it('is false for a published row dated in the future', () => {
    /*
     * The case a `status === 'published'` check alone gets wrong. The
     * *_published_needs_date constraints require a date but not a PAST one, so
     * this row exists and the blog's `.lte('published_at', now)` filter refuses
     * to serve it. An admin link built on status alone would 404.
     */
    expect(isLive({ status: 'published', published_at: future })).toBe(false);
  });

  it('is false for a published row with no date at all', () => {
    // Shouldn't exist — the constraint forbids it — but this is read-side code
    // deciding whether to render a link, not a place to trust an invariant.
    expect(isLive({ status: 'published', published_at: null })).toBe(false);
  });
});
