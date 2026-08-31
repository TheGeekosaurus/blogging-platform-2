import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SiteRow } from '@blog/core';

/**
 * Pins the shape of the URL the admin calls.
 *
 * apps/blog sets `trailingSlash: true`, so `/api/revalidate` answers with a 308
 * redirect and only `/api/revalidate/` is the canonical endpoint. The route
 * handler's own tests invoke POST() directly and therefore cannot catch a
 * mismatch here — this is the test that does.
 */

const SECRET = 'shared-secret';

vi.mock('../lib/supabase/server', () => ({
  createClient: async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { revalidate_secret: SECRET }, error: null }),
        }),
      }),
    }),
  }),
}));

const { revalidateSite } = await import('../lib/revalidate');

const site = { id: 'site-1', base_url: 'https://myblog.com' } as SiteRow;

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, status: 200, text: async () => '' });
});

describe('revalidateSite', () => {
  it('calls the canonical trailing-slash endpoint', async () => {
    await revalidateSite(site, { type: 'post', slug: 'hello' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://myblog.com/api/revalidate/');
  });

  it('does not double up slashes when base_url has a trailing one', async () => {
    await revalidateSite({ ...site, base_url: 'https://myblog.com/' } as SiteRow, {
      type: 'site',
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://myblog.com/api/revalidate/');
  });

  it('sends the secret in the header and the target as the body', async () => {
    await revalidateSite(site, { type: 'post', slug: 'hello' });

    const init = fetchMock.mock.calls[0]?.[1];
    expect(init.method).toBe('POST');
    expect(init.headers['x-revalidate-secret']).toBe(SECRET);
    expect(JSON.parse(init.body)).toEqual({ type: 'post', slug: 'hello' });
  });

  it('reports a non-ok response rather than claiming success', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, text: async () => 'Unauthorized' });

    const result = await revalidateSite(site, { type: 'site' });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('401');
  });

  it('reports a network failure rather than throwing', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await revalidateSite(site, { type: 'site' });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('ECONNREFUSED');
  });
});
