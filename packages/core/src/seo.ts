import type {
  SeoKeywordIntent,
  SeoKeywordRow,
  SeoPagePriority,
  SeoPageRow,
  SeoPageStatus,
  SeoTopicRow,
} from './database.types';

/**
 * Shaping keyword research into the tree both SEO screens render.
 *
 * Pure functions over rows the caller has already fetched. The two screens
 * differ only in which pages they pass in — Keywords passes all of them,
 * Roadmap passes the briefed ones — so the roll-ups, the ordering and the
 * difficulty banding are written once here rather than twice in the routes.
 *
 * WHY ROLL-UPS ARE COMPUTED, NOT STORED. A topic's total volume is the sum of
 * its keywords' volumes, and a stored copy is wrong the moment a keyword moves
 * between pages — which is what clustering *is*. The numbers are small (low
 * thousands of rows per site) and the arithmetic is one pass.
 */

// ---------------------------------------------------------------------------
// Difficulty banding
// ---------------------------------------------------------------------------

export type KdBand = 'very-easy' | 'easy' | 'possible' | 'difficult' | 'hard';

/**
 * The five bands third-party tools have converged on, kept because they are
 * the ones Denis already reads at a glance — not because the boundaries mean
 * anything absolute.
 *
 * Difficulty is a vendor score on a vendor scale, so a KD from one provider is
 * not comparable with another's. `seo_keywords.source` records which, and a
 * mixed column read as one series is the thing to watch for.
 */
export function kdBand(kd: number | null | undefined): KdBand | null {
  if (kd === null || kd === undefined) return null;
  if (kd < 15) return 'very-easy';
  if (kd < 30) return 'easy';
  if (kd < 50) return 'possible';
  if (kd < 70) return 'difficult';
  return 'hard';
}

export const KD_BAND_LABELS: Record<KdBand, string> = {
  'very-easy': 'Very easy',
  easy: 'Easy',
  possible: 'Possible',
  difficult: 'Difficult',
  hard: 'Hard',
};

// ---------------------------------------------------------------------------
// The tree
// ---------------------------------------------------------------------------

/** How a page's keywords split by intent. Drives the stacked bar on a row. */
export type IntentMix = Record<SeoKeywordIntent, number>;

export const INTENTS: readonly SeoKeywordIntent[] = [
  'informational',
  'commercial',
  'transactional',
  'navigational',
];

export interface SeoMetrics {
  /** Sum of keyword volumes. Nulls count as zero but not as "known". */
  volume: number;
  /** Volume-weighted mean KD across keywords that have one, or null. */
  kd: number | null;
  keywordCount: number;
  /** Keywords carrying no volume figure — the caveat on the two numbers above. */
  unmeasured: number;
}

export interface SeoPageNode {
  page: SeoPageRow;
  keywords: SeoKeywordRow[];
  metrics: SeoMetrics;
  intent: IntentMix;
}

export interface SeoTopicNode {
  /** Null for the bucket holding pages whose topic was deleted. */
  topic: SeoTopicRow | null;
  pillar: SeoPageNode | null;
  subs: SeoPageNode[];
  metrics: SeoMetrics;
  /** Status tally across the topic's pages — what the Roadmap header shows. */
  statusCounts: Record<SeoPageStatus, number>;
  /**
   * Priority tally, so a COLLAPSED topic can still say it holds urgent work.
   * Without it the only way to find the top of the queue in a six-topic tree is
   * to open all six, which is the problem the ordering was added to solve.
   * Unranked pages are counted in neither bucket; `pageCount` is the total.
   */
  priorityCounts: Record<SeoPagePriority, number>;
}

export interface SeoTree {
  topics: SeoTopicNode[];
  /**
   * Keywords with no page yet. Research that has not been clustered, which is
   * a real working state and is shown rather than hidden — a keyword that
   * silently belongs nowhere is a keyword nobody will ever action.
   */
  unassigned: SeoKeywordRow[];
  metrics: SeoMetrics;
}

function emptyIntentMix(): IntentMix {
  return {
    informational: 0,
    commercial: 0,
    transactional: 0,
    navigational: 0,
  };
}

function emptyStatusCounts(): Record<SeoPageStatus, number> {
  return { researched: 0, briefed: 0, drafted: 0, published: 0 };
}

function emptyPriorityCounts(): Record<SeoPagePriority, number> {
  return { high: 0, medium: 0, low: 0 };
}

/**
 * Where an unranked page sorts: after every ranked one.
 *
 * Null is not low. A page nobody has looked at yet and a page someone decided
 * was low priority are different claims, and folding them together would let an
 * untouched roadmap look as though it had been triaged. Ranked work floats up;
 * the unranked tail is visibly the part still to be triaged.
 */
const PRIORITY_RANK: Record<SeoPagePriority, number> = { high: 0, medium: 1, low: 2 };
const UNRANKED = 3;

export function priorityRank(priority: SeoPagePriority | null): number {
  return priority === null ? UNRANKED : PRIORITY_RANK[priority];
}

/**
 * Volume-weighted rather than a plain mean.
 *
 * A page holding one 14,000-volume head term and nine 20-volume tails is not
 * "average difficulty 8" in any sense that helps decide whether to write it.
 * Weighting by volume makes the number describe the traffic actually at stake.
 * Keywords with no volume are excluded from the weighting but still counted in
 * `keywordCount`, and surfaced as `unmeasured` so the caveat is visible.
 */
function summarise(keywords: SeoKeywordRow[]): SeoMetrics {
  let volume = 0;
  let weighted = 0;
  let weight = 0;
  let unmeasured = 0;

  for (const k of keywords) {
    if (k.volume === null) unmeasured += 1;
    else volume += k.volume;

    if (k.kd !== null && k.volume !== null && k.volume > 0) {
      weighted += k.kd * k.volume;
      weight += k.volume;
    }
  }

  // Fall back to an unweighted mean when nothing carries volume, so a set of
  // brand-new keywords still shows a difficulty rather than a blank.
  let kd: number | null = null;
  if (weight > 0) {
    kd = Math.round(weighted / weight);
  } else {
    const scored = keywords.filter((k) => k.kd !== null);
    if (scored.length > 0) {
      kd = Math.round(scored.reduce((sum, k) => sum + (k.kd ?? 0), 0) / scored.length);
    }
  }

  return { volume, kd, keywordCount: keywords.length, unmeasured };
}

function intentMix(keywords: SeoKeywordRow[]): IntentMix {
  const mix = emptyIntentMix();
  for (const k of keywords) if (k.intent) mix[k.intent] += 1;
  return mix;
}

/** Highest volume first; ties and unmeasured keywords fall back to the term. */
function byVolume(a: SeoKeywordRow, b: SeoKeywordRow): number {
  const av = a.volume ?? -1;
  const bv = b.volume ?? -1;
  if (av !== bv) return bv - av;
  return a.keyword.localeCompare(b.keyword);
}

/**
 * How the two screens order the pages inside a topic.
 *
 * `position` is the research order — whatever sequence the clusters were
 * entered in, which is what the Keywords screen wants because nothing there has
 * been ranked. `priority` is the queue, and it is the Roadmap's: once work has
 * been committed to, the only ordering question left is what to write next.
 */
export type SeoPageOrder = 'position' | 'priority';

function comparePages(orderBy: SeoPageOrder) {
  return (a: SeoPageNode, b: SeoPageNode): number => {
    // Every tiebreaker below is the existing `position` chain, unchanged.
    // Priority is a key in FRONT of it, not a replacement for it: two equally
    // urgent pages still fall back to the order someone put them in.
    const ranked =
      orderBy === 'priority'
        ? priorityRank(a.page.priority) - priorityRank(b.page.priority)
        : 0;

    return (
      ranked ||
      a.page.position - b.page.position ||
      b.metrics.volume - a.metrics.volume ||
      a.page.title.localeCompare(b.page.title)
    );
  };
}

function pageNode(page: SeoPageRow, keywords: SeoKeywordRow[]): SeoPageNode {
  // The primary keyword leads regardless of volume — it is the page's subject,
  // and a list that buries it under a bigger secondary reads as a mistake.
  const sorted = [...keywords].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return byVolume(a, b);
  });

  return {
    page,
    keywords: sorted,
    metrics: summarise(sorted),
    intent: intentMix(sorted),
  };
}

/**
 * Assemble topics, pages and keywords into the render tree.
 *
 * The caller decides which pages are in scope — that is the only difference
 * between the Keywords and Roadmap screens. Keywords belonging to a page that
 * was filtered out are dropped rather than falling into `unassigned`, so the
 * Roadmap's unclustered pile does not fill up with research.
 */
export function buildSeoTree(
  topics: SeoTopicRow[],
  pages: SeoPageRow[],
  keywords: SeoKeywordRow[],
  options: { includeUnassigned?: boolean; orderBy?: SeoPageOrder } = {},
): SeoTree {
  const { includeUnassigned = true, orderBy = 'position' } = options;

  const byPage = new Map<string, SeoKeywordRow[]>();
  const unassigned: SeoKeywordRow[] = [];
  const inScope = new Set(pages.map((p) => p.id));

  for (const k of keywords) {
    if (k.page_id === null) {
      if (includeUnassigned) unassigned.push(k);
      continue;
    }
    if (!inScope.has(k.page_id)) continue;
    const bucket = byPage.get(k.page_id);
    if (bucket) bucket.push(k);
    else byPage.set(k.page_id, [k]);
  }

  const pagesByTopic = new Map<string, SeoPageRow[]>();
  for (const p of pages) {
    // A page whose topic was deleted lands under a null key rather than being
    // dropped — see the `on delete set null` note in 0013_seo.sql.
    const key = p.topic_id ?? '';
    const bucket = pagesByTopic.get(key);
    if (bucket) bucket.push(p);
    else pagesByTopic.set(key, [p]);
  }

  const ordered = [...topics].sort(
    (a, b) => a.position - b.position || a.name.localeCompare(b.name),
  );

  const nodes: SeoTopicNode[] = [];

  const build = (topic: SeoTopicRow | null, topicPages: SeoPageRow[]): SeoTopicNode => {
    const built = topicPages.map((p) => pageNode(p, byPage.get(p.id) ?? []));

    /*
     * The pillar is not in the sort at all, on either screen. It leads its
     * topic because of what it is, and a cluster model where the hub can be
     * ranked below its own spokes is not a cluster model.
     */
    const pillar = built.find((n) => n.page.role === 'pillar') ?? null;
    const subs = built.filter((n) => n !== pillar).sort(comparePages(orderBy));

    const statusCounts = emptyStatusCounts();
    const priorityCounts = emptyPriorityCounts();
    for (const n of built) {
      statusCounts[n.page.status] += 1;
      if (n.page.priority) priorityCounts[n.page.priority] += 1;
    }

    const flat = built.flatMap((n) => n.keywords);

    return {
      topic,
      pillar,
      subs,
      /*
       * Summed from the topic's flattened keywords, not averaged from its
       * pages' averages — that would weight a 2-keyword page the same as a
       * 33-keyword one.
       */
      metrics: summarise(flat),
      statusCounts,
      priorityCounts,
    };
  };

  for (const topic of ordered) {
    const topicPages = pagesByTopic.get(topic.id);
    // Topics with no pages still appear: an empty topic is a research gap, and
    // hiding it makes the gap invisible on the screen meant to surface it.
    nodes.push(build(topic, topicPages ?? []));
  }

  const orphaned = pagesByTopic.get('');
  if (orphaned && orphaned.length > 0) nodes.push(build(null, orphaned));

  const allKeywords = [...byPage.values()].flat();

  return {
    topics: nodes,
    unassigned: unassigned.sort(byVolume),
    metrics: summarise([...allKeywords, ...unassigned]),
  };
}

// ---------------------------------------------------------------------------
// Presentation helpers
// ---------------------------------------------------------------------------

/** 14,817 → "14.8K". Volumes are estimates; four significant digits imply otherwise. */
export function formatVolume(volume: number | null | undefined): string {
  if (volume === null || volume === undefined) return '—';
  if (volume === 0) return '0';
  if (volume < 1000) return String(volume);
  if (volume < 1_000_000) {
    const k = volume / 1000;
    return `${k < 10 ? k.toFixed(1) : Math.round(k)}K`;
  }
  return `${(volume / 1_000_000).toFixed(1)}M`;
}

/**
 * What to call a cluster on the Keywords screen.
 *
 * Its head term, not `page.title`. Clustering happens before anything is
 * written: the research produces groups of terms, and a working page title is
 * invented later — often much later, and by a different pass. Naming the group
 * after a title that does not exist yet was showing placeholder prose on a
 * screen whose whole job is the terms.
 *
 * Preferring the keyword row over the denormalised `page.primary_keyword`
 * matters when the two disagree: the row is where `is_primary` is enforced
 * one-per-page, so it is the copy that cannot drift. The title survives only as
 * a last resort, for a cluster with no keywords in it at all — rare, and better
 * than an unlabelled row.
 */
export function clusterLabel(node: SeoPageNode): string {
  const primary = node.keywords.find((k) => k.is_primary);
  return (
    primary?.keyword ??
    node.page.primary_keyword ??
    node.keywords[0]?.keyword ??
    node.page.title
  );
}

export const SEO_STATUS_LABELS: Record<SeoPageStatus, string> = {
  researched: 'Researched',
  briefed: 'Briefed',
  drafted: 'Drafted',
  published: 'Published',
};

export const SEO_PRIORITY_LABELS: Record<SeoPagePriority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

/** Most urgent first, which is both the enum's order and the picker's. */
export const SEO_PRIORITIES: readonly SeoPagePriority[] = ['high', 'medium', 'low'];

/** Narrows a submitted form value, which is a string from anywhere. */
export function parsePriority(value: unknown): SeoPagePriority | null {
  return (SEO_PRIORITIES as readonly unknown[]).includes(value)
    ? (value as SeoPagePriority)
    : null;
}

/**
 * The statuses the Roadmap screen shows.
 *
 * `researched` is excluded by design: the roadmap is work that has been
 * committed to, and a page becomes committed when it is briefed.
 */
export const ROADMAP_STATUSES: readonly SeoPageStatus[] = [
  'briefed',
  'drafted',
  'published',
];
