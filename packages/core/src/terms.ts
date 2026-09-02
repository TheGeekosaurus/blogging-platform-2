import type { TermRow } from './database.types';

/**
 * Category hierarchy helpers.
 *
 * Categories nest through `terms.parent_id`; tags never do (enforced by the
 * `terms_tag_flat` trigger). Category URLs stay FLAT — /blog/category/<slug>
 * regardless of depth — because slugs are unique per site and kind, so a flat
 * URL always resolves and re-parenting a category never breaks a link. Nesting
 * shows up in the admin, in archive navigation, and in which posts an archive
 * includes; it is not in the URL.
 *
 * The tree is built in memory rather than with a recursive SQL query. A site has
 * dozens of categories, not thousands, and both callers already hold the full
 * list — so this avoids an RPC, a SECURITY DEFINER function and the RLS
 * reasoning that would come with it.
 *
 * Every walk here is cycle-safe. The database now rejects cycles
 * (`terms_check_parent`, 0005), but rows written before that migration were
 * never checked, and a hang is a far worse failure than a dropped edge.
 */

export interface TermNode {
  term: TermRow;
  depth: number;
  children: TermNode[];
}

/** A term plus its depth, for rendering an indented flat list. */
export interface FlatTerm {
  term: TermRow;
  depth: number;
}

function childrenByParent(terms: readonly TermRow[]): Map<string | null, TermRow[]> {
  const byParent = new Map<string | null, TermRow[]>();
  const ids = new Set(terms.map((term) => term.id));

  for (const term of terms) {
    /*
     * A parent outside this list is treated as no parent, so the term still
     * appears. `parent_id` is `on delete set null`, so this normally cannot
     * happen — but a term filtered out of `terms` (an empty category, say)
     * would otherwise take its whole subtree out of the tree with it.
     */
    const key = term.parent_id && ids.has(term.parent_id) ? term.parent_id : null;
    const siblings = byParent.get(key);
    if (siblings) siblings.push(term);
    else byParent.set(key, [term]);
  }

  return byParent;
}

/**
 * Nest a flat term list into a tree, roots first, each level sorted by name.
 */
export function buildTermTree(terms: readonly TermRow[]): TermNode[] {
  const byParent = childrenByParent(terms);
  const seen = new Set<string>();

  function build(parentId: string | null, depth: number): TermNode[] {
    const rows = byParent.get(parentId) ?? [];

    return rows
      .filter((term) => {
        // Cycle guard: a term already placed cannot be its own descendant.
        if (seen.has(term.id)) return false;
        seen.add(term.id);
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((term) => ({ term, depth, children: build(term.id, depth + 1) }));
  }

  return build(null, 0);
}

/**
 * The tree flattened back into render order, each entry carrying its depth.
 *
 * This is what a `<select>` or a checkbox list wants: parents immediately
 * followed by their children, indentable by depth.
 */
export function flattenTermTree(terms: readonly TermRow[]): FlatTerm[] {
  const out: FlatTerm[] = [];

  function walk(nodes: TermNode[]): void {
    for (const node of nodes) {
      out.push({ term: node.term, depth: node.depth });
      walk(node.children);
    }
  }

  walk(buildTermTree(terms));
  return out;
}

/**
 * A term's id plus every descendant's, for "posts in this category and below".
 *
 * WordPress's behaviour, and the reason it matters: editors tag the most
 * specific category only, so without this a parent archive is an empty page —
 * and the parent is usually the one worth ranking for the broader term.
 */
export function descendantTermIds(
  terms: readonly TermRow[],
  rootId: string,
): string[] {
  const byParent = childrenByParent(terms);
  const ids = [rootId];
  const seen = new Set<string>([rootId]);

  // Breadth-first over a queue, so `seen` doubles as the cycle guard.
  const queue: string[] = [rootId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;

    for (const child of byParent.get(current) ?? []) {
      if (seen.has(child.id)) continue;
      seen.add(child.id);
      ids.push(child.id);
      queue.push(child.id);
    }
  }

  return ids;
}

/**
 * A term's ancestors, nearest first, for breadcrumbs and "under X" labels.
 */
export function ancestorTerms(terms: readonly TermRow[], termId: string): TermRow[] {
  const byId = new Map(terms.map((term) => [term.id, term]));
  const out: TermRow[] = [];
  const seen = new Set<string>([termId]);

  let current = byId.get(termId)?.parent_id ?? null;
  while (current && !seen.has(current)) {
    seen.add(current);
    const parent = byId.get(current);
    if (!parent) break;
    out.push(parent);
    current = parent.parent_id;
  }

  return out;
}

/** Direct children of a term, sorted by name. */
export function childTerms(terms: readonly TermRow[], parentId: string): TermRow[] {
  return terms
    .filter((term) => term.parent_id === parentId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Which terms have posts, counting posts in descendants.
 *
 * Needed because a parent category is usually tagged on nothing directly —
 * editors pick the most specific one. Its archive still has content, since
 * archives include descendants, so treating it as empty would hide it from
 * navigation and leave it out of the sitemap while the page itself renders fine.
 *
 * `directlyUsed` is the set of term ids with at least one published post
 * assigned to them.
 */
export function termsWithPosts(
  terms: readonly TermRow[],
  directlyUsed: ReadonlySet<string>,
): Set<string> {
  const withPosts = new Set<string>();

  for (const term of terms) {
    if (!directlyUsed.has(term.id)) continue;

    // Mark the term and every ancestor, so a post deep in the tree counts
    // towards each archive that will list it.
    withPosts.add(term.id);
    for (const ancestor of ancestorTerms(terms, term.id)) {
      withPosts.add(ancestor.id);
    }
  }

  return withPosts;
}
