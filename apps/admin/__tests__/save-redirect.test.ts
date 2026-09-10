import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SiteRow } from '@blog/core';

/**
 * Redirects are the highest-consequence thing in this admin: a wrong rule does
 * not render badly, it makes a URL unreachable. These cover the shapes that
 * the table's own constraints cannot catch.
 */
const site = { id: 'site-1', slug: 'demo', base_url: 'https://demo.test' } as SiteRow;

const captured: { insert?: Record<string, unknown>; update?: Record<string, unknown> } = {};

/** Rows the action reads when checking for clashes, loops and chains. */
let existing: Array<{ id: string; from_path: string; to_path: string }> = [];

vi.mock('@/lib/current-site', () => ({ requireCurrentSite: async () => site }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: () => ({
      select: () => ({ eq: async () => ({ data: existing, error: null }) }),
      insert: async (row: Record<string, unknown>) => {
        captured.insert = row;
        return { error: null };
      },
      update: (row: Record<string, unknown>) => {
        captured.update = row;
        return { eq: () => ({ eq: async () => ({ error: null }) }) };
      },
      delete: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }),
    }),
  }),
}));

const { saveRedirect } = await import('../app/actions/redirects');

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.append(k, v);
  return data;
}

beforeEach(() => {
  delete captured.insert;
  delete captured.update;
  existing = [];
});

describe('saveRedirect — normalising what people actually paste', () => {
  it('strips the origin off a full URL in the source', async () => {
    // Copying the URL out of the address bar is the normal way to fill this in.
    await saveRedirect({}, form({
      from_path: 'https://old.example.com/some-post/',
      to_path: '/blog/some-post/',
    }));

    expect(captured.insert?.from_path).toBe('/some-post/');
  });

  it('adds a leading slash to a bare path', async () => {
    await saveRedirect({}, form({ from_path: 'some-post/', to_path: '/blog/some-post/' }));
    expect(captured.insert?.from_path).toBe('/some-post/');
  });

  it('collapses doubled slashes, which would never match a request', async () => {
    await saveRedirect({}, form({ from_path: '//old//post//', to_path: '/new/' }));
    expect(captured.insert?.from_path).toBe('/old/post/');
  });

  it('keeps a full URL as the DESTINATION', async () => {
    // Redirecting off-site is legitimate; only the source must be a local path.
    await saveRedirect({}, form({
      from_path: '/partner/',
      to_path: 'https://partner.example.com/landing/',
    }));

    expect(captured.insert?.to_path).toBe('https://partner.example.com/landing/');
  });

  it('defaults to 301 and rejects a code the constraint would refuse', async () => {
    await saveRedirect({}, form({ from_path: '/a/', to_path: '/b/', status_code: '418' }));
    expect(captured.insert?.status_code).toBe(301);
  });

  it('keeps a valid non-301 code', async () => {
    await saveRedirect({}, form({ from_path: '/a/', to_path: '/b/', status_code: '302' }));
    expect(captured.insert?.status_code).toBe(302);
  });
});

describe('saveRedirect — the rules that take a site down', () => {
  it('refuses to redirect the homepage', async () => {
    /*
     * The worst single rule available here. '/' matches everything upstream of
     * the router, so redirecting it takes the whole site off the internet, and
     * the table's constraints permit it.
     */
    const result = await saveRedirect({}, form({ from_path: '/', to_path: '/blog/' }));

    expect(result.error).toMatch(/homepage/i);
    expect(captured.insert).toBeUndefined();
  });

  it('refuses a rule that points at itself', async () => {
    const result = await saveRedirect({}, form({ from_path: '/a/', to_path: '/a/' }));
    expect(result.error).toMatch(/itself/i);
    expect(captured.insert).toBeUndefined();
  });

  it('refuses a two-hop loop', async () => {
    /*
     * The constraint only catches from === to. /a → /b plus /b → /a satisfies
     * both rows individually and hangs a browser between them — and it is
     * exactly what you create by fixing a redirect the wrong way round.
     */
    existing = [{ id: 'r1', from_path: '/b/', to_path: '/a/' }];

    const result = await saveRedirect({}, form({ from_path: '/a/', to_path: '/b/' }));

    expect(result.error).toMatch(/loop/i);
    expect(captured.insert).toBeUndefined();
  });

  it('refuses a chain and says where to point instead', async () => {
    // Legal but wasteful: an extra round trip, and Google follows limited hops.
    existing = [{ id: 'r1', from_path: '/b/', to_path: '/c/' }];

    const result = await saveRedirect({}, form({ from_path: '/a/', to_path: '/b/' }));

    expect(result.error).toMatch(/itself redirected/i);
    expect(result.error).toContain('/c/');
    expect(captured.insert).toBeUndefined();
  });

  it('names the existing rule when the source is already handled', async () => {
    existing = [{ id: 'r1', from_path: '/a/', to_path: '/z/' }];

    const result = await saveRedirect({}, form({ from_path: '/a/', to_path: '/b/' }));

    expect(result.error).toContain('/z/');
    expect(captured.insert).toBeUndefined();
  });

  it('lets a rule be edited without clashing with itself', async () => {
    existing = [{ id: 'r1', from_path: '/a/', to_path: '/z/' }];

    const result = await saveRedirect({}, form({ id: 'r1', from_path: '/a/', to_path: '/b/' }));

    expect(result.error).toBeUndefined();
    expect(captured.update?.to_path).toBe('/b/');
  });

  it('requires a destination', async () => {
    const result = await saveRedirect({}, form({ from_path: '/a/', to_path: '   ' }));
    expect(result.error).toMatch(/destination is required/i);
  });

  it('allows the homepage as a destination', async () => {
    // Sending a retired URL to '/' is the commonest redirect there is.
    const result = await saveRedirect({}, form({ from_path: '/old/', to_path: '/' }));

    expect(result.error).toBeUndefined();
    expect(captured.insert?.to_path).toBe('/');
  });
});
