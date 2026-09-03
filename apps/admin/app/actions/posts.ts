'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  excerptFor,
  readingMinutes,
  sanitizePostHtml,
  slugify,
  type PostStatus,
} from '@blog/core';

import { requireCurrentSite } from '@/lib/current-site';
import { revalidateSite } from '@/lib/revalidate';
import { createClient } from '@/lib/supabase/server';

export interface SavePostState {
  error?: string;
  /** Set when the post saved but the live site could not be refreshed. */
  warning?: string;
  savedId?: string;
}

const STATUSES: PostStatus[] = ['draft', 'scheduled', 'published', 'archived'];

function readStatus(value: FormDataEntryValue | null): PostStatus {
  const raw = String(value ?? 'draft');
  return STATUSES.includes(raw as PostStatus) ? (raw as PostStatus) : 'draft';
}

/**
 * Create or update a post.
 *
 * Order matters here: content is sanitised BEFORE it is stored, because the
 * public renderer echoes content_html through dangerouslySetInnerHTML with no
 * read-time sanitisation. Anything unsafe stored here runs in a reader's browser.
 */
export async function savePost(
  _prev: SavePostState,
  formData: FormData,
): Promise<SavePostState> {
  const site = await requireCurrentSite();
  const supabase = await createClient();

  const id = String(formData.get('id') ?? '').trim() || null;
  const title = String(formData.get('title') ?? '').trim();
  const rawHtml = String(formData.get('content_html') ?? '');
  const status = readStatus(formData.get('status'));
  const termIds = formData.getAll('term_ids').map(String).filter(Boolean);

  if (!title) return { error: 'A title is required.' };

  // Slug is only derived for a NEW post. Editing never silently rewrites an
  // existing slug — that would break inbound links and search rankings.
  const submittedSlug = String(formData.get('slug') ?? '').trim();

  // A path typed here used to be flattened silently: "/blog/test-post" became
  // "blog-test-post", producing a URL nobody asked for. Posts always live at
  // /blog/<slug>, so a slash in the slug is always a mistake.
  if (submittedSlug.includes('/')) {
    return {
      error:
        'A slug is a single URL segment and cannot contain "/". ' +
        'Posts are always published under /blog/, so just enter the last part.',
    };
  }

  const slug = submittedSlug ? slugify(submittedSlug) : slugify(title);

  const contentHtml = sanitizePostHtml(rawHtml);
  const submittedExcerpt = String(formData.get('excerpt') ?? '').trim();

  const row = {
    site_id: site.id,
    title,
    slug,
    content_html: contentHtml,
    excerpt: submittedExcerpt || excerptFor({ excerpt: null, content_html: contentHtml }, 300),
    reading_minutes: readingMinutes(contentHtml),
    status,
    author_name: String(formData.get('author_name') ?? '').trim() || null,
    // Empty string means "no author record"; the column is a nullable FK, so ''
    // would be rejected as a malformed uuid. Same reasoning as featured_image_id.
    byline_id: String(formData.get('byline_id') ?? '').trim() || null,
    // Empty string means "no image" — the column is a nullable FK, so '' would
    // be rejected as a malformed uuid rather than read as null.
    featured_image_id: String(formData.get('featured_image_id') ?? '').trim() || null,
    seo_title: String(formData.get('seo_title') ?? '').trim() || null,
    seo_description: String(formData.get('seo_description') ?? '').trim() || null,
    noindex: formData.get('noindex') === 'on',
  };

  let postId = id;
  let previousSlug: string | null = null;

  if (id) {
    const { data: existing, error: readError } = await supabase
      .from('posts')
      .select('slug, published_at, status')
      .eq('id', id)
      .eq('site_id', site.id)
      .maybeSingle();

    if (readError) return { error: `Could not load the post: ${readError.message}` };
    if (!existing) return { error: 'That post no longer exists.' };

    previousSlug = existing.slug;

    // published_at is set once, on the first transition to published, and then
    // left alone — republishing an edit must not restamp it to today and
    // reorder the archive.
    const publishedAt =
      status === 'published' && !existing.published_at
        ? new Date().toISOString()
        : existing.published_at;

    const { error } = await supabase
      .from('posts')
      .update({ ...row, published_at: publishedAt })
      .eq('id', id)
      .eq('site_id', site.id);

    if (error) return { error: describeWriteError(error.message) };
  } else {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        ...row,
        published_at: status === 'published' ? new Date().toISOString() : null,
      })
      .select('id')
      .single();

    if (error) return { error: describeWriteError(error.message) };
    postId = data.id;
  }

  if (!postId) return { error: 'Save failed for an unknown reason.' };

  const termError = await replaceTerms(postId, termIds);
  if (termError) return { error: termError };

  revalidatePath('/posts');
  revalidatePath(`/posts/${postId}`);

  // The DB write is already committed and is never rolled back if this fails.
  // Losing a post because a cache purge failed would be far worse than serving
  // a stale page for a moment.
  const refresh = await revalidateSite(site, { type: 'post', slug });
  const staleWarning = previousSlug && previousSlug !== slug
    ? await revalidateSite(site, { type: 'post', slug: previousSlug })
    : { ok: true as const };

  if (!refresh.ok || !staleWarning.ok) {
    return {
      savedId: postId,
      warning:
        `Saved, but the live site was not refreshed: ${refresh.error ?? staleWarning.error}. ` +
        `Use "Flush cache" in site settings once the blog is reachable.`,
    };
  }

  return { savedId: postId };
}

async function replaceTerms(postId: string, termIds: string[]): Promise<string | null> {
  const supabase = await createClient();

  const { error: clearError } = await supabase
    .from('post_terms')
    .delete()
    .eq('post_id', postId);

  if (clearError) return `Could not update categories: ${clearError.message}`;
  if (termIds.length === 0) return null;

  const { error } = await supabase
    .from('post_terms')
    .insert(termIds.map((termId) => ({ post_id: postId, term_id: termId })));

  return error ? `Could not update categories: ${error.message}` : null;
}

/** Turn Postgres constraint noise into something an author can act on. */
function describeWriteError(message: string): string {
  if (message.includes('posts_slug_per_site_unique')) {
    return 'Another post on this site already uses that URL slug. Choose a different one.';
  }
  if (message.includes('posts_slug_valid')) {
    return 'That slug is not usable — it cannot be empty or contain spaces or slashes.';
  }
  if (message.includes('row-level security')) {
    return 'You do not have permission to write to this site.';
  }
  return message;
}

export async function deletePost(formData: FormData) {
  const site = await requireCurrentSite();
  const supabase = await createClient();

  const id = String(formData.get('id') ?? '');
  const slug = String(formData.get('slug') ?? '');

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)
    .eq('site_id', site.id);

  if (error) throw new Error(`Could not delete the post: ${error.message}`);

  if (slug) await revalidateSite(site, { type: 'post', slug });

  revalidatePath('/posts');
  redirect('/posts');
}
