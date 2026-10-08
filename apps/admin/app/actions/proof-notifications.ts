'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  MEDIA_BUCKET,
  isProofPresetIcon,
  type ProofCampaignRow,
  type ProofEventRow,
  type ProofFrequency,
  type ProofImageMode,
  type ProofPosition,
  type ProofTargetScope,
  type ProofTemplate,
} from '@blog/core';

import { requireCurrentSite } from '@/lib/current-site';
import { geocode, mapStoragePath, renderMap } from '@/lib/proof-map';
import { revalidateSite } from '@/lib/revalidate';
import { createClient } from '@/lib/supabase/server';

export interface ProofCampaignState {
  error?: string;
  savedId?: string;
  /** Saved, but the live site was not told. See LeadMagnetState. */
  staleWarning?: string;
  /** Saved, but some events have no map. They show the preset icon instead. */
  mapWarning?: string;
}

/**
 * One event row as the form posts it, inside the `events_json` field.
 *
 * JSON rather than numbered form fields: the list is reordered, added to and
 * pasted into on the client, and a stable array is far easier to keep honest
 * than renumbering `event_3_city` inputs.
 */
export interface ProofEventInput {
  id?: string;
  name: string;
  city: string;
  region: string;
  country: string;
  action: string;
  minutesMin: number;
  minutesMax: number;
  link: string;
  imageId: string | null;
}

const TEMPLATES: readonly ProofTemplate[] = ['pill', 'card'];
const IMAGE_MODES: readonly ProofImageMode[] = ['none', 'preset', 'custom', 'map'];
const POSITIONS: readonly ProofPosition[] = ['bottom-left', 'bottom-right', 'top-left', 'top-right'];
const FREQUENCIES: readonly ProofFrequency[] = ['every_page', 'once_per_session'];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MINUTES_CAP = 60 * 24 * 365;
/**
 * New places geocoded per save. Nominatim allows one request a second, so this
 * bounds a save at about half a minute; the rest are mapped by the next save.
 */
const MAX_NEW_MAPS = 25;

function pick<T extends string>(value: FormDataEntryValue | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function int(value: FormDataEntryValue | null, fallback: number, min: number, max: number): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * A pasted line into a path pattern. Accepts a full URL from the address bar
 * and keeps only its path, because that is what people will paste.
 */
function readPattern(line: string): string | null {
  let pattern = line.trim();
  if (!pattern) return null;
  if (/^https?:\/\//i.test(pattern)) {
    try {
      pattern = new URL(pattern).pathname;
    } catch {
      return null;
    }
  }
  if (!pattern.startsWith('/')) pattern = `/${pattern}`;
  return pattern.slice(0, 200);
}

function readPatterns(formData: FormData, field: string): string[] {
  const lines = String(formData.get(field) ?? '').split(/\r?\n/);
  return [...new Set(lines.map(readPattern).filter((p): p is string => p !== null))];
}

type TargetInsert = {
  scope: ProofTargetScope;
  exclude: boolean;
  term_id: string | null;
  post_id: string | null;
  pattern: string | null;
};

/** Scope comes from which field a value arrived in, never from the browser. */
function readTargets(formData: FormData): TargetInsert[] {
  const out: TargetInsert[] = [];
  const row = (t: Partial<TargetInsert> & Pick<TargetInsert, 'scope'>): TargetInsert => ({
    exclude: false,
    term_id: null,
    post_id: null,
    pattern: null,
    ...t,
  });

  if (formData.get('target_site') === 'on') out.push(row({ scope: 'site' }));
  for (const id of formData.getAll('target_category')) out.push(row({ scope: 'category', term_id: String(id) }));
  for (const id of formData.getAll('target_tag')) out.push(row({ scope: 'tag', term_id: String(id) }));
  for (const id of formData.getAll('target_post')) out.push(row({ scope: 'post', post_id: String(id) }));
  for (const pattern of readPatterns(formData, 'include_paths')) out.push(row({ scope: 'path', pattern }));
  for (const pattern of readPatterns(formData, 'exclude_paths')) {
    out.push(row({ scope: 'path', pattern, exclude: true }));
  }

  return out;
}

/** Parse and validate the posted event list. Returns an error message or rows. */
function readEvents(formData: FormData): ProofEventInput[] | string {
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get('events_json') ?? '[]'));
  } catch {
    return 'The event list could not be read. Reload the page and try again.';
  }
  if (!Array.isArray(raw)) return 'The event list could not be read.';

  const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const out: ProofEventInput[] = [];

  for (const [index, item] of raw.entries()) {
    if (!item || typeof item !== 'object') continue;
    const e = item as Record<string, unknown>;

    const event: ProofEventInput = {
      id: typeof e.id === 'string' && UUID.test(e.id) ? e.id : undefined,
      name: text(e.name).slice(0, 80),
      city: text(e.city).slice(0, 80),
      region: text(e.region).slice(0, 80),
      country: text(e.country).slice(0, 80),
      action: text(e.action).slice(0, 200),
      minutesMin: Math.min(MINUTES_CAP, Math.max(0, Math.round(Number(e.minutesMin) || 0))),
      minutesMax: Math.min(MINUTES_CAP, Math.max(0, Math.round(Number(e.minutesMax) || 0))),
      link: text(e.link).slice(0, 500),
      imageId: typeof e.imageId === 'string' && UUID.test(e.imageId) ? e.imageId : null,
    };

    // A row left completely empty is a row the editor added and abandoned.
    if (!event.name && !event.city && !event.region && !event.country && !event.action) continue;

    if (!event.action) {
      return `Event ${index + 1} needs an action — what did they do?`;
    }
    if (event.link && !/^(https?:\/\/|\/)/i.test(event.link)) {
      return `Event ${index + 1}: a link starts with https:// or with / for a page on this site.`;
    }
    if (event.link.startsWith('//')) {
      return `Event ${index + 1}: a link starts with https:// or with a single /.`;
    }
    if (event.minutesMax < event.minutesMin) {
      [event.minutesMin, event.minutesMax] = [event.minutesMax, event.minutesMin];
    }

    out.push(event);
  }

  return out;
}

function describeError(message: string): string {
  if (message.includes('proof_campaigns_name_present')) {
    return 'Give the campaign a name so you can find it in this list.';
  }
  if (message.includes('proof_campaigns_accent_hex')) return 'The colour has to be a #rrggbb value.';
  if (message.includes('proof_events_link_safe')) {
    return 'A link starts with https:// or with / for a page on this site.';
  }
  if (message.includes('proof_campaign_targets_pattern_rooted')) return 'URL patterns start with /.';
  return message;
}

type MapFields = Pick<ProofEventRow, 'lat' | 'lng' | 'map_path' | 'map_place'>;

const NO_MAP: MapFields = { lat: null, lng: null, map_path: null, map_place: null };

export async function saveProofCampaign(
  _prev: ProofCampaignState,
  formData: FormData,
): Promise<ProofCampaignState> {
  const site = await requireCurrentSite();
  const supabase = await createClient();

  const id = String(formData.get('id') ?? '').trim() || null;
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return { error: 'Give the campaign a name so you can find it in this list.' };

  const events = readEvents(formData);
  if (typeof events === 'string') return { error: events };

  const accent = String(formData.get('accent') ?? '').trim();
  const presetIcon = String(formData.get('preset_icon') ?? '');
  const imageMode = pick(formData.get('image_mode'), IMAGE_MODES, 'preset');

  const row: Omit<ProofCampaignRow, 'id' | 'created_at' | 'updated_at'> = {
    site_id: site.id,
    name,
    template: pick(formData.get('template'), TEMPLATES, 'pill'),
    image_mode: imageMode,
    preset_icon: isProofPresetIcon(presetIcon) ? presetIcon : 'fire',
    image_id: String(formData.get('image_id') ?? '').trim() || null,
    position: pick(formData.get('position'), POSITIONS, 'bottom-left'),
    show_on_mobile: formData.get('show_on_mobile') === 'on',
    initial_delay_s: int(formData.get('initial_delay_s'), 5, 0, 600),
    display_s: int(formData.get('display_s'), 6, 2, 60),
    gap_s: int(formData.get('gap_s'), 8, 0, 600),
    max_per_view: int(formData.get('max_per_view'), 5, 1, 50),
    repeat_events: formData.get('repeat_events') === 'on',
    frequency: pick(formData.get('frequency'), FREQUENCIES, 'every_page'),
    show_time_ago: formData.get('show_time_ago') === 'on',
    accent: /^#[0-9a-f]{6}$/i.test(accent) ? accent.toLowerCase() : null,
    active: formData.get('active') === 'on',
  };

  let campaignId = id;

  if (id) {
    const { error } = await supabase
      .from('proof_campaigns')
      .update(row)
      .eq('id', id)
      .eq('site_id', site.id);
    if (error) return { error: describeError(error.message) };
  } else {
    const { data, error } = await supabase.from('proof_campaigns').insert(row).select('id').single();
    if (error) return { error: describeError(error.message) };
    campaignId = data.id;
  }

  if (!campaignId) return { error: 'Saved, but the campaign came back without an id.' };

  // ---- Targets: replaced wholesale, as lead-magnet targeting is. ----------
  const { error: clearTargets } = await supabase
    .from('proof_campaign_targets')
    .delete()
    .eq('campaign_id', campaignId);
  if (clearTargets) return { error: `Could not update targeting: ${clearTargets.message}` };

  const targets = readTargets(formData);
  if (targets.length > 0) {
    const { error } = await supabase
      .from('proof_campaign_targets')
      .insert(targets.map((t) => ({ ...t, campaign_id: campaignId })));
    if (error) return { error: describeError(`Could not update targeting: ${error.message}`) };
  }

  // ---- Events, with maps carried over where the place did not change. -----
  const { data: existing, error: existingError } = await supabase
    .from('proof_events')
    .select('id, lat, lng, map_path, map_place')
    .eq('campaign_id', campaignId);
  if (existingError) return { error: `Could not read the events: ${existingError.message}` };

  // Maps already drawn for this campaign, by the place they were drawn for.
  const known = new Map<string, MapFields>();
  for (const e of existing ?? []) {
    if (e.map_place && e.map_path) known.set(e.map_place, e);
  }

  const mapFailures: string[] = [];
  let newMaps = 0;

  async function mapFor(place: string | null): Promise<MapFields> {
    if (!place) return NO_MAP;
    const hit = known.get(place);
    if (hit) return hit;
    // Only draw new maps when the campaign shows them.
    if (imageMode !== 'map') return NO_MAP;
    if (newMaps >= MAX_NEW_MAPS) {
      mapFailures.push(`${place} (save again to map the rest)`);
      return NO_MAP;
    }
    newMaps += 1;

    try {
      const point = await geocode(place);
      if (!point) {
        mapFailures.push(`${place} (place not found)`);
        return NO_MAP;
      }
      const path = mapStoragePath(site.id, point);
      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, await renderMap(point), { contentType: 'image/webp', upsert: true });
      if (error) throw new Error(error.message);

      const fields: MapFields = { lat: point.lat, lng: point.lng, map_path: path, map_place: place };
      known.set(place, fields);
      return fields;
    } catch (error) {
      mapFailures.push(`${place} (${error instanceof Error ? error.message : 'failed'})`);
      return NO_MAP;
    }
  }

  const eventRows = [];
  for (const [sort, e] of events.entries()) {
    // The full place, country included, is what gets geocoded and remembered:
    // "Portland, OR" and "Portland, ME" are different maps.
    const place = [e.city, e.region, e.country].filter(Boolean).join(', ') || null;
    eventRows.push({
      ...(e.id ? { id: e.id } : {}),
      campaign_id: campaignId,
      site_id: site.id,
      sort,
      name: e.name || null,
      city: e.city || null,
      region: e.region || null,
      country: e.country || null,
      action: e.action,
      minutes_ago_min: e.minutesMin,
      minutes_ago_max: e.minutesMax,
      link_url: e.link || null,
      image_id: e.imageId,
      ...(await mapFor(place)),
    });
  }

  const { error: clearEvents } = await supabase
    .from('proof_events')
    .delete()
    .eq('campaign_id', campaignId);
  if (clearEvents) return { error: `Could not update the events: ${clearEvents.message}` };

  if (eventRows.length > 0) {
    const { error } = await supabase.from('proof_events').insert(eventRows);
    if (error) return { error: describeError(`Could not save the events: ${error.message}`) };
  }

  revalidatePath('/social-proof');
  revalidatePath(`/social-proof/${campaignId}`);

  // The blog serves campaigns from one static route; a site-wide refresh is
  // what purges it.
  const refreshed = await revalidateSite(site, { type: 'site' });

  return {
    savedId: campaignId,
    staleWarning: refreshed.ok
      ? undefined
      : `Saved, but the live site still shows the old version: ${refreshed.error}`,
    mapWarning:
      mapFailures.length > 0
        ? `No map for: ${mapFailures.join('; ')}. Those show the preset icon instead.`
        : undefined,
  };
}

export async function deleteProofCampaign(formData: FormData) {
  const site = await requireCurrentSite();
  const supabase = await createClient();

  const id = String(formData.get('id') ?? '');

  // Events and targets cascade. Generated maps stay in storage: they are keyed
  // by place and shared with any other campaign that shows the same city.
  const { error } = await supabase
    .from('proof_campaigns')
    .delete()
    .eq('id', id)
    .eq('site_id', site.id);

  if (error) throw new Error(`Could not delete the campaign: ${error.message}`);

  await revalidateSite(site, { type: 'site' });
  revalidatePath('/social-proof');
  redirect('/social-proof');
}

