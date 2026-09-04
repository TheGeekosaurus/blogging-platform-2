import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SiteRow } from '@blog/core';

/**
 * Site settings, and the two things about them that fail silently.
 *
 * Structured data saved here is emitted in the blog's ROOT LAYOUT, so it is on
 * every public route. That makes this the one settings field whose effect is
 * invisible in the admin, and it is why saveSettings has to refresh the live
 * site rather than only revalidatePath() its own cache.
 */

const site = {
  id: 'site-1',
  slug: 'demo',
  name: 'Demo',
  base_url: 'https://demo.test',
  locale: 'en',
} as SiteRow;

const captured: { update?: Record<string, unknown> } = {};
const revalidated: Array<{ baseUrl: string; target: unknown }> = [];

/** Flipped by a test to make the live-site refresh fail. */
let refreshOk = true;

vi.mock('@/lib/current-site', () => ({
  requireCurrentSite: async () => site,
  SITE_COOKIE: 'site',
}));

vi.mock('@/lib/revalidate', () => ({
  revalidateSite: async (target: SiteRow, what: unknown) => {
    revalidated.push({ baseUrl: target.base_url, target: what });
    return refreshOk ? { ok: true } : { ok: false, error: 'connection refused' };
  },
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => ({ set: vi.fn() }) }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: () => ({
      update: (row: Record<string, unknown>) => {
        captured.update = row;
        return { eq: async () => ({ error: null }) };
      },
    }),
  }),
}));

const { saveSettings } = await import('../app/actions/site');

function form(fields: Record<string, string>, snippets: string[] = []): FormData {
  const data = new FormData();
  const base = { name: 'Demo', base_url: 'https://demo.test', locale: 'en', ...fields };
  for (const [key, value] of Object.entries(base)) data.append(key, value);
  for (const snippet of snippets) data.append('structured_data', snippet);
  return data;
}

beforeEach(() => {
  delete captured.update;
  revalidated.length = 0;
  refreshOk = true;
});

describe('saveSettings — site-wide schema markup', () => {
  it('stores parsed nodes in order', async () => {
    await saveSettings({}, form({}, [
      '{"@type":"Organization","name":"Demo"}',
      '{"@type":"WebSite","url":"https://demo.test"}',
    ]));

    expect(captured.update?.structured_data).toEqual([
      { '@type': 'Organization', name: 'Demo' },
      { '@type': 'WebSite', url: 'https://demo.test' },
    ]);
  });

  it('stores an empty list when there are no snippets', async () => {
    await saveSettings({}, form({}));
    expect(captured.update?.structured_data).toEqual([]);
  });

  it('refuses the save on a malformed snippet, writing nothing', async () => {
    const result = await saveSettings({}, form({}, ['{"@type":"Organization",}']));

    expect(result.error).toMatch(/snippet 1/i);
    expect(captured.update).toBeUndefined();
  });

  it('validates before the base URL is written, not after', async () => {
    // Both wrong: the URL check must still win, because it is the one that
    // would take the whole site down.
    const result = await saveSettings({}, form({ base_url: 'not-a-url' }, ['nonsense']));

    expect(result.error).toMatch(/origin/i);
    expect(captured.update).toBeUndefined();
  });
});

describe('saveSettings — refreshing the live site', () => {
  it('flushes the whole site, not just the dashboard', async () => {
    /*
     * This call did not exist. Editing settings ended at revalidatePath('/',
     * 'layout'), which purges only the admin — so site-wide structured data
     * would have saved, reported success, and changed nothing a reader saw
     * until somebody happened to press "Flush cache".
     */
    await saveSettings({}, form({}, ['{"@type":"Organization","name":"Demo"}']));

    expect(revalidated).toHaveLength(1);
    expect(revalidated[0]!.target).toEqual({ type: 'site' });
  });

  it('flushes the NEW base URL when the base URL is what changed', async () => {
    // This is the form where base_url changes, so the stored value is the one
    // origin the purge definitely does not need to reach.
    await saveSettings({}, form({ base_url: 'https://moved.test' }));

    expect(revalidated[0]!.baseUrl).toBe('https://moved.test');
  });

  it('reports a save that could not reach the blog as a warning, not an error', async () => {
    // The row is already committed and is never rolled back: losing settings
    // because a cache purge failed would be worse than a stale page.
    refreshOk = false;

    const result = await saveSettings({}, form({}));

    expect(result.saved).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.warning).toMatch(/not refreshed/i);
    expect(result.warning).toMatch(/connection refused/);
    expect(captured.update).toBeDefined();
  });

  it('reports a clean save with no warning', async () => {
    const result = await saveSettings({}, form({}));

    expect(result).toEqual({ saved: true });
  });
});
