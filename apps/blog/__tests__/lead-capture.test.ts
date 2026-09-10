import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The capture endpoint is the only route on the public blog that a visitor's
 * browser posts to, so what it accepts and what it hands back are worth pinning
 * directly.
 *
 * Two of these are security properties rather than behaviour. The download link
 * must be reachable only after a submission, and a caught bot must not be told
 * it was caught — both are the kind of thing a later refactor tidies away
 * because neither looks load-bearing.
 */

const rpc = vi.fn();
const getLeadMagnetBySlug = vi.fn();
const fetchMock = vi.fn();

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

vi.mock('@blog/core', () => ({
  getLeadMagnetBySlug: (...args: unknown[]) => getLeadMagnetBySlug(...args),
}));

vi.mock('@/lib/site', () => ({
  getSite: async () => ({ id: 'site-1', slug: 'demo', locale: 'en' }),
  getClient: () => ({ rpc: (...args: unknown[]) => rpc(...args) }),
}));

const { POST } = await import('../app/api/leads/route');

const MAGNET = {
  id: 'magnet-1',
  slug: 'equipment-financing-toolkit',
  name: 'Equipment Financing Toolkit',
  asset_url: 'https://files.example.com/toolkit.pdf',
};

function request(body: unknown) {
  return { json: async () => body } as unknown as Parameters<typeof POST>[0];
}

function submission(overrides: Record<string, unknown> = {}) {
  return {
    magnet: MAGNET.slug,
    email: 'reader@example.com',
    ...overrides,
  };
}

beforeEach(() => {
  rpc.mockReset().mockResolvedValue({ error: null });
  getLeadMagnetBySlug.mockReset().mockResolvedValue(MAGNET);
  fetchMock.mockReset().mockResolvedValue({ ok: true, status: 200 });

  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});

  delete process.env.LEAD_WEBHOOK_URL;
  delete process.env.LEAD_WEBHOOK_SECRET;
});

describe('POST /api/leads — validation', () => {
  it('rejects a body that is not JSON', async () => {
    const response = await POST({
      json: async () => {
        throw new Error('not json');
      },
    } as unknown as Parameters<typeof POST>[0]);

    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('rejects a submission naming no offer', async () => {
    const response = await POST(request({ email: 'reader@example.com' }));
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each(['', 'reader', 'reader@', '@example.com', 'reader example.com'])(
    'rejects %o as an email address',
    async (email) => {
      const response = await POST(request(submission({ email })));
      expect(response.status).toBe(400);
      expect(rpc).not.toHaveBeenCalled();
    },
  );

  it('404s for an offer that is not live', async () => {
    getLeadMagnetBySlug.mockResolvedValue(null);

    const response = await POST(request(submission()));

    expect(response.status).toBe(404);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('reports a database failure without repeating its message', async () => {
    rpc.mockResolvedValue({
      error: { message: 'duplicate key value violates unique constraint "leads_pkey"' },
    });

    const response = await POST(request(submission()));
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(500);
    expect(body.error).not.toContain('leads_pkey');
  });
});

describe('POST /api/leads — the honeypot', () => {
  /*
   * Answering 400 here would tell whoever is running the bot exactly which
   * field to stop filling in. A 200 with nothing written costs them the lead
   * and teaches them nothing.
   */
  it('answers 200 and writes nothing when the honeypot is filled', async () => {
    const response = await POST(request(submission({ company: 'Acme Inc' })));

    expect(response.status).toBe(200);
    expect(rpc).not.toHaveBeenCalled();
    expect(getLeadMagnetBySlug).not.toHaveBeenCalled();
  });

  it('does not hand back the download link to a caught bot', async () => {
    const response = await POST(request(submission({ company: 'Acme Inc' })));
    const body = (await response.json()) as { assetUrl: string | null };

    expect(body.assetUrl).toBeNull();
  });

  it('lets an empty honeypot through', async () => {
    const response = await POST(request(submission({ company: '' })));

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalled();
  });
});

describe('POST /api/leads — capture', () => {
  it('writes through the capture_lead function, not an insert', async () => {
    await POST(request(submission()));

    expect(rpc).toHaveBeenCalledWith('capture_lead', expect.anything());
  });

  it('passes the site slug from the server, not the request', async () => {
    await POST(request(submission({ site: 'somebody-elses-site' })));

    const [, args] = rpc.mock.calls[0] as [string, Record<string, unknown>];
    expect(args.p_site_slug).toBe('demo');
  });

  it('keeps only the standard campaign parameters', async () => {
    await POST(
      request(
        submission({
          utm: {
            utm_source: 'newsletter',
            evil: 'x'.repeat(5000),
          },
        }),
      ),
    );

    const [, args] = rpc.mock.calls[0] as [string, Record<string, unknown>];
    expect(args.p_utm).toEqual({ utm_source: 'newsletter' });
  });

  it('ignores a utm value that is not an object', async () => {
    await POST(request(submission({ utm: 'utm_source=newsletter' })));

    const [, args] = rpc.mock.calls[0] as [string, Record<string, unknown>];
    expect(args.p_utm).toEqual({});
  });

  it('returns the download link only after a successful capture', async () => {
    const response = await POST(request(submission()));
    const body = (await response.json()) as { ok: boolean; assetUrl: string };

    expect(body.ok).toBe(true);
    expect(body.assetUrl).toBe(MAGNET.asset_url);
  });

  it('succeeds for an offer with no file to hand back', async () => {
    getLeadMagnetBySlug.mockResolvedValue({ ...MAGNET, asset_url: null });

    const response = await POST(request(submission()));
    const body = (await response.json()) as { ok: boolean; assetUrl: string | null };

    expect(response.status).toBe(200);
    expect(body.assetUrl).toBeNull();
  });
});

describe('POST /api/leads — the webhook', () => {
  it('is skipped entirely when no URL is configured', async () => {
    await POST(request(submission()));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forwards the lead when one is configured', async () => {
    process.env.LEAD_WEBHOOK_URL = 'https://n8n.example.com/hook/leads';

    await POST(request(submission({ sourcePath: '/blog/equipment-loans/' })));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toBe('https://n8n.example.com/hook/leads');
    expect(JSON.parse(String(init.body))).toMatchObject({
      site: 'demo',
      magnet: MAGNET.slug,
      email: 'reader@example.com',
      sourcePath: '/blog/equipment-loans/',
    });
  });

  it('sends the shared secret only when one is set', async () => {
    process.env.LEAD_WEBHOOK_URL = 'https://n8n.example.com/hook/leads';
    await POST(request(submission()));

    let [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).not.toHaveProperty('x-webhook-secret');

    fetchMock.mockClear();
    process.env.LEAD_WEBHOOK_SECRET = 'shh';
    await POST(request(submission()));

    [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({ 'x-webhook-secret': 'shh' });
  });

  /*
   * The property that keeps a broken automation from looking like a broken
   * form. The row is already committed when the forward runs, so telling the
   * reader it failed would be false and would invite a resubmission.
   */
  it('still succeeds when the webhook is unreachable', async () => {
    process.env.LEAD_WEBHOOK_URL = 'https://n8n.example.com/hook/leads';
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const response = await POST(request(submission()));

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalled();
  });

  it('still succeeds when the webhook answers 500', async () => {
    process.env.LEAD_WEBHOOK_URL = 'https://n8n.example.com/hook/leads';
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    const response = await POST(request(submission()));
    expect(response.status).toBe(200);
  });

  it('does not forward a lead the database refused', async () => {
    process.env.LEAD_WEBHOOK_URL = 'https://n8n.example.com/hook/leads';
    rpc.mockResolvedValue({ error: { message: 'nope' } });

    await POST(request(submission()));

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
