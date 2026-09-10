import { NextResponse, type NextRequest } from 'next/server';

import { getLeadMagnetBySlug } from '@blog/core';

import { getClient, getSite } from '@/lib/site';

/**
 * Lead capture.
 *
 * The blog's second route handler, and the only one a visitor's browser calls.
 * Everything else here is prerendered — this is the one place the public site
 * writes anything.
 *
 * WHAT IT DOES NOT DO: send email. There is no mail transport anywhere in this
 * codebase and adding one would put deliverability, bounce handling,
 * unsubscribe links and a sender reputation on the critical path of a form
 * submission. Instead the lead is stored and forwarded to a webhook, and
 * whatever is on the other end of it — n8n, a Supabase function, a CRM — owns
 * delivery. That split is deliberate: the row is committed before the forward
 * is attempted, so a broken automation loses the follow-up email, never the
 * lead.
 */

export const dynamic = 'force-dynamic';

/** Long enough for any real value, short enough that nothing here is a payload. */
const MAX = { email: 320, name: 120, path: 512, referrer: 1024 } as const;

function readString(value: unknown, limit: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, limit);
}

/**
 * Campaign parameters, re-validated here rather than trusted from the client.
 *
 * The browser reads these off its own URL, so they are as forgeable as any
 * other field in the body. This does not make them trustworthy — nothing can —
 * it keeps a jsonb column from accumulating arbitrary keys and megabyte values
 * because someone pointed a script at the endpoint.
 */
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

function readUtm(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  const input = value as Record<string, unknown>;
  const out: Record<string, string> = {};

  for (const key of UTM_KEYS) {
    const entry = readString(input[key], 200);
    if (entry) out[key] = entry;
  }

  return out;
}

/*
 * Deliberately loose, and it is not the real check.
 *
 * `capture_lead` applies the same rule in SQL, which is the one that counts —
 * it is the only write path and it runs whether or not this handler is the
 * caller. This copy exists to give a typo a useful message instead of a
 * database error, so it should reject only what is unambiguously not an
 * address. Anything stricter starts refusing valid ones.
 */
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

interface Body {
  magnet?: unknown;
  email?: unknown;
  name?: unknown;
  company?: unknown;
  sourcePath?: unknown;
  referrer?: unknown;
  utm?: unknown;
}

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 });
  }

  /*
   * The honeypot, checked first and answered with a 200.
   *
   * Telling a bot it was caught is free tuning data for whoever is running it.
   * A success response with nothing written costs them a lead they never get
   * and tells them nothing. Nothing reaches the database on this path.
   */
  if (readString(body.company, 200) !== null) {
    return NextResponse.json({ ok: true, assetUrl: null });
  }

  const magnetSlug = readString(body.magnet, 120);
  const email = readString(body.email, MAX.email);

  if (!magnetSlug) {
    return NextResponse.json({ error: 'No offer was named.' }, { status: 400 });
  }

  if (!email || !EMAIL.test(email)) {
    return NextResponse.json(
      { error: 'That does not look like an email address.' },
      { status: 400 },
    );
  }

  const site = await getSite();
  const client = getClient();

  /*
   * Read the magnet before writing, for the asset URL — which is the reason
   * this lookup exists at all. It is not in the card's props (see
   * LeadMagnetOffer in @blog/core), so this is where the reader finally
   * learns it.
   */
  const magnet = await getLeadMagnetBySlug(client, site.id, magnetSlug);

  if (!magnet) {
    return NextResponse.json(
      { error: 'That offer is no longer available.' },
      { status: 404 },
    );
  }

  const name = readString(body.name, MAX.name);
  const sourcePath = readString(body.sourcePath, MAX.path);
  const referrer = readString(body.referrer, MAX.referrer);
  const utm = readUtm(body.utm);

  /*
   * An RPC, not an insert. The anon key this deployment holds has no write
   * grant on `leads` and must not be given one — see the security model in the
   * README. `capture_lead` is security definer and re-checks the site, the
   * magnet and the address itself, so this handler is a convenience layer over
   * it rather than the thing enforcing the rules.
   */
  const { error } = await client.rpc('capture_lead', {
    p_site_slug: site.slug,
    p_magnet_slug: magnet.slug,
    p_email: email,
    p_name: name,
    p_source_path: sourcePath,
    p_referrer: referrer,
    p_utm: utm,
  });

  if (error) {
    // Logged in full, reported in outline: the database's message can name
    // columns and constraints, and none of that belongs in a reader's browser.
    console.error('capture_lead failed', error);
    return NextResponse.json(
      { error: 'That did not go through. Try again in a moment.' },
      { status: 500 },
    );
  }

  await forward({
    site: site.slug,
    magnet: magnet.slug,
    magnetName: magnet.name,
    email,
    name,
    sourcePath,
    referrer,
    utm,
    capturedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, assetUrl: magnet.asset_url });
}

/**
 * Hand the lead to whatever sends the file.
 *
 * Three properties this has to have, in order:
 *
 *   It cannot fail the request. The lead is already committed by the time this
 *   runs, and returning an error now would tell a reader their submission did
 *   not work when it did — and invite them to submit again.
 *
 *   It cannot hang. A five-second ceiling, because the reader is watching a
 *   spinner until this resolves.
 *
 *   It has to be optional. With LEAD_WEBHOOK_URL unset the feature still works
 *   end to end: the lead is stored and, where the offer has one, the download
 *   link comes straight back. That is the configuration to launch in and wire
 *   the automation up afterwards.
 *
 * Not awaited in the background instead, deliberately: a serverless function
 * can be frozen the moment it responds, so a fire-and-forget fetch here is a
 * fetch that sometimes does not happen. Five seconds of latency is the price
 * of the forward actually being made.
 */
async function forward(payload: Record<string, unknown>): Promise<void> {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) return;

  const secret = process.env.LEAD_WEBHOOK_SECRET;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // A shared secret rather than a signature: the receiver is an
        // automation tool with a header-auth box, not a service that can
        // verify an HMAC. It is only meaningful over HTTPS, which is the same
        // condition the revalidate secret already relies on.
        ...(secret ? { 'x-webhook-secret': secret } : {}),
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      console.error(`Lead webhook returned ${response.status}`);
    }
  } catch (cause) {
    // Swallowed on purpose. The lead is safe in Postgres and can be exported
    // from the admin; this log is how the missing automation gets noticed.
    console.error('Lead webhook failed', cause);
  }
}
