import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { LeadMagnetTargetRow, TermRow } from '../database.types';
import {
  expandCategoryIds,
  resolveLeadMagnet,
  toLeadMagnetOffer,
  type LeadMagnetWithTargets,
} from '../lead-magnets';

/**
 * Targeting is the part of this feature with no visible failure mode.
 *
 * A resolver bug does not throw and does not render wrong — it renders the
 * WRONG OFFER, or none, on a page nobody is looking at, and the only symptom is
 * a conversion rate that is lower than it should be. Every rule it applies is
 * pinned here because none of them would be caught by looking at the site.
 */

let seq = 0;

function magnet(
  overrides: Partial<LeadMagnetWithTargets> & { targets: LeadMagnetTargetRow[] },
): LeadMagnetWithTargets {
  seq += 1;

  return {
    id: `magnet-${seq}`,
    site_id: 'site-1',
    slug: `magnet-${seq}`,
    name: `Magnet ${seq}`,
    heading: 'Get the thing',
    body: null,
    button_label: 'Send it to me',
    success_message: 'On its way.',
    collect_name: false,
    image_id: null,
    image: null,
    consent_text: null,
    asset_url: 'https://example.com/toolkit.pdf',
    active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function target(overrides: Partial<LeadMagnetTargetRow>): LeadMagnetTargetRow {
  return {
    id: `target-${(seq += 1)}`,
    magnet_id: 'magnet-1',
    scope: 'site',
    term_id: null,
    post_id: null,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const CONTEXT = {
  postId: 'post-1',
  categoryIds: ['cat-financing'],
  tagIds: ['tag-equipment'],
};

describe('resolveLeadMagnet — matching', () => {
  it('returns null when nothing is targeted', () => {
    expect(resolveLeadMagnet([magnet({ targets: [] })], CONTEXT)).toBeNull();
  });

  it('returns null when no rule matches this post', () => {
    const other = magnet({
      targets: [target({ scope: 'category', term_id: 'cat-marketing' })],
    });

    expect(resolveLeadMagnet([other], CONTEXT)).toBeNull();
  });

  it('matches a site-wide rule', () => {
    const all = magnet({ targets: [target({ scope: 'site' })] });
    expect(resolveLeadMagnet([all], CONTEXT)?.id).toBe(all.id);
  });

  it('matches on category, tag and post id', () => {
    for (const rule of [
      target({ scope: 'category', term_id: 'cat-financing' }),
      target({ scope: 'tag', term_id: 'tag-equipment' }),
      target({ scope: 'post', post_id: 'post-1' }),
    ]) {
      const one = magnet({ targets: [rule] });
      expect(resolveLeadMagnet([one], CONTEXT)?.id).toBe(one.id);
    }
  });

  /*
   * The distinction the whole ranking rests on. If category and tag ids were
   * merged into one set before matching, a tag rule pointed at a category's id
   * would fire — and would then outrank the category rule that was meant to.
   */
  it('does not let a tag rule match a category id', () => {
    const wrong = magnet({
      targets: [target({ scope: 'tag', term_id: 'cat-financing' })],
    });

    expect(resolveLeadMagnet([wrong], CONTEXT)).toBeNull();
  });

  it('skips an inactive magnet even when its rule matches', () => {
    const off = magnet({ active: false, targets: [target({ scope: 'site' })] });
    expect(resolveLeadMagnet([off], CONTEXT)).toBeNull();
  });

  it('falls back to the next magnet when the best match is inactive', () => {
    const off = magnet({
      active: false,
      targets: [target({ scope: 'post', post_id: 'post-1' })],
    });
    const on = magnet({ targets: [target({ scope: 'site' })] });

    expect(resolveLeadMagnet([off, on], CONTEXT)?.id).toBe(on.id);
  });
});

describe('resolveLeadMagnet — specificity', () => {
  const siteWide = magnet({ targets: [target({ scope: 'site' })] });
  const byCategory = magnet({
    targets: [target({ scope: 'category', term_id: 'cat-financing' })],
  });
  const byTag = magnet({ targets: [target({ scope: 'tag', term_id: 'tag-equipment' })] });
  const byPost = magnet({ targets: [target({ scope: 'post', post_id: 'post-1' })] });

  it('prefers a category rule over site-wide', () => {
    expect(resolveLeadMagnet([siteWide, byCategory], CONTEXT)?.id).toBe(byCategory.id);
  });

  it('prefers a tag rule over a category rule', () => {
    expect(resolveLeadMagnet([byCategory, byTag], CONTEXT)?.id).toBe(byTag.id);
  });

  it('prefers a post rule over everything', () => {
    const all = [siteWide, byCategory, byTag, byPost];
    expect(resolveLeadMagnet(all, CONTEXT)?.id).toBe(byPost.id);
  });

  // Order in the array is whatever PostgREST returned; it must not decide this.
  it('does not depend on the order the magnets arrive in', () => {
    const forwards = resolveLeadMagnet([siteWide, byCategory, byTag, byPost], CONTEXT);
    const backwards = resolveLeadMagnet([byPost, byTag, byCategory, siteWide], CONTEXT);

    expect(forwards?.id).toBe(backwards?.id);
  });

  /*
   * A magnet aimed both site-wide and at this post is competing at its BEST
   * scope, not its first or its loosest. Scoring per rule and keeping the
   * maximum is what makes "also show it everywhere else" a safe thing to tick.
   */
  it('scores a magnet at its tightest matching rule', () => {
    const both = magnet({
      targets: [target({ scope: 'site' }), target({ scope: 'post', post_id: 'post-1' })],
    });

    expect(resolveLeadMagnet([byCategory, both], CONTEXT)?.id).toBe(both.id);
  });
});

describe('resolveLeadMagnet — ties', () => {
  it('gives a tie to the older magnet', () => {
    const older = magnet({
      created_at: '2026-01-01T00:00:00.000Z',
      targets: [target({ scope: 'category', term_id: 'cat-financing' })],
    });
    const newer = magnet({
      created_at: '2026-06-01T00:00:00.000Z',
      targets: [target({ scope: 'category', term_id: 'cat-financing' })],
    });

    expect(resolveLeadMagnet([newer, older], CONTEXT)?.id).toBe(older.id);
    expect(resolveLeadMagnet([older, newer], CONTEXT)?.id).toBe(older.id);
  });

  // Identical timestamps are not hypothetical: two offers seeded in one
  // transaction share now(). Without the id fallback the winner would be
  // whichever row the query happened to return first.
  it('breaks a same-timestamp tie by id, stably', () => {
    const a = magnet({
      id: 'aaaa',
      targets: [target({ scope: 'site' })],
    });
    const b = magnet({
      id: 'bbbb',
      targets: [target({ scope: 'site' })],
    });

    expect(resolveLeadMagnet([b, a], CONTEXT)?.id).toBe('aaaa');
    expect(resolveLeadMagnet([a, b], CONTEXT)?.id).toBe('aaaa');
  });
});

describe('expandCategoryIds', () => {
  const terms: TermRow[] = [
    {
      id: 'cat-financing',
      site_id: 'site-1',
      kind: 'category',
      slug: 'financing',
      name: 'Financing',
      description: null,
      parent_id: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'cat-equipment',
      site_id: 'site-1',
      kind: 'category',
      slug: 'equipment-financing',
      name: 'Equipment Financing',
      description: null,
      parent_id: 'cat-financing',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
  ];

  /*
   * The behaviour that makes targeting agree with the archives: a post filed
   * only under the child is reachable by a rule aimed at the parent, exactly as
   * /blog/category/financing already lists it.
   */
  it('adds ancestors of the post categories', () => {
    expect(expandCategoryIds(terms, ['cat-equipment']).sort()).toEqual([
      'cat-equipment',
      'cat-financing',
    ]);
  });

  it('does not add descendants', () => {
    expect(expandCategoryIds(terms, ['cat-financing'])).toEqual(['cat-financing']);
  });

  it('deduplicates when both parent and child are attached', () => {
    const out = expandCategoryIds(terms, ['cat-equipment', 'cat-financing']);
    expect(out).toHaveLength(2);
  });

  it('is a no-op with no categories', () => {
    expect(expandCategoryIds(terms, [])).toEqual([]);
  });
});

describe('toLeadMagnetOffer — the image', () => {
  /*
   * mediaPublicUrl reads SUPABASE_URL and throws without it — see
   * urls-env.test.ts, which pins that on purpose. Nothing else in this file
   * touches the environment, so it is set for this block only.
   */
  const ORIGINAL = process.env.SUPABASE_URL;

  beforeAll(() => {
    process.env.SUPABASE_URL = 'https://project.supabase.co';
  });

  afterAll(() => {
    if (ORIGINAL === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = ORIGINAL;
  });

  it('is null when no image is attached', () => {
    expect(toLeadMagnetOffer(magnet({ targets: [] })).image).toBeNull();
  });

  /*
   * Resolved on the server, which is the point. SUPABASE_URL has no
   * NEXT_PUBLIC_ prefix, so mediaPublicUrl cannot run in the browser — a
   * storage path reaching the card unresolved would throw on render.
   */
  it('resolves the storage path to a full URL', () => {
    const offer = toLeadMagnetOffer(
      magnet({
        targets: [],
        image: {
          storage_path: 'site-1/toolkit.png',
          alt: 'The toolkit',
          width: 1400,
          height: 1050,
        },
      }),
    );

    expect(offer.image?.url).toContain('site-1/toolkit.png');
    expect(offer.image?.url).toMatch(/^https?:\/\//);
  });

  // Both are needed for next/image to reserve space; the card falls back to a
  // plain <img> without them rather than inventing numbers.
  it('carries the dimensions and the alt text through', () => {
    const offer = toLeadMagnetOffer(
      magnet({
        targets: [],
        image: { storage_path: 'a.png', alt: 'Alt', width: 800, height: 600 },
      }),
    );

    expect(offer.image).toMatchObject({ alt: 'Alt', width: 800, height: 600 });
  });

  it('survives a row whose dimensions were never recorded', () => {
    const offer = toLeadMagnetOffer(
      magnet({
        targets: [],
        image: { storage_path: 'a.png', alt: null, width: null, height: null },
      }),
    );

    expect(offer.image?.width).toBeNull();
    expect(offer.image?.height).toBeNull();
  });
});

describe('toLeadMagnetOffer', () => {
  /*
   * The gate is only a gate while this holds. Props of a client component are
   * serialised into the page HTML, so an asset_url that reaches the offer is an
   * asset_url in view-source on every article the offer runs on.
   */
  it('does not carry the asset URL into the browser', () => {
    const offer = toLeadMagnetOffer(magnet({ targets: [] }));
    expect(JSON.stringify(offer)).not.toContain('toolkit.pdf');
  });

  it('does not carry the internal name or the site id', () => {
    const row = magnet({ targets: [], name: 'Q1 toolkit push' });
    const serialised = JSON.stringify(toLeadMagnetOffer(row));

    expect(serialised).not.toContain('Q1 toolkit push');
    expect(serialised).not.toContain('site-1');
  });

  it('carries what the card renders', () => {
    const offer = toLeadMagnetOffer(
      magnet({ targets: [], heading: 'Get the toolkit', collect_name: true }),
    );

    expect(offer.heading).toBe('Get the toolkit');
    expect(offer.collectName).toBe(true);
    expect(offer.buttonLabel).toBe('Send it to me');
  });
});
