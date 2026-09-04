import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The revalidation endpoint is the only unauthenticated write-ish surface on the
 * public blog, so its auth check is worth testing directly.
 */

const revalidatePath = vi.fn();
vi.mock('next/cache', () => ({ revalidatePath: (...args: unknown[]) => revalidatePath(...args) }));

// Minimal stand-in for NextResponse.json — the route only uses that one helper.
vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

const { POST } = await import('../app/api/revalidate/route');

const SECRET = 'correct-horse-battery-staple';

function request(body: unknown, secret?: string) {
  return {
    headers: { get: (name: string) => (name === 'x-revalidate-secret' ? secret ?? null : null) },
    json: async () => body,
  } as unknown as Parameters<typeof POST>[0];
}

beforeEach(() => {
  revalidatePath.mockClear();
  process.env.REVALIDATE_SECRET = SECRET;
});

describe('POST /api/revalidate — authentication', () => {
  it('rejects a request with no secret', async () => {
    const response = await POST(request({ type: 'site' }));
    expect(response.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('rejects a wrong secret', async () => {
    const response = await POST(request({ type: 'site' }, 'wrong'));
    expect(response.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('rejects a secret that is a prefix of the real one', async () => {
    const response = await POST(request({ type: 'site' }, SECRET.slice(0, -1)));
    expect(response.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('accepts the correct secret', async () => {
    const response = await POST(request({ type: 'site' }, SECRET));
    expect(response.status).toBe(200);
  });

  it('fails closed when the deployment has no secret configured', async () => {
    delete process.env.REVALIDATE_SECRET;
    const response = await POST(request({ type: 'site' }, SECRET));
    expect(response.status).toBe(500);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe('POST /api/revalidate — targets', () => {
  it('invalidates the whole tree for a site target', async () => {
    await POST(request({ type: 'site' }, SECRET));
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });

  it('invalidates the post, index and archives for a post target', async () => {
    await POST(request({ type: 'post', slug: 'hello-world' }, SECRET));

    const calls = revalidatePath.mock.calls.map((call) => call[0]);
    // Posts live under /blog now; '/' is still purged because the homepage
    // falls back to a post list when no homepage page is set.
    expect(calls).toContain('/blog/hello-world');
    expect(calls).toContain('/blog');
    expect(calls).toContain('/');
    expect(calls).toContain('/blog/categories');
    expect(calls).toContain('/sitemap.xml');
    expect(calls).toContain('/feed.xml');
    // The homepage candidate lists posts and is force-static with no timer, so
    // leaving it out would strand it on build-time content with no way to flush.
    expect(calls).toContain('/home-v2');

    // Dynamic-route form, so every generated page of those routes is dropped —
    // a new post changes pagination and archive membership.
    expect(revalidatePath).toHaveBeenCalledWith('/blog/page/[page]', 'page');
    expect(revalidatePath).toHaveBeenCalledWith('/blog/category/[slug]', 'page');
    expect(revalidatePath).toHaveBeenCalledWith('/blog/tag/[slug]', 'page');
  });

  it('rejects a post target with no slug', async () => {
    const response = await POST(request({ type: 'post' }, SECRET));
    expect(response.status).toBe(400);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('invalidates a page and the catch-all route for a page target', async () => {
    await POST(request({ type: 'page', path: 'projects/solar' }, SECRET));

    const calls = revalidatePath.mock.calls.map((call) => call[0]);
    expect(calls).toContain('/projects/solar');
    expect(calls).toContain('/');
    expect(calls).toContain('/sitemap.xml');

    // Re-parenting moves a whole subtree, so the catch-all is dropped wholesale
    // rather than enumerating descendants from the blog app.
    expect(revalidatePath).toHaveBeenCalledWith('/[...path]', 'page');
  });

  it('rejects a page target with no path', async () => {
    const response = await POST(request({ type: 'page' }, SECRET));
    expect(response.status).toBe(400);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('rejects an unknown target type', async () => {
    const response = await POST(request({ type: 'nonsense' }, SECRET));
    expect(response.status).toBe(400);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('rejects a body that is not JSON', async () => {
    const bad = {
      headers: { get: () => SECRET },
      json: async () => {
        throw new Error('not json');
      },
    } as unknown as Parameters<typeof POST>[0];

    const response = await POST(bad);
    expect(response.status).toBe(400);
  });
});
