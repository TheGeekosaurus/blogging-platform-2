'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { sanitizePageHtml, slugify, type PageTemplate, type PostStatus } from '@blog/core';

import { requireCurrentSite } from '@/lib/current-site';
import { revalidateSite } from '@/lib/revalidate';
import { createClient } from '@/lib/supabase/server';

export interface SavePageState {
  error?: string;
  warning?: string;
  savedId?: string;
}

const STATUSES: PostStatus[] = ['draft', 'scheduled', 'published', 'archived'];
const TEMPLATES: PageTemplate[] = ['prose', 'full'];

/**
 * Create or update a page.
 *
 * Content goes through sanitizePageHtml, NOT sanitizePostHtml: a page keeps its
 * `<style>` and layout attributes, because these are marketing pages that carry
 * their own design. Script execution is still stripped.
 */
export async function savePage(
  _prev: SavePageState,
  formData: FormData,
): Promise<SavePageState> {
  const site = await requireCurrentSite();
  const supabase = await createClient();

  const id = String(formData.get('id') ?? '').trim() || null;
  const title = String(formData.get('title') ?? '').trim();
  const rawSlug = String(formData.get('slug') ?? '').trim();

  if (!title) return { error: 'A title is required.' };

  // Nesting is chosen with the parent picker. A path typed into the slug field
  // would otherwise be flattened into one segment — the exact confusion that
  // turned "/blog/test-post" into "blog-test-post".
  if (rawSlug.includes('/')) {
    return {
      error:
        'A slug is a single URL segment and cannot contain "/". ' +
        'To nest this page, choose a parent below.',
    };
  }

  const slug = slugify(rawSlug || title);
  const parentId = String(formData.get('parent_id') ?? '').trim() || null;

  if (id && parentId === id) {
    return { error: 'A page cannot be its own parent.' };
  }

  const statusRaw = String(formData.get('status') ?? 'draft');
  const status = STATUSES.includes(statusRaw as PostStatus)
    ? (statusRaw as PostStatus)
    : 'draft';

  const templateRaw = String(formData.get('template') ?? 'prose');
  const template = TEMPLATES.includes(templateRaw as PageTemplate)
    ? (templateRaw as PageTemplate)
    : 'prose';

  const submitted = String(formData.get('content_html') ?? '');

  const row = {
    site_id: site.id,
    title,
    slug,
    parent_id: parentId,
    template,
    status,
    content_html: sanitizePageHtml(submitted),
    // Kept verbatim so a sanitiser change can be re-applied to the original
    // rather than to already-stripped output.
    original_html: submitted,
    seo_title: String(formData.get('seo_title') ?? '').trim() || null,
    seo_description: String(formData.get('seo_description') ?? '').trim() || null,
    noindex: formData.get('noindex') === 'on',
  };

  let pageId = id;
  let previousPath: string | null = null;

  if (id) {
    const { data: existing, error: readError } = await supabase
      .from('pages')
      .select('path, published_at')
      .eq('id', id)
      .eq('site_id', site.id)
      .maybeSingle();

    if (readError) return { error: `Could not load the page: ${readError.message}` };
    if (!existing) return { error: 'That page no longer exists.' };

    previousPath = existing.path;

    const publishedAt =
      status === 'published' && !existing.published_at
        ? new Date().toISOString()
        : existing.published_at;

    const { error } = await supabase
      .from('pages')
      .update({ ...row, published_at: publishedAt })
      .eq('id', id)
      .eq('site_id', site.id);

    if (error) return { error: describePageError(error.message) };
  } else {
    const { data, error } = await supabase
      .from('pages')
      .insert({
        ...row,
        published_at: status === 'published' ? new Date().toISOString() : null,
      })
      .select('id')
      .single();

    if (error) return { error: describePageError(error.message) };
    pageId = data.id;
  }

  if (!pageId) return { error: 'Save failed for an unknown reason.' };

  // Read back the path: the database computes it from the parent chain, so this
  // is the only reliable source after a re-parent.
  const { data: saved } = await supabase
    .from('pages')
    .select('path')
    .eq('id', pageId)
    .maybeSingle();

  revalidatePath('/pages');
  revalidatePath(`/pages/${pageId}`);

  const refresh = await revalidateSite(site, {
    type: 'page',
    path: saved?.path ?? previousPath ?? '',
  });

  if (!refresh.ok) {
    return {
      savedId: pageId,
      warning:
        `Saved, but the live site was not refreshed: ${refresh.error}. ` +
        `Use "Flush cache" in site settings once the site is reachable.`,
    };
  }

  return { savedId: pageId };
}

function describePageError(message: string): string {
  if (message.includes('pages_slug_per_parent')) {
    return 'Another page in the same place already uses that slug. Change the slug or the parent.';
  }
  if (message.includes('pages_path_unique')) {
    return 'That URL is already taken by another page.';
  }
  if (message.includes('cycle') || message.includes('ancestor')) {
    return 'That parent would put the page inside its own subtree.';
  }
  if (message.includes('pages_slug_valid')) {
    return 'That slug is not usable — it cannot be empty or contain spaces or slashes.';
  }
  if (message.includes('row-level security')) {
    return 'You do not have permission to write to this site.';
  }
  return message;
}

export async function deletePage(formData: FormData) {
  const site = await requireCurrentSite();
  const supabase = await createClient();

  const id = String(formData.get('id') ?? '');
  const path = String(formData.get('path') ?? '');

  // Child pages cascade in the database, so this removes the whole subtree.
  const { error } = await supabase
    .from('pages')
    .delete()
    .eq('id', id)
    .eq('site_id', site.id);

  if (error) throw new Error(`Could not delete the page: ${error.message}`);

  if (path) await revalidateSite(site, { type: 'page', path });

  revalidatePath('/pages');
  redirect('/pages');
}

/** Point the site's homepage at a page, or clear it. */
export async function setHomepage(formData: FormData) {
  const site = await requireCurrentSite();
  const supabase = await createClient();

  const raw = String(formData.get('page_id') ?? '').trim();

  const { error } = await supabase
    .from('sites')
    .update({ homepage_page_id: raw || null })
    .eq('id', site.id);

  if (error) throw new Error(`Could not set the homepage: ${error.message}`);

  revalidatePath('/pages');
  await revalidateSite(site, { type: 'page', path: '' });
}
