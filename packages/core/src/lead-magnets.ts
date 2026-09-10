import type { Client } from './supabase';
import type {
  LeadMagnetRow,
  LeadMagnetScope,
  LeadMagnetTargetRow,
  TermRow,
} from './database.types';
import { ancestorTerms } from './terms';

/**
 * Which lead magnet, if any, a given post should offer.
 *
 * The matching is deliberately split in two: `resolveLeadMagnet` is pure and
 * holds every rule, `getLeadMagnetForPost` does the I/O and holds none. The
 * rules are the part that is easy to get subtly wrong and impossible to inspect
 * once it is interleaved with queries.
 */

/**
 * How tightly a rule was aimed. Highest wins.
 *
 * The ordering is the whole point of scoped targeting: a site-wide newsletter
 * offer is a floor, and anything aimed at the subject of the article beats it.
 * Tag outranks category because on this platform an editor files a post under
 * one category and tags it with the specifics — so the tag is the narrower
 * statement about what the post is actually about.
 */
export const LEAD_MAGNET_SPECIFICITY: Record<LeadMagnetScope, number> = {
  site: 0,
  category: 1,
  tag: 2,
  post: 3,
};

/** A magnet with its placement rules attached, as the resolver wants them. */
export interface LeadMagnetWithTargets extends LeadMagnetRow {
  targets: LeadMagnetTargetRow[];
}

/**
 * What the post belongs to.
 *
 * Categories and tags are kept apart rather than merged into one id set: a
 * target row names a scope, and collapsing the two would make a category rule
 * and a tag rule interchangeable — which is exactly the distinction the ranking
 * above is built on.
 *
 * `categoryIds` is expected to already include ANCESTORS. See
 * `expandCategoryIds`.
 */
export interface LeadMagnetContext {
  postId: string;
  categoryIds: readonly string[];
  tagIds: readonly string[];
}

/**
 * A post's categories plus every ancestor of each.
 *
 * Mirrors how archives already behave: `/blog/category/financing` lists posts
 * from its whole subtree, because editors tag the most specific category and a
 * parent would otherwise be an empty page. Targeting has to agree with that —
 * a magnet aimed at Financing must reach a post filed only under its child
 * Equipment Financing, or the two features would disagree about what "in this
 * category" means.
 */
export function expandCategoryIds(
  allTerms: readonly TermRow[],
  categoryIds: readonly string[],
): string[] {
  const out = new Set<string>(categoryIds);
  for (const id of categoryIds) {
    for (const ancestor of ancestorTerms(allTerms, id)) out.add(ancestor.id);
  }
  return [...out];
}

/** Does this rule fire for this post? */
function targetMatches(target: LeadMagnetTargetRow, context: LeadMagnetContext): boolean {
  switch (target.scope) {
    case 'site':
      return true;
    case 'post':
      return target.post_id === context.postId;
    case 'category':
      return target.term_id !== null && context.categoryIds.includes(target.term_id);
    case 'tag':
      return target.term_id !== null && context.tagIds.includes(target.term_id);
    default:
      return false;
  }
}

/** The tightest scope this magnet matches at, or null if it does not match. */
function bestScoreFor(
  magnet: LeadMagnetWithTargets,
  context: LeadMagnetContext,
): number | null {
  let best: number | null = null;

  for (const target of magnet.targets) {
    if (!targetMatches(target, context)) continue;
    const score = LEAD_MAGNET_SPECIFICITY[target.scope];
    if (best === null || score > best) best = score;
  }

  return best;
}

/**
 * Pick one magnet for a post, or null.
 *
 * One, not several: two offers on one page compete with each other and with the
 * article, and a reader who is asked twice answers neither. Extra placements
 * (an inline block mid-article, say) show the SAME magnet in a second spot —
 * that is a placement decision at the call site, not a second winner here.
 *
 * Ties — two magnets both aimed at the same category — are broken by age,
 * oldest first, and by id after that so the order is total and a build is
 * reproducible. Oldest rather than newest deliberately: adding a second offer
 * to a category should not silently take traffic away from the one already
 * running there. Retire the first, or aim the new one more tightly.
 */
export function resolveLeadMagnet(
  magnets: readonly LeadMagnetWithTargets[],
  context: LeadMagnetContext,
): LeadMagnetWithTargets | null {
  let winner: LeadMagnetWithTargets | null = null;
  let winnerScore = -1;

  for (const magnet of magnets) {
    if (!magnet.active) continue;

    const score = bestScoreFor(magnet, context);
    if (score === null) continue;

    if (score > winnerScore) {
      winner = magnet;
      winnerScore = score;
      continue;
    }

    if (score === winnerScore && winner) {
      const older =
        magnet.created_at < winner.created_at ||
        (magnet.created_at === winner.created_at && magnet.id < winner.id);
      if (older) winner = magnet;
    }
  }

  return winner;
}

/**
 * The subset of a magnet that crosses into the browser.
 *
 * Explicitly narrowed rather than passing the row through, and the narrowing
 * does two jobs.
 *
 * The row carries `name` — an internal label — and the site's uuid, neither of
 * which a reader has any use for, and a client component's props are
 * serialised into the HTML in full.
 *
 * More importantly it drops `asset_url`. Shipping the download link with the
 * card would put it in the page source of every article the offer runs on, so
 * the gate would be decorative. The capture endpoint returns it after a
 * submission instead. Anyone willing to type an address still gets the file —
 * that is the deal being offered — but it is no longer free to a reader who
 * presses Ctrl-U.
 */
export interface LeadMagnetOffer {
  slug: string;
  heading: string;
  body: string | null;
  buttonLabel: string;
  successMessage: string;
  collectName: boolean;
  consentText: string | null;
}

export function toLeadMagnetOffer(magnet: LeadMagnetRow): LeadMagnetOffer {
  return {
    slug: magnet.slug,
    heading: magnet.heading,
    body: magnet.body,
    buttonLabel: magnet.button_label,
    successMessage: magnet.success_message,
    collectName: magnet.collect_name,
    consentText: magnet.consent_text,
  };
}

/**
 * One magnet by its public slug, active only.
 *
 * The capture endpoint's read: it needs `asset_url` to hand back, and it must
 * not serve one for a retired offer. The `active` filter is belt and braces —
 * `capture_lead` refuses an inactive magnet too, so a submission cannot get
 * that far — but this runs first and would otherwise return a link for an
 * offer the database is about to reject.
 */
export async function getLeadMagnetBySlug(
  client: Client,
  siteId: string,
  slug: string,
): Promise<LeadMagnetRow | null> {
  const { data, error } = await client
    .from('lead_magnets')
    .select('*')
    .eq('site_id', siteId)
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();

  if (error) throw new Error(`Failed to load lead magnet: ${error.message}`);

  return data ?? null;
}

/**
 * Every active magnet for a site, with its rules.
 *
 * All of them in one query rather than a filtered lookup per post: a site runs
 * a handful of offers, and the alternative is an OR across three columns that
 * PostgREST expresses badly and Postgres plans no better. Build and
 * revalidation time only, like everything else the blog reads.
 *
 * RLS already restricts this to `active` rows for the anon key; the explicit
 * filter is here so the admin, whose policy also returns drafts, gets the same
 * answer the live site will.
 */
export async function listActiveLeadMagnets(
  client: Client,
  siteId: string,
): Promise<LeadMagnetWithTargets[]> {
  const { data, error } = await client
    .from('lead_magnets')
    .select('*, targets:lead_magnet_targets(*)')
    .eq('site_id', siteId)
    .eq('active', true);

  if (error) throw new Error(`Failed to load lead magnets: ${error.message}`);

  return (data ?? []) as LeadMagnetWithTargets[];
}

/**
 * The offer for one post, ready to hand to the card component.
 *
 * The terms query is conditional, and that is not micro-optimisation: it runs
 * once per post per build, and skipping it when no rule is category-scoped
 * keeps a site that targets only posts and tags from paying for the taxonomy on
 * every page it renders.
 */
export async function getLeadMagnetForPost(
  client: Client,
  siteId: string,
  post: { id: string; categories: readonly TermRow[]; tags: readonly TermRow[] },
): Promise<LeadMagnetOffer | null> {
  const magnets = await listActiveLeadMagnets(client, siteId);
  if (magnets.length === 0) return null;

  let categoryIds = post.categories.map((term) => term.id);

  const needsAncestors =
    categoryIds.length > 0 &&
    magnets.some((magnet) => magnet.targets.some((target) => target.scope === 'category'));

  if (needsAncestors) {
    const { data, error } = await client
      .from('terms')
      .select('*')
      .eq('site_id', siteId)
      .eq('kind', 'category');

    if (error) throw new Error(`Failed to load categories: ${error.message}`);

    categoryIds = expandCategoryIds((data ?? []) as TermRow[], categoryIds);
  }

  const winner = resolveLeadMagnet(magnets, {
    postId: post.id,
    categoryIds,
    tagIds: post.tags.map((term) => term.id),
  });

  return winner ? toLeadMagnetOffer(winner) : null;
}
