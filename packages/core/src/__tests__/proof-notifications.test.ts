import { beforeAll, describe, expect, it } from 'vitest';

import type { ProofCampaignTargetRow, TermRow } from '../database.types';
import {
  formatMinutesAgo,
  pathMatches,
  pickMinutesAgo,
  proofHeadline,
  proofPlace,
  resolveProofCampaign,
  type ProofCampaignPayload,
  type ProofTargetPayload,
} from '../proof';
import { toProofCampaignPayload, type ProofCampaignWithRelations } from '../proof-notifications';

beforeAll(() => {
  // mediaPublicUrl reads this; the value only has to be a URL.
  process.env.SUPABASE_URL ??= 'https://project.supabase.co';
});

describe('pathMatches', () => {
  it.each([
    ['/pricing', '/pricing', true],
    ['/pricing', '/pricing/', true],
    ['/pricing', '/pricing?utm_source=x', true],
    ['/pricing', '/pricing/annual', false],
    ['/', '/', true],
    ['/', '/blog', false],
    ['/blog/*', '/blog/some-post', true],
    ['/blog/*', '/blog', false],
    ['/blog/*', '/blog/category/financing', false],
    ['/blog/**', '/blog', true],
    ['/blog/**', '/blog/category/financing', true],
    ['/blog/**', '/blogroll', false],
    ['/**', '/anything/at/all', true],
    ['/*-calculator', '/dscr-calculator', true],
    ['/*-calculator', '/calculators/dscr-calculator', false],
    ['/calc.html', '/calcxhtml', false],
    ['', '/', false],
  ])('%s against %s is %s', (pattern, path, expected) => {
    expect(pathMatches(pattern, path)).toBe(expected);
  });
});

const campaign = (
  id: string,
  targets: ProofTargetPayload[],
  createdAt = '2026-01-01T00:00:00Z',
): Pick<ProofCampaignPayload, 'id' | 'createdAt' | 'targets' | 'events'> => ({
  id,
  createdAt,
  targets,
  events: [
    { name: 'A', place: null, action: 'did it', minutesAgo: [1, 2], link: null, image: null, isMap: false },
  ],
});

describe('resolveProofCampaign', () => {
  const site = campaign('site', [{ scope: 'site', exclude: false }]);
  const calc = campaign('calc', [{ scope: 'path', exclude: false, pattern: '/calculators/**' }]);
  const cat = campaign('cat', [{ scope: 'category', exclude: false, ids: ['c1', 'c1-child'] }]);
  const post = campaign('post', [{ scope: 'post', exclude: false, ids: ['p1'] }]);

  it('returns the site-wide campaign on an ordinary page', () => {
    expect(resolveProofCampaign([site, calc, cat, post], { path: '/about' })?.id).toBe('site');
  });

  it('prefers the tighter rule', () => {
    const all = [site, calc, cat, post];
    expect(resolveProofCampaign(all, { path: '/calculators/dscr' })?.id).toBe('calc');
    expect(resolveProofCampaign(all, { path: '/blog/x', termIds: ['c1-child'] })?.id).toBe('cat');
    expect(
      resolveProofCampaign(all, { path: '/blog/x', postId: 'p1', termIds: ['c1'] })?.id,
    ).toBe('post');
  });

  it('lets an exclusion veto the campaign outright', () => {
    const exceptForm = campaign('except', [
      { scope: 'site', exclude: false },
      { scope: 'path', exclude: true, pattern: '/get-started' },
    ]);
    expect(resolveProofCampaign([exceptForm], { path: '/get-started' })).toBeNull();
    expect(resolveProofCampaign([exceptForm], { path: '/' })?.id).toBe('except');
  });

  it('falls through to a looser campaign when the tighter one is excluded', () => {
    const tight = campaign('tight', [
      { scope: 'category', exclude: false, ids: ['c1'] },
      { scope: 'post', exclude: true, ids: ['p1'] },
    ]);
    expect(resolveProofCampaign([site, tight], { path: '/b', postId: 'p1', termIds: ['c1'] })?.id).toBe(
      'site',
    );
  });

  it('breaks ties by age, oldest first', () => {
    const older = campaign('z-older', [{ scope: 'site', exclude: false }], '2025-01-01T00:00:00Z');
    const newer = campaign('a-newer', [{ scope: 'site', exclude: false }], '2026-01-01T00:00:00Z');
    expect(resolveProofCampaign([newer, older], { path: '/' })?.id).toBe('z-older');
  });

  it('skips a campaign with no events, and one with only exclusions', () => {
    const empty = { ...site, id: 'empty', events: [] };
    const onlyExclude = campaign('only-exclude', [{ scope: 'path', exclude: true, pattern: '/x' }]);
    expect(resolveProofCampaign([empty, onlyExclude], { path: '/' })).toBeNull();
  });
});

describe('copy helpers', () => {
  it('joins a place from what was filled in', () => {
    expect(proofPlace({ city: 'San Diego', region: 'CA', country: 'US' })).toBe('San Diego, CA');
    expect(proofPlace({ city: 'Vancouver', country: 'Canada' })).toBe('Vancouver, Canada');
    expect(proofPlace({ region: 'Ohio' })).toBe('Ohio');
    expect(proofPlace({ city: ' ' })).toBeNull();
  });

  it('writes the headline', () => {
    expect(proofHeadline({ name: 'James', place: 'San Diego, CA' })).toBe('James from San Diego, CA');
    expect(proofHeadline({ name: null, place: 'Ohio' })).toBe('Someone from Ohio');
    expect(proofHeadline({ name: 'Ana', place: null })).toBe('Ana');
  });

  it('formats elapsed time', () => {
    expect(formatMinutesAgo(0)).toBe('just now');
    expect(formatMinutesAgo(7)).toBe('7 min ago');
    expect(formatMinutesAgo(125)).toBe('2 hr ago');
    expect(formatMinutesAgo(60 * 24)).toBe('1 day ago');
    expect(formatMinutesAgo(60 * 24 * 4 + 5)).toBe('4 days ago');
  });

  it('picks minutes inside the range, inclusive', () => {
    expect(pickMinutesAgo([5, 9], () => 0)).toBe(5);
    expect(pickMinutesAgo([5, 9], () => 0.9999)).toBe(9);
    expect(pickMinutesAgo([9, 5], () => 0)).toBe(5);
  });
});

describe('toProofCampaignPayload', () => {
  const term = (id: string, parent_id: string | null): TermRow =>
    ({ id, parent_id, site_id: 's', kind: 'category', name: id, slug: id }) as unknown as TermRow;

  const target = (t: Partial<ProofCampaignTargetRow>): ProofCampaignTargetRow => ({
    id: 't',
    campaign_id: 'c',
    scope: 'site',
    exclude: false,
    term_id: null,
    post_id: null,
    pattern: null,
    created_at: '',
    ...t,
  });

  const base: ProofCampaignWithRelations = {
    id: 'c',
    site_id: 's',
    name: 'Internal',
    template: 'pill',
    image_mode: 'map',
    preset_icon: 'nonsense',
    image_id: 'm1',
    image: { storage_path: 'campaign.png', alt: 'Campaign' },
    position: 'bottom-left',
    show_on_mobile: true,
    initial_delay_s: 5,
    display_s: 6,
    gap_s: 8,
    max_per_view: 5,
    repeat_events: true,
    frequency: 'every_page',
    show_time_ago: true,
    accent: null,
    active: true,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    targets: [target({ scope: 'category', term_id: 'parent' })],
    events: [
      {
        id: 'e2', campaign_id: 'c', site_id: 's', sort: 1, name: ' ', city: 'Austin', region: 'TX',
        country: null, action: 'second', minutes_ago_min: 1, minutes_ago_max: 5, link_url: null,
        image_id: null, image: null, lat: null, lng: null, map_path: null, map_place: null,
        created_at: '', updated_at: '',
      },
      {
        id: 'e1', campaign_id: 'c', site_id: 's', sort: 0, name: 'James', city: 'San Diego',
        region: 'CA', country: 'US', action: 'first', minutes_ago_min: 1, minutes_ago_max: 5,
        link_url: '/guide', image_id: null, image: null, lat: 32.7, lng: -117.2,
        map_path: 'proof-maps/32.72_-117.16.webp', map_place: 'San Diego, CA, US',
        created_at: '', updated_at: '',
      },
    ],
  };

  it('orders events, resolves maps and drops what the browser should not see', () => {
    const payload = toProofCampaignPayload(base, [term('parent', null), term('child', 'parent')]);

    expect(payload).not.toHaveProperty('name');
    expect(payload.presetIcon).toBe('fire');
    expect(payload.events.map((e) => e.action)).toEqual(['first', 'second']);
    expect(payload.events[0]).toMatchObject({
      name: 'James',
      place: 'San Diego, CA',
      link: '/guide',
      isMap: true,
    });
    expect(payload.events[0]?.image?.url).toMatch(/\/media\/proof-maps\/32\.72_-117\.16\.webp$/);
    // No map for this one, and map mode does not borrow the campaign image.
    expect(payload.events[1]).toMatchObject({ name: null, image: null, isMap: false });
    expect(payload.targets).toEqual([{ scope: 'category', exclude: false, ids: ['parent', 'child'] }]);
  });

  it('uses the campaign image in custom mode and none at all in none mode', () => {
    const custom = toProofCampaignPayload({ ...base, image_mode: 'custom' });
    expect(custom.events.every((e) => e.image?.alt === 'Campaign')).toBe(true);

    const none = toProofCampaignPayload({ ...base, image_mode: 'none' });
    expect(none.events.every((e) => e.image === null)).toBe(true);
  });
});
