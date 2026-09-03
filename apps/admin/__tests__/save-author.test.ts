import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SiteRow } from '@blog/core';

/**
 * What saveAuthor actually hands the database.
 *
 * The interesting field is `social`: those five URLs end up in hrefs, so the
 * filtering has to happen on the way in and not only at render time. Asserting
 * on the captured row rather than on the return value is the same approach
 * save-post.test.ts takes, and for the same reason — the row is the thing that
 * outlives the request.
 */

const site = {
  id: 'site-1',
  slug: 'demo',
  base_url: 'https://demo.test',
  locale: 'en',
} as SiteRow;

const captured: { insert?: Record<string, unknown>; update?: Record<string, unknown> } = {};

vi.mock('@/lib/current-site', () => ({
  requireCurrentSite: async () => site,
}));

vi.mock('@/lib/revalidate', () => ({
  revalidateSite: async () => ({ ok: true }),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: () => ({
      insert: (row: Record<string, unknown>) => {
        captured.insert = row;
        return {
          select: () => ({ single: async () => ({ data: { id: 'new-author' }, error: null }) }),
        };
      },
      update: (row: Record<string, unknown>) => {
        captured.update = row;
        return { eq: () => ({ eq: async () => ({ error: null }) }) };
      },
    }),
  }),
}));

const { saveAuthor } = await import('../app/actions/authors');

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

beforeEach(() => {
  delete captured.insert;
  delete captured.update;
});

describe('saveAuthor', () => {
  it('derives the slug from the name when none is given', async () => {
    await saveAuthor({}, form({ name: 'Denis Beaulieu' }));
    expect(captured.insert?.slug).toBe('denis-beaulieu');
  });

  it('normalises a slug that was typed by hand', async () => {
    await saveAuthor({}, form({ name: 'Denis', slug: 'Denis B' }));
    expect(captured.insert?.slug).toBe('denis-b');
  });

  it('refuses an empty name without touching the database', async () => {
    const result = await saveAuthor({}, form({ name: '   ' }));
    expect(result.error).toBeTruthy();
    expect(captured.insert).toBeUndefined();
  });

  it('stores blank optional fields as null, not empty strings', async () => {
    // A nullable FK rejects '' as a malformed uuid, and an empty bio should read
    // as absent rather than as a bio that happens to be empty.
    await saveAuthor({}, form({ name: 'Denis', bio: '  ', avatar_id: '' }));
    expect(captured.insert?.bio).toBeNull();
    expect(captured.insert?.avatar_id).toBeNull();
  });

  it('keeps the http(s) social links it was given', async () => {
    await saveAuthor(
      {},
      form({
        name: 'Denis',
        social_facebook: 'https://facebook.com/nanotom',
        social_x: 'http://x.com/nanotom',
      }),
    );
    expect(captured.insert?.social).toEqual({
      facebook: 'https://facebook.com/nanotom',
      x: 'http://x.com/nanotom',
    });
  });

  /*
   * The one that matters. A stored `javascript:` URL rendered into an href is a
   * scripting vector, not a broken link.
   */
  it('drops a social value that is not an http(s) URL', async () => {
    await saveAuthor(
      {},
      form({
        name: 'Denis',
        social_facebook: 'javascript:alert(1)',
        social_instagram: 'data:text/html,<script>x</script>',
        social_youtube: 'example.com/no-scheme',
        social_linkedin: 'https://linkedin.com/in/ok',
      }),
    );
    expect(captured.insert?.social).toEqual({ linkedin: 'https://linkedin.com/in/ok' });
  });

  it('omits an untouched platform rather than storing an empty string', async () => {
    await saveAuthor({}, form({ name: 'Denis', social_facebook: '' }));
    expect(captured.insert?.social).toEqual({});
  });

  it('updates rather than inserts when an id is present', async () => {
    await saveAuthor({}, form({ id: 'a1', name: 'Denis' }));
    expect(captured.update?.name).toBe('Denis');
    expect(captured.insert).toBeUndefined();
  });

  it('always scopes the row to the current site', async () => {
    await saveAuthor({}, form({ name: 'Denis' }));
    expect(captured.insert?.site_id).toBe('site-1');
  });
});
