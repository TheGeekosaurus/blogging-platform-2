import sharp, { type OverlayOptions } from 'sharp';

/**
 * City maps for social-proof toasts, drawn once when a campaign is saved.
 *
 * OpenStreetMap, as chosen: free and keyless. Its two services are used the
 * way their usage policies ask —
 *
 *   * Nominatim (geocoding) gets an identifying User-Agent and at most one
 *     request a second, and only for places whose text changed since the last
 *     save.
 *   * The tile server is asked for at most four 256px tiles per new place, by
 *     this server, once. The result is stored in our own `media` bucket, so
 *     readers' browsers load our copy and never touch OSM — no per-visitor
 *     traffic to a volunteer-run service, and no third-party request on the
 *     public site.
 *
 * OSM's licence requires visible credit; the toast prints "© OpenStreetMap"
 * beside any map it shows (packages/core/src/proof-toast.tsx).
 */

const USER_AGENT = 'blogging-platform-admin/1.0 (social-proof city maps)';
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const TILES = 'https://tile.openstreetmap.org';

/** City-level: the coastline and the metro area, not street names. */
const ZOOM = 10;
/** Square output. Shown at 56–64 CSS px, so 256 is sharp on a 4x screen. */
const SIZE = 256;
const TILE = 256;

export interface Coordinates {
  lat: number;
  lng: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let lastGeocode = 0;

/** Lat/lng for a place string, or null if Nominatim has nothing. */
export async function geocode(place: string): Promise<Coordinates | null> {
  // One request a second, across calls in this process.
  const wait = lastGeocode + 1100 - Date.now();
  if (wait > 0) await sleep(wait);
  lastGeocode = Date.now();

  const url = `${NOMINATIM}?format=jsonv2&limit=1&q=${encodeURIComponent(place)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`geocoding answered ${res.status}`);

  const results = (await res.json()) as Array<{ lat?: string; lon?: string }>;
  const first = results[0];
  if (!first?.lat || !first.lon) return null;

  const lat = Number(first.lat);
  const lng = Number(first.lon);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

/** World pixel coordinates at ZOOM (Web Mercator, as the tiles are drawn). */
function worldPixel({ lat, lng }: Coordinates): { x: number; y: number } {
  const scale = TILE * 2 ** ZOOM;
  const sin = Math.min(Math.max(Math.sin((lat * Math.PI) / 180), -0.9999), 0.9999);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

async function fetchTile(x: number, y: number): Promise<Buffer> {
  const max = 2 ** ZOOM;
  const wrappedX = ((x % max) + max) % max;
  const res = await fetch(`${TILES}/${ZOOM}/${wrappedX}/${y}.png`, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`map tile answered ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/** A map pin, its tip at the bottom centre of the box. */
const PIN = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="58" viewBox="0 0 44 58">
    <path d="M22 56C22 56 4 34.5 4 21.5a18 18 0 0 1 36 0C40 34.5 22 56 22 56z"
      fill="#ef4444" stroke="#ffffff" stroke-width="3"/>
    <circle cx="22" cy="21.5" r="7" fill="#ffffff"/>
  </svg>`,
);

/** A square webp of the area around a point, with a pin on it. */
export async function renderMap(point: Coordinates): Promise<Buffer> {
  const { x, y } = worldPixel(point);
  const left = Math.round(x - SIZE / 2);
  const top = Math.round(y - SIZE / 2);

  const tx0 = Math.floor(left / TILE);
  const ty0 = Math.floor(top / TILE);
  const tx1 = Math.floor((left + SIZE - 1) / TILE);
  const ty1 = Math.floor((top + SIZE - 1) / TILE);

  const tiles: OverlayOptions[] = [];
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      tiles.push({
        input: await fetchTile(tx, ty),
        left: (tx - tx0) * TILE,
        top: (ty - ty0) * TILE,
      });
    }
  }

  const stitched = await sharp({
    create: {
      width: (tx1 - tx0 + 1) * TILE,
      height: (ty1 - ty0 + 1) * TILE,
      channels: 3,
      background: '#e5e7eb',
    },
  })
    .composite(tiles)
    .png()
    .toBuffer();

  return sharp(stitched)
    .extract({ left: left - tx0 * TILE, top: top - ty0 * TILE, width: SIZE, height: SIZE })
    .composite([{ input: PIN, left: SIZE / 2 - 22, top: SIZE / 2 - 56 }])
    .webp({ quality: 82 })
    .toBuffer();
}

/**
 * Where a map is stored. Rounded to two decimals (about a kilometre), so every
 * event in one city shares one file, and under the site's own folder because
 * the bucket's write policy is keyed on it (0003_storage.sql).
 */
export function mapStoragePath(siteId: string, point: Coordinates): string {
  return `${siteId}/proof-maps/${point.lat.toFixed(2)}_${point.lng.toFixed(2)}.webp`;
}
