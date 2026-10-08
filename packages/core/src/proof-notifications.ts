import type { Client } from './supabase';
import type {
  ProofCampaignRow,
  ProofCampaignTargetRow,
  ProofEventRow,
  TermRow,
} from './database.types';
import {
  isProofPresetIcon,
  proofPlace,
  type ProofCampaignPayload,
  type ProofImagePayload,
  type ProofPayload,
  type ProofTargetPayload,
} from './proof';
import { descendantTermIds } from './terms';
import { mediaPublicUrl } from './urls';

/**
 * Social-proof toasts: reading the tables and narrowing them for the browser.
 *
 * The matching rules live in proof.ts, which the reader's browser runs. This
 * half runs where the database is — the blog's /api/proof route at build and
 * revalidation time — and does the two things the browser cannot: resolve
 * storage paths to URLs (mediaPublicUrl reads a server-only variable) and
 * expand category rules over the taxonomy.
 */

interface MediaRef {
  storage_path: string;
  alt: string | null;
}

type EventWithImage = ProofEventRow & { image: MediaRef | null };

export interface ProofCampaignWithRelations extends ProofCampaignRow {
  image: MediaRef | null;
  targets: ProofCampaignTargetRow[];
  events: EventWithImage[];
}

/** PostgREST types a to-one embed as possibly-array; see listActiveLeadMagnets. */
function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

function imageOf(ref: MediaRef | null): ProofImagePayload | null {
  return ref ? { url: mediaPublicUrl(ref.storage_path), alt: ref.alt } : null;
}

/**
 * Turn one target row into what the browser matches against.
 *
 * Category rules carry their whole subtree, so a page filed under a child
 * category matches a rule on its parent without knowing the taxonomy.
 */
function toTargetPayload(
  target: ProofCampaignTargetRow,
  categories: readonly TermRow[],
): ProofTargetPayload | null {
  switch (target.scope) {
    case 'site':
      return { scope: 'site', exclude: target.exclude };
    case 'path':
      return target.pattern ? { scope: 'path', exclude: target.exclude, pattern: target.pattern } : null;
    case 'post':
      return target.post_id ? { scope: 'post', exclude: target.exclude, ids: [target.post_id] } : null;
    case 'tag':
      return target.term_id ? { scope: 'tag', exclude: target.exclude, ids: [target.term_id] } : null;
    case 'category':
      return target.term_id
        ? {
            scope: 'category',
            exclude: target.exclude,
            ids: descendantTermIds(categories, target.term_id),
          }
        : null;
    default:
      return null;
  }
}

/**
 * The subset of a campaign that crosses into the browser.
 *
 * Drops the internal `name`, the site uuid and the timestamps a reader has no
 * use for, and resolves every picture to a URL. Each event's picture is
 * decided here once — its own override, then its map, then the campaign's
 * custom image — so the toast never has to know the precedence.
 */
export function toProofCampaignPayload(
  campaign: ProofCampaignWithRelations,
  categories: readonly TermRow[] = [],
): ProofCampaignPayload {
  const mode = campaign.image_mode;
  const campaignImage = mode === 'custom' ? imageOf(campaign.image) : null;

  const events = [...campaign.events]
    .sort((a, b) => a.sort - b.sort || a.created_at.localeCompare(b.created_at))
    .map((event) => {
      const place = proofPlace(event);
      let image: ProofImagePayload | null = null;
      let isMap = false;

      if (mode !== 'none') {
        image = imageOf(event.image);
        if (!image && mode === 'map' && event.map_path) {
          image = { url: mediaPublicUrl(event.map_path), alt: place ? `Map of ${place}` : null };
          isMap = true;
        }
        if (!image) image = campaignImage;
      }

      return {
        name: event.name?.trim() || null,
        place,
        action: event.action,
        minutesAgo: [event.minutes_ago_min, event.minutes_ago_max] as [number, number],
        link: event.link_url,
        image,
        isMap,
      };
    });

  return {
    id: campaign.id,
    createdAt: campaign.created_at,
    template: campaign.template,
    imageMode: mode,
    presetIcon: isProofPresetIcon(campaign.preset_icon) ? campaign.preset_icon : 'fire',
    position: campaign.position,
    showOnMobile: campaign.show_on_mobile,
    initialDelayS: campaign.initial_delay_s,
    displayS: campaign.display_s,
    gapS: campaign.gap_s,
    maxPerView: campaign.max_per_view,
    repeat: campaign.repeat_events,
    frequency: campaign.frequency,
    showTimeAgo: campaign.show_time_ago,
    accent: campaign.accent,
    targets: campaign.targets
      .map((target) => toTargetPayload(target, categories))
      .filter((target): target is ProofTargetPayload => target !== null),
    events,
  };
}

/**
 * Every active campaign for a site, with its rules and events.
 *
 * The media embeds name their constraint. proof_events has foreign keys to
 * both proof_campaigns and media, which PostgREST can read as a second,
 * many-to-many route from a campaign to media — and a bare `image:media(…)`
 * would then be ambiguous. Naming the key is the fix 0011 anticipated.
 */
export async function listActiveProofCampaigns(
  client: Client,
  siteId: string,
): Promise<ProofCampaignWithRelations[]> {
  const { data, error } = await client
    .from('proof_campaigns')
    .select(
      '*, image:media!proof_campaigns_image_id_fkey(storage_path, alt), ' +
        'targets:proof_campaign_targets(*), ' +
        'events:proof_events(*, image:media!proof_events_image_id_fkey(storage_path, alt))',
    )
    .eq('site_id', siteId)
    .eq('active', true);

  if (error) {
    const drift = error.code === 'PGRST200' || error.code === 'PGRST205';
    throw new Error(
      `Failed to load social-proof campaigns: ${error.message}` +
        (drift
          ? '\n\nThe database is behind the code: apply ' +
            'supabase/migrations/0015_proof_notifications.sql, or reload the ' +
            "PostgREST schema cache with \"notify pgrst, 'reload schema';\"."
          : ''),
    );
  }

  type Raw = Omit<ProofCampaignWithRelations, 'image' | 'events'> & {
    image: MediaRef | MediaRef[] | null;
    events: (ProofEventRow & { image: MediaRef | MediaRef[] | null })[];
  };

  return ((data ?? []) as unknown as Raw[]).map((row) => ({
    ...row,
    image: one(row.image),
    targets: row.targets ?? [],
    events: (row.events ?? []).map((event) => ({ ...event, image: one(event.image) })),
  }));
}

/**
 * The whole payload the toasts fetch, for one site.
 *
 * The category query only runs when some rule is category-scoped, as in
 * getLeadMagnetForPost.
 */
export async function getProofPayload(client: Client, siteId: string): Promise<ProofPayload> {
  const campaigns = await listActiveProofCampaigns(client, siteId);

  let categories: TermRow[] = [];
  if (campaigns.some((c) => c.targets.some((t) => t.scope === 'category'))) {
    const { data, error } = await client
      .from('terms')
      .select('*')
      .eq('site_id', siteId)
      .eq('kind', 'category');
    if (error) throw new Error(`Failed to load categories: ${error.message}`);
    categories = (data ?? []) as TermRow[];
  }

  return {
    campaigns: campaigns
      .map((campaign) => toProofCampaignPayload(campaign, categories))
      .filter((campaign) => campaign.events.length > 0 && campaign.targets.length > 0),
  };
}
