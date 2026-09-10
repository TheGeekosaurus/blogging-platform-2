import { indexNowKey } from '@/lib/indexnow';

/**
 * The IndexNow key file.
 *
 * The protocol requires the key to be retrievable from the host it is
 * submitted for — that is the whole proof of ownership. The spec's default
 * location is /<key>.txt at the root, which would need a catch-all route and
 * would collide with the pages catch-all this app already has at '/'. So it is
 * served here at a fixed path and named explicitly via `keyLocation` in the
 * submission, which the protocol supports for exactly this reason.
 *
 * 404 when no key is configured. Serving an empty file would make ownership
 * verification fail in a way that looks like a content problem rather than a
 * missing setting.
 */
export const dynamic = 'force-static';

export async function GET() {
  const key = indexNowKey();

  if (!key) {
    return new Response('IndexNow is not configured for this deployment.\n', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  return new Response(`${key}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      // Immutable in practice: the key changes only when someone rotates it,
      // and a stale copy would fail verification, so keep it short.
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
