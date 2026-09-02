import { afterEach, describe, expect, it } from 'vitest';

import { mediaPublicUrl } from '../urls';

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
