import { describe, expect, it } from 'vitest';

import {
  buildSeoTree,
  clusterLabel,
  formatVolume,
  kdBand,
  parsePriority,
  SEO_PRIORITIES,
  type SeoKeywordRow,
  type SeoPageRow,
  type SeoTopicRow,
} from '../index';

const topic = (over: Partial<SeoTopicRow> & Pick<SeoTopicRow, 'id' | 'name'>): SeoTopicRow => ({
  site_id: 'site-1',
  pillar: null,
  position: 0,
  notes: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...over,
});

const page = (over: Partial<SeoPageRow> & Pick<SeoPageRow, 'id' | 'title'>): SeoPageRow => ({
  site_id: 'site-1',
  topic_id: null,
  role: 'sub',
  status: 'researched',
  priority: null,
  primary_keyword: null,
  brief: null,
  outline: null,
  meta_title: null,
  meta_description: null,
  post_id: null,
  position: 0,
  notes: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...over,
});

const kw = (
  over: Partial<SeoKeywordRow> & Pick<SeoKeywordRow, 'id' | 'keyword'>,
): SeoKeywordRow => ({
  site_id: 'site-1',
  page_id: null,
  volume: null,
  kd: null,
  cpc: null,
  intent: null,
  is_primary: false,
  source: null,
  metrics_updated_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...over,
});

describe('kdBand', () => {
  it('bands on the boundaries the colours imply', () => {
    expect(kdBand(0)).toBe('very-easy');
    expect(kdBand(14)).toBe('very-easy');
    expect(kdBand(15)).toBe('easy');
    expect(kdBand(29)).toBe('easy');
    expect(kdBand(30)).toBe('possible');
    expect(kdBand(49)).toBe('possible');
    expect(kdBand(50)).toBe('difficult');
    expect(kdBand(70)).toBe('hard');
    expect(kdBand(100)).toBe('hard');
  });

  it('distinguishes "no difficulty known" from zero', () => {
    expect(kdBand(null)).toBeNull();
    expect(kdBand(undefined)).toBeNull();
    expect(kdBand(0)).toBe('very-easy');
  });
});

describe('formatVolume', () => {
  it('abbreviates without implying precision estimates do not have', () => {
    expect(formatVolume(0)).toBe('0');
    expect(formatVolume(940)).toBe('940');
    expect(formatVolume(1400)).toBe('1.4K');
    expect(formatVolume(14_817)).toBe('15K');
    expect(formatVolume(2_400_000)).toBe('2.4M');
  });

  it('shows an em dash for unknown, not zero', () => {
    expect(formatVolume(null)).toBe('—');
    expect(formatVolume(undefined)).toBe('—');
  });
});

describe('buildSeoTree', () => {
  it('nests keywords under pages under topics', () => {
    const tree = buildSeoTree(
      [topic({ id: 't1', name: 'SBA loans' })],
      [page({ id: 'p1', title: 'SBA 7(a) explained', topic_id: 't1', role: 'pillar' })],
      [
        kw({ id: 'k1', keyword: 'sba 7a loans', page_id: 'p1', volume: 14_817, kd: 37 }),
        kw({ id: 'k2', keyword: 'sba loans 7a', page_id: 'p1', volume: 500, kd: 30 }),
      ],
    );

    expect(tree.topics).toHaveLength(1);
    expect(tree.topics[0]?.pillar?.page.id).toBe('p1');
    expect(tree.topics[0]?.pillar?.keywords).toHaveLength(2);
    expect(tree.topics[0]?.metrics.volume).toBe(15_317);
  });

  it('weights topic difficulty by volume, not by keyword count', () => {
    // One head term at KD 40 plus nine tails at KD 10. A plain mean says 13;
    // the traffic actually at stake is nearly all at 40.
    const tails = Array.from({ length: 9 }, (_, i) =>
      kw({ id: `t${i}`, keyword: `tail ${i}`, page_id: 'p1', volume: 10, kd: 10 }),
    );

    const tree = buildSeoTree(
      [topic({ id: 't1', name: 'Topic' })],
      [page({ id: 'p1', title: 'Page', topic_id: 't1' })],
      [kw({ id: 'head', keyword: 'head', page_id: 'p1', volume: 10_000, kd: 40 }), ...tails],
    );

    expect(tree.topics[0]?.metrics.kd).toBe(40);
  });

  it('counts keywords with no volume but does not let them drag the totals', () => {
    const tree = buildSeoTree(
      [topic({ id: 't1', name: 'Topic' })],
      [page({ id: 'p1', title: 'Page', topic_id: 't1' })],
      [
        kw({ id: 'k1', keyword: 'measured', page_id: 'p1', volume: 100, kd: 20 }),
        kw({ id: 'k2', keyword: 'unmeasured', page_id: 'p1' }),
      ],
    );

    const m = tree.topics[0]!.metrics;
    expect(m.volume).toBe(100);
    expect(m.keywordCount).toBe(2);
    expect(m.unmeasured).toBe(1);
    expect(m.kd).toBe(20);
  });

  it('still reports a difficulty when nothing carries volume', () => {
    const tree = buildSeoTree(
      [topic({ id: 't1', name: 'Topic' })],
      [page({ id: 'p1', title: 'Page', topic_id: 't1' })],
      [
        kw({ id: 'k1', keyword: 'a', page_id: 'p1', kd: 10 }),
        kw({ id: 'k2', keyword: 'b', page_id: 'p1', kd: 30 }),
      ],
    );

    expect(tree.topics[0]?.metrics.kd).toBe(20);
  });

  it('puts the primary keyword first even when a secondary outranks it', () => {
    const tree = buildSeoTree(
      [topic({ id: 't1', name: 'Topic' })],
      [page({ id: 'p1', title: 'Page', topic_id: 't1' })],
      [
        kw({ id: 'big', keyword: 'bigger secondary', page_id: 'p1', volume: 9000 }),
        kw({ id: 'pri', keyword: 'the subject', page_id: 'p1', volume: 100, is_primary: true }),
      ],
    );

    expect(tree.topics[0]?.subs[0]?.keywords.map((k) => k.id)).toEqual(['pri', 'big']);
  });

  it('keeps a topic with no pages, because an empty topic is a research gap', () => {
    const tree = buildSeoTree([topic({ id: 't1', name: 'Untouched' })], [], []);

    expect(tree.topics).toHaveLength(1);
    expect(tree.topics[0]?.subs).toHaveLength(0);
  });

  it('surfaces pages whose topic was deleted rather than dropping them', () => {
    const tree = buildSeoTree(
      [],
      [page({ id: 'p1', title: 'Orphan', topic_id: null })],
      [kw({ id: 'k1', keyword: 'orphaned', page_id: 'p1', volume: 50 })],
    );

    expect(tree.topics).toHaveLength(1);
    expect(tree.topics[0]?.topic).toBeNull();
    expect(tree.topics[0]?.subs[0]?.page.id).toBe('p1');
  });

  it('collects unclustered keywords when research is in scope', () => {
    const tree = buildSeoTree([], [], [kw({ id: 'k1', keyword: 'loose', volume: 10 })]);

    expect(tree.unassigned.map((k) => k.id)).toEqual(['k1']);
    expect(tree.metrics.keywordCount).toBe(1);
  });

  it('drops unclustered keywords when they are out of scope', () => {
    const tree = buildSeoTree([], [], [kw({ id: 'k1', keyword: 'loose' })], {
      includeUnassigned: false,
    });

    expect(tree.unassigned).toHaveLength(0);
  });

  it('drops keywords belonging to a filtered-out page', () => {
    // The Roadmap case: page p2 was not passed in, so its keywords must not
    // reappear in the unclustered pile as though nobody had assigned them.
    const tree = buildSeoTree(
      [topic({ id: 't1', name: 'Topic' })],
      [page({ id: 'p1', title: 'Briefed', topic_id: 't1', status: 'briefed' })],
      [
        kw({ id: 'k1', keyword: 'on p1', page_id: 'p1', volume: 10 }),
        kw({ id: 'k2', keyword: 'on p2', page_id: 'p2', volume: 999 }),
      ],
      { includeUnassigned: false },
    );

    expect(tree.unassigned).toHaveLength(0);
    expect(tree.metrics.volume).toBe(10);
  });

  it('orders subs by volume and tallies status for the roadmap header', () => {
    const tree = buildSeoTree(
      [topic({ id: 't1', name: 'Topic' })],
      [
        page({ id: 'small', title: 'Small', topic_id: 't1', status: 'briefed' }),
        page({ id: 'big', title: 'Big', topic_id: 't1', status: 'published' }),
      ],
      [
        kw({ id: 'k1', keyword: 'a', page_id: 'small', volume: 10 }),
        kw({ id: 'k2', keyword: 'b', page_id: 'big', volume: 5000 }),
      ],
    );

    expect(tree.topics[0]?.subs.map((s) => s.page.id)).toEqual(['big', 'small']);
    expect(tree.topics[0]?.statusCounts).toMatchObject({
      briefed: 1,
      published: 1,
      researched: 0,
    });
  });

  it('respects explicit page position over volume', () => {
    const tree = buildSeoTree(
      [topic({ id: 't1', name: 'Topic' })],
      [
        page({ id: 'first', title: 'Deliberately first', topic_id: 't1', position: 1 }),
        page({ id: 'second', title: 'Bigger but later', topic_id: 't1', position: 2 }),
      ],
      [
        kw({ id: 'k1', keyword: 'a', page_id: 'first', volume: 10 }),
        kw({ id: 'k2', keyword: 'b', page_id: 'second', volume: 9999 }),
      ],
    );

    expect(tree.topics[0]?.subs.map((s) => s.page.id)).toEqual(['first', 'second']);
  });
});

describe('clusterLabel', () => {
  const cluster = (pageOver: Partial<SeoPageRow>, keywords: SeoKeywordRow[]) => {
    const p = page({ id: 'p1', title: 'A working title', ...pageOver });
    const tree = buildSeoTree(
      [topic({ id: 't1', name: 'Topic' })],
      [{ ...p, topic_id: 't1' }],
      keywords.map((k) => ({ ...k, page_id: 'p1' })),
    );
    const node = tree.topics[0]?.subs[0];
    if (!node) throw new Error('expected a cluster');
    return clusterLabel(node);
  };

  it('names a cluster by its head term, not the working page title', () => {
    expect(
      cluster({}, [
        kw({ id: 'k1', keyword: 'sba loan requirements', is_primary: true, volume: 40 }),
        kw({ id: 'k2', keyword: 'sba 7a eligibility', volume: 900 }),
      ]),
    ).toBe('sba loan requirements');
  });

  it('prefers the keyword row over the denormalised copy when they disagree', () => {
    // The row is where one-primary-per-page is enforced, so it is the copy
    // that cannot drift; primary_keyword is a render convenience.
    expect(
      cluster({ primary_keyword: 'stale copy' }, [
        kw({ id: 'k1', keyword: 'the real head term', is_primary: true }),
      ]),
    ).toBe('the real head term');
  });

  it('falls back to the denormalised copy when no row is flagged primary', () => {
    expect(
      cluster({ primary_keyword: 'equipment financing' }, [
        kw({ id: 'k1', keyword: 'lease vs buy equipment', volume: 300 }),
      ]),
    ).toBe('equipment financing');
  });

  it('falls back to the biggest term when nothing is flagged or denormalised', () => {
    expect(
      cluster({}, [
        kw({ id: 'k1', keyword: 'small term', volume: 10 }),
        kw({ id: 'k2', keyword: 'big term', volume: 5000 }),
      ]),
    ).toBe('big term');
  });

  it('uses the title only for a cluster with no keywords at all', () => {
    expect(cluster({}, [])).toBe('A working title');
  });
});

describe('priority ordering', () => {
  const roadmap = (pages: SeoPageRow[]) =>
    buildSeoTree(
      [topic({ id: 't1', name: 'Topic' })],
      pages.map((p) => ({ ...p, topic_id: 't1' })),
      [],
      { orderBy: 'priority' },
    );

  it('ranks unset last, not as low', () => {
    const tree = roadmap([
      page({ id: 'none', title: 'Nobody looked at this' }),
      page({ id: 'low', title: 'Deliberately low', priority: 'low' }),
      page({ id: 'high', title: 'Urgent', priority: 'high' }),
      page({ id: 'mid', title: 'Middling', priority: 'medium' }),
    ]);

    expect(tree.topics[0]?.subs.map((s) => s.page.id)).toEqual([
      'high',
      'mid',
      'low',
      'none',
    ]);
  });

  it('keeps position as the tiebreaker within one priority', () => {
    const tree = roadmap([
      page({ id: 'second', title: 'B', priority: 'high', position: 2 }),
      page({ id: 'first', title: 'A', priority: 'high', position: 1 }),
      page({ id: 'later', title: 'C', priority: 'low', position: 0 }),
    ]);

    // `later` has the lowest position of the three and still sorts last:
    // priority is a key in front of the existing chain, not a replacement.
    expect(tree.topics[0]?.subs.map((s) => s.page.id)).toEqual([
      'first',
      'second',
      'later',
    ]);
  });

  it('leaves the research screen ordered by position, whatever the priority', () => {
    const pages = [
      page({ id: 'first', title: 'A', topic_id: 't1', position: 1, priority: 'low' }),
      page({ id: 'second', title: 'B', topic_id: 't1', position: 2, priority: 'high' }),
    ];
    const tree = buildSeoTree([topic({ id: 't1', name: 'Topic' })], pages, []);

    expect(tree.topics[0]?.subs.map((s) => s.page.id)).toEqual(['first', 'second']);
  });

  it('never sorts the pillar below its own spokes', () => {
    const tree = roadmap([
      page({ id: 'hub', title: 'The pillar', role: 'pillar', priority: 'low' }),
      page({ id: 'spoke', title: 'A spoke', priority: 'high' }),
    ]);

    expect(tree.topics[0]?.pillar?.page.id).toBe('hub');
    expect(tree.topics[0]?.subs.map((s) => s.page.id)).toEqual(['spoke']);
  });

  it('tallies priority per topic, counting the pillar and skipping unranked', () => {
    const tree = roadmap([
      page({ id: 'hub', title: 'Hub', role: 'pillar', priority: 'high' }),
      page({ id: 'a', title: 'A', priority: 'high' }),
      page({ id: 'b', title: 'B', priority: 'medium' }),
      page({ id: 'c', title: 'C' }),
    ]);

    expect(tree.topics[0]?.priorityCounts).toEqual({ high: 2, medium: 1, low: 0 });
  });
});

describe('parsePriority', () => {
  it('accepts the three the enum allows', () => {
    expect(SEO_PRIORITIES.map(parsePriority)).toEqual(['high', 'medium', 'low']);
  });

  it('reads anything else as unranked, so a cleared select clears the column', () => {
    for (const value of ['', 'urgent', 'HIGH', null, undefined, 0]) {
      expect(parsePriority(value)).toBeNull();
    }
  });
});
