import type {
  ProofFrequency,
  ProofImageMode,
  ProofPosition,
  ProofTargetScope,
  ProofTemplate,
} from './database.types';

/**
 * Social-proof toasts: the part that runs in the reader's browser.
 *
 * Pure and import-free on purpose. The blog's pages are static, so which
 * campaign a page shows is decided client-side against a payload fetched from
 * /api/proof — and a client component importing the `@blog/core` barrel would
 * drag the Supabase client and the HTML sanitiser into the bundle with it. This
 * file is exported on its own (`@blog/core/proof`) for that reason, and must
 * stay free of anything that touches env, the network or Node.
 *
 * The I/O half — reading the tables and narrowing rows into this payload — is
 * proof-notifications.ts.
 */

/** The icons a campaign can use when it has no picture of its own. */
export const PROOF_PRESET_ICONS = [
  'fire',
  'check',
  'cart',
  'star',
  'bell',
  'gift',
  'download',
  'user',
] as const;

export type ProofPresetIcon = (typeof PROOF_PRESET_ICONS)[number];

export function isProofPresetIcon(value: unknown): value is ProofPresetIcon {
  return typeof value === 'string' && (PROOF_PRESET_ICONS as readonly string[]).includes(value);
}

/**
 * One placement rule, as the browser gets it.
 *
 * Category rules arrive with `ids` already holding the category AND every
 * descendant, expanded on the server. That is the lead-magnet rule — a rule on
 * Financing reaches a post filed only under Equipment Financing — moved to the
 * other side of the wire, so the page only has to say which terms it is filed
 * under and never needs the taxonomy.
 */
export interface ProofTargetPayload {
  scope: ProofTargetScope;
  exclude: boolean;
  /** For `path`. */
  pattern?: string;
  /** For `category` (with descendants), `tag` and `post`. */
  ids?: string[];
}

export interface ProofImagePayload {
  url: string;
  alt: string | null;
}

export interface ProofEventPayload {
  /** Blank on the row renders as "Someone". */
  name: string | null;
  /** "San Diego, CA" — already joined. Null when none was given. */
  place: string | null;
  action: string;
  minutesAgo: [number, number];
  link: string | null;
  /**
   * The picture for THIS event, already resolved: its own override, else its
   * map in map mode, else the campaign's custom image. Null means fall back to
   * the preset icon — or nothing, in `none` mode.
   */
  image: ProofImagePayload | null;
  /** True when `image` is a generated OpenStreetMap map, which needs credit. */
  isMap: boolean;
}

export interface ProofCampaignPayload {
  id: string;
  createdAt: string;
  template: ProofTemplate;
  imageMode: ProofImageMode;
  presetIcon: ProofPresetIcon;
  position: ProofPosition;
  showOnMobile: boolean;
  initialDelayS: number;
  displayS: number;
  gapS: number;
  maxPerView: number;
  repeat: boolean;
  frequency: ProofFrequency;
  showTimeAgo: boolean;
  accent: string | null;
  targets: ProofTargetPayload[];
  events: ProofEventPayload[];
}

export interface ProofPayload {
  campaigns: ProofCampaignPayload[];
}

/**
 * What the page is.
 *
 * `termIds` holds the post's categories and tags together. Term ids are uuids
 * from one table, so the two cannot collide, and the target rows already say
 * which kind each rule is about.
 */
export interface ProofContext {
  path: string;
  postId?: string | null;
  termIds?: readonly string[];
}

/**
 * How tightly a rule was aimed. Highest wins — the lead-magnet ordering with
 * a path rule slotted in above site-wide: aiming at `/calculators/**` is a
 * statement about a section of the site, which is narrower than "everywhere"
 * and looser than naming the subject of an article.
 */
export const PROOF_SPECIFICITY: Record<ProofTargetScope, number> = {
  site: 0,
  path: 1,
  category: 2,
  tag: 3,
  post: 4,
};

/** Drop query and hash, and a trailing slash except on the root. */
export function normalizePath(path: string): string {
  let out = path.split(/[?#]/, 1)[0] ?? '';
  if (!out.startsWith('/')) out = `/${out}`;
  if (out.length > 1) out = out.replace(/\/+$/, '');
  return out || '/';
}

function escapeRegExp(text: string): string {
  return text.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Does a URL pattern match a path?
 *
 *   /pricing        exactly that page
 *   /blog/*         one segment below /blog — every post, not the index
 *   /blog/**        /blog and everything below it
 *   /*-calculator   `*` is any run of characters within one segment
 *
 * The syntax is rebelcalcv2's floating-card embed, so the same habits work in
 * both admins. Trailing slashes and query strings are ignored on both sides.
 */
export function pathMatches(pattern: string, path: string): boolean {
  const target = normalizePath(path);
  const raw = pattern.trim();
  if (!raw) return false;

  if (raw.endsWith('/**')) {
    const base = normalizePath(raw.slice(0, -3) || '/');
    if (base === '/') return true;
    if (target === base) return true;
    // The base itself may contain wildcards; match it as a prefix pattern.
    return new RegExp(`^${globToRegExp(base)}/.*$`).test(target);
  }

  return new RegExp(`^${globToRegExp(normalizePath(raw))}$`).test(target);
}

function globToRegExp(glob: string): string {
  return glob
    .split('**')
    .map((part) => part.split('*').map(escapeRegExp).join('[^/]*'))
    .join('.*');
}

function targetMatches(target: ProofTargetPayload, context: ProofContext): boolean {
  switch (target.scope) {
    case 'site':
      return true;
    case 'path':
      return target.pattern !== undefined && pathMatches(target.pattern, context.path);
    case 'post':
      return !!context.postId && (target.ids ?? []).includes(context.postId);
    case 'category':
    case 'tag': {
      const termIds = context.termIds ?? [];
      return (target.ids ?? []).some((id) => termIds.includes(id));
    }
    default:
      return false;
  }
}

/**
 * The campaign for this page, or null.
 *
 * One, not several, for the reason resolveLeadMagnet gives: two toasts
 * competing for the same corner read as noise. Any matching exclusion rule
 * takes a campaign out entirely, whatever else it matches — "everywhere except
 * the application form" has to mean that. Ties go to the oldest campaign, then
 * by id, so a new campaign does not quietly take over pages an existing one is
 * already running on.
 *
 * Campaigns with no events are skipped rather than winning and showing nothing.
 */
export function resolveProofCampaign<T extends Pick<ProofCampaignPayload, 'id' | 'createdAt' | 'targets' | 'events'>>(
  campaigns: readonly T[],
  context: ProofContext,
): T | null {
  let winner: T | null = null;
  let winnerScore = -1;

  for (const campaign of campaigns) {
    if (campaign.events.length === 0) continue;

    let excluded = false;
    let best: number | null = null;

    for (const target of campaign.targets) {
      if (!targetMatches(target, context)) continue;
      if (target.exclude) {
        excluded = true;
        break;
      }
      const score = PROOF_SPECIFICITY[target.scope];
      if (best === null || score > best) best = score;
    }

    if (excluded || best === null) continue;

    if (best > winnerScore) {
      winner = campaign;
      winnerScore = best;
      continue;
    }

    if (best === winnerScore && winner) {
      const older =
        campaign.createdAt < winner.createdAt ||
        (campaign.createdAt === winner.createdAt && campaign.id < winner.id);
      if (older) winner = campaign;
    }
  }

  return winner;
}

/** "San Diego, CA" from whatever parts were filled in. */
export function proofPlace(parts: {
  city?: string | null;
  region?: string | null;
  country?: string | null;
}): string | null {
  const city = parts.city?.trim();
  const region = parts.region?.trim();
  const country = parts.country?.trim();

  const pieces = city ? [city, region || country] : [region, country];
  const joined = pieces.filter(Boolean).join(', ');
  return joined || null;
}

/** "James from San Diego, CA", "Someone from Ohio", or just "James". */
export function proofHeadline(event: Pick<ProofEventPayload, 'name' | 'place'>): string {
  const name = event.name?.trim() || 'Someone';
  return event.place ? `${name} from ${event.place}` : name;
}

/** A whole number of minutes inside the range. `random` is injectable for tests. */
export function pickMinutesAgo(
  [min, max]: readonly [number, number],
  random: () => number = Math.random,
): number {
  const lo = Math.max(0, Math.floor(Math.min(min, max)));
  const hi = Math.max(lo, Math.floor(Math.max(min, max)));
  return lo + Math.floor(random() * (hi - lo + 1));
}

/** "just now", "7 min ago", "2 hr ago", "1 day ago", "4 days ago". */
export function formatMinutesAgo(minutes: number): string {
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}
