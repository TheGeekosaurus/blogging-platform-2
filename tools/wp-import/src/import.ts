import {
  createServiceClient,
  excerptFor,
  htmlToPlainText,
  readingMinutes,
  requireSiteBySlug,
  truncateWords,
  type Client,
  type PostStatus,
} from '@blog/core';

import { transformWordPressContent } from './transform';
import { parseWxr, type WxrPost, type WxrTerm } from './wxr';

export interface ImportOptions {
  siteSlug: string;
  dryRun: boolean;
  /** Overrides `wp:base_blog_url` from the export. */
  oldDomain?: string;
}

export interface SlugConflict {
  slug: string;
  wpPostId: number | null;
  existingWpPostId: number | null;
}

export interface ImportReport {
  siteSlug: string;
  dryRun: boolean;
  oldDomain: string | null;
  totalItemsParsed: number;
  created: string[];
  updated: string[];
  slugConflicts: SlugConflict[];
  downgradedMissingDate: string[];
  skippedByType: Record<string, number>;
  droppedShortcodes: Record<string, number>;
  termsUpserted: number;
}

interface PreparedPost {
  slug: string;
  wpPostId: number | null;
  existingId: string | null;
  terms: WxrTerm[];
  row: {
    site_id: string;
    slug: string;
    title: string;
    excerpt: string;
    content_html: string;
    original_html: string;
    status: PostStatus;
    published_at: string | null;
    author_name: string | null;
    reading_minutes: number;
    wp_post_id: number | null;
  };
}

const CHUNK_SIZE = 100;

function chunk<T>(items: T[], size = CHUNK_SIZE): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function termKey(term: Pick<WxrTerm, 'kind' | 'slug'>): string {
  return `${term.kind}:${term.slug}`;
}

/**
 * Create every category and tag the export mentions, returning a
 * `kind:slug` → id map.
 */
async function upsertTerms(
  client: Client,
  siteId: string,
  posts: WxrPost[],
  dryRun: boolean,
): Promise<{ ids: Map<string, string>; count: number }> {
  const unique = new Map<string, WxrTerm>();
  for (const post of posts) {
    for (const term of post.terms) {
      unique.set(termKey(term), term);
    }
  }

  const ids = new Map<string, string>();
  if (unique.size === 0) return { ids, count: 0 };

  if (dryRun) {
    // Fabricate placeholder ids so the rest of the dry run can proceed.
    for (const key of unique.keys()) ids.set(key, `dry-run-${key}`);
    return { ids, count: unique.size };
  }

  for (const batch of chunk([...unique.values()])) {
    const { data, error } = await client
      .from('terms')
      .upsert(
        batch.map((term) => ({
          site_id: siteId,
          kind: term.kind,
          slug: term.slug,
          name: term.name,
        })),
        { onConflict: 'site_id,kind,slug' },
      )
      .select('id, kind, slug');

    if (error) {
      throw new Error(`Failed to upsert terms: ${error.message}`);
    }

    for (const row of data ?? []) {
      ids.set(termKey(row), row.id);
    }
  }

  return { ids, count: unique.size };
}

/** Replace the taxonomy links for the given posts. */
async function replacePostTerms(
  client: Client,
  pairs: Array<{ post_id: string; term_id: string }>,
  postIds: string[],
): Promise<void> {
  for (const batch of chunk(postIds)) {
    const { error } = await client.from('post_terms').delete().in('post_id', batch);
    if (error) throw new Error(`Failed to clear post terms: ${error.message}`);
  }

  for (const batch of chunk(pairs)) {
    const { error } = await client.from('post_terms').insert(batch);
    if (error) throw new Error(`Failed to link post terms: ${error.message}`);
  }
}

export async function importWxr(xml: string, options: ImportOptions): Promise<ImportReport> {
  const client = createServiceClient();
  const site = await requireSiteBySlug(client, options.siteSlug);

  const parsed = parseWxr(xml);
  const oldDomain = options.oldDomain ?? parsed.baseBlogUrl ?? undefined;

  const report: ImportReport = {
    siteSlug: options.siteSlug,
    dryRun: options.dryRun,
    oldDomain: oldDomain ?? null,
    totalItemsParsed: parsed.posts.length,
    created: [],
    updated: [],
    slugConflicts: [],
    downgradedMissingDate: [],
    skippedByType: parsed.skipped,
    droppedShortcodes: {},
    termsUpserted: 0,
  };

  // Existing posts, so re-running the import updates rather than duplicates.
  const { data: existingRows, error: existingError } = await client
    .from('posts')
    .select('id, slug, wp_post_id')
    .eq('site_id', site.id);

  if (existingError) {
    throw new Error(`Failed to read existing posts: ${existingError.message}`);
  }

  const byWpId = new Map<number, { id: string; slug: string }>();
  const bySlug = new Map<string, { id: string; wp_post_id: number | null }>();

  for (const row of existingRows ?? []) {
    if (row.wp_post_id !== null) {
      byWpId.set(row.wp_post_id, { id: row.id, slug: row.slug });
    }
    bySlug.set(row.slug, { id: row.id, wp_post_id: row.wp_post_id });
  }

  const { ids: termIds, count: termsUpserted } = await upsertTerms(
    client,
    site.id,
    parsed.posts,
    options.dryRun,
  );
  report.termsUpserted = termsUpserted;

  const prepared: PreparedPost[] = [];
  const seenSlugs = new Set<string>();

  for (const post of parsed.posts) {
    const transformed = transformWordPressContent(post.contentHtml, { oldDomain });

    for (const name of transformed.droppedShortcodes) {
      report.droppedShortcodes[name] = (report.droppedShortcodes[name] ?? 0) + 1;
    }

    let status = post.status;
    let publishedAt = post.publishedAt;

    // The schema requires a date on published and scheduled posts. Rather than
    // invent "now" — which would misdate an old archive — such a post is imported
    // as a draft and reported, so nothing is silently mis-published.
    if ((status === 'published' || status === 'scheduled') && !publishedAt) {
      status = 'draft';
      publishedAt = null;
      report.downgradedMissingDate.push(post.slug);
    }

    const explicitExcerpt = htmlToPlainText(post.excerptHtml).trim();
    const excerpt =
      truncateWords(explicitExcerpt, 300) ||
      transformed.excerptFromMore ||
      excerptFor({ excerpt: null, content_html: transformed.html }, 300);

    const existingByWpId = post.wpPostId !== null ? byWpId.get(post.wpPostId) : undefined;
    const existingBySlug = bySlug.get(post.slug);

    // A slug already owned by a DIFFERENT WordPress post cannot be taken without
    // breaking the unique constraint. Renaming would silently change a live URL,
    // so the post is skipped and reported for a human to resolve.
    const slugTakenByOther =
      existingBySlug !== undefined &&
      existingByWpId === undefined &&
      existingBySlug.wp_post_id !== post.wpPostId;

    if (slugTakenByOther) {
      report.slugConflicts.push({
        slug: post.slug,
        wpPostId: post.wpPostId,
        existingWpPostId: existingBySlug.wp_post_id,
      });
      continue;
    }

    // Two items in the same export claiming one slug: keep the first.
    if (seenSlugs.has(post.slug)) {
      report.slugConflicts.push({
        slug: post.slug,
        wpPostId: post.wpPostId,
        existingWpPostId: null,
      });
      continue;
    }
    seenSlugs.add(post.slug);

    prepared.push({
      slug: post.slug,
      wpPostId: post.wpPostId,
      existingId: existingByWpId?.id ?? existingBySlug?.id ?? null,
      terms: post.terms,
      row: {
        site_id: site.id,
        slug: post.slug,
        title: post.title,
        excerpt,
        content_html: transformed.html,
        original_html: post.contentHtml,
        status,
        published_at: publishedAt,
        author_name: post.authorName,
        reading_minutes: readingMinutes(transformed.html),
        wp_post_id: post.wpPostId,
      },
    });
  }

  if (options.dryRun) {
    for (const item of prepared) {
      if (item.existingId) report.updated.push(item.slug);
      else report.created.push(item.slug);
    }
    return report;
  }

  const termPairs: Array<{ post_id: string; term_id: string }> = [];
  const touchedPostIds: string[] = [];

  const linkTerms = (postId: string, terms: WxrTerm[]) => {
    touchedPostIds.push(postId);
    for (const term of terms) {
      const id = termIds.get(termKey(term));
      if (id) termPairs.push({ post_id: postId, term_id: id });
    }
  };

  // Updates first, individually — each targets a known row by id.
  for (const item of prepared.filter((p) => p.existingId !== null)) {
    const { error } = await client
      .from('posts')
      .update(item.row)
      .eq('id', item.existingId as string);

    if (error) {
      throw new Error(`Failed to update post "${item.slug}": ${error.message}`);
    }

    report.updated.push(item.slug);
    linkTerms(item.existingId as string, item.terms);
  }

  // New posts in bulk.
  for (const batch of chunk(prepared.filter((p) => p.existingId === null))) {
    const { data, error } = await client
      .from('posts')
      .insert(batch.map((item) => item.row))
      .select('id, slug');

    if (error) {
      throw new Error(`Failed to insert posts: ${error.message}`);
    }

    const idBySlug = new Map((data ?? []).map((row) => [row.slug, row.id]));

    for (const item of batch) {
      const id = idBySlug.get(item.slug);
      if (!id) continue;
      report.created.push(item.slug);
      linkTerms(id, item.terms);
    }
  }

  await replacePostTerms(client, termPairs, touchedPostIds);

  return report;
}
