'use client';

import { useActionState, useState } from 'react';

import {
  flattenTermTree,
  postPath,
  type CtaBlockView,
  type SiteRow,
  type TermRow,
} from '@blog/core';

import { Alert } from '@/components/ui/alert';
import type { MediaOptions } from '@/lib/queries';

import { savePost, type SavePostState } from '@/app/actions/posts';
import { FeaturedImagePicker } from './featured-image-picker';
import { RichTextEditor } from './rich-text-editor';
import { StructuredDataPanel } from './structured-data-panel';

const INITIAL: SavePostState = {};

export interface PostFormValues {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content_html: string;
  status: string;
  author_name: string;
  bylineId: string | null;
  seo_title: string;
  seo_description: string;
  noindex: boolean;
  /** One pretty-printed JSON-LD node per snippet, in emission order. */
  structuredData: string[];
  termIds: string[];
  featuredImageId: string | null;
}

export function PostForm({
  site,
  terms,
  media,
  authors,
  ctaBlocks,
  values,
}: {
  site: SiteRow;
  terms: TermRow[];
  media: MediaOptions;
  authors: Array<{ id: string; name: string }>;
  /** Active CTA blocks, for the editor's insert menu and its node views. */
  ctaBlocks: CtaBlockView[];
  values: PostFormValues;
}) {
  const [state, formAction, pending] = useActionState(savePost, INITIAL);
  const [slug, setSlug] = useState(values.slug);

  // Categories nest, so they render indented in tree order. Tags never do.
  const categories = flattenTermTree(terms.filter((term) => term.kind === 'category'));
  const tags = terms.filter((term) => term.kind === 'tag');

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      {state.error ? (
        <Alert tone="error">
          {state.error}
        </Alert>
      ) : null}

      {state.warning ? (
        <Alert tone="warning">
          {state.warning}
        </Alert>
      ) : null}

      {state.savedId && !state.warning ? (
        <Alert tone="success">
          Saved and the live site was refreshed.
        </Alert>
      ) : null}

      <div>
        <label htmlFor="title" className="label">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={values.title}
          className="field text-lg"
        />
      </div>

      <div>
        <label htmlFor="slug" className="label">
          URL slug
        </label>
        <input
          id="slug"
          name="slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="derived from the title if left blank"
          className="field font-mono"
        />
        {slug.includes('/') ? (
          <p className="mt-1 text-xs text-danger-ink">
            A slug is one URL segment. Posts already live under <code>/blog/</code> — enter
            just the last part.
          </p>
        ) : null}
        <p className="mt-1 text-xs text-ink-muted">
          {values.id ? (
            <>
              Changing this breaks existing links to{' '}
              <code>
                {site.base_url}
                {postPath(slug)}
              </code>
              . Add a redirect if you do.
            </>
          ) : (
            <>
              Becomes{' '}
              <code>
                {site.base_url}
                {postPath(slug || 'your-post')}
              </code>
            </>
          )}
        </p>
      </div>

      <div>
        <span className="label">Body</span>
        <div className="mt-1">
          <RichTextEditor
            name="content_html"
            defaultValue={values.content_html}
            media={media}
            ctaBlocks={ctaBlocks}
          />
        </div>
      </div>

      <div>
        <label htmlFor="excerpt" className="label">
          Excerpt
        </label>
        <textarea
          id="excerpt"
          name="excerpt"
          rows={2}
          defaultValue={values.excerpt}
          placeholder="Generated from the opening of the body if left blank"
          className="field"
        />
      </div>

      <FeaturedImagePicker media={media} defaultValue={values.featuredImageId} />

      {authors.length > 0 ? (
        <div>
          <label htmlFor="byline_id" className="label">
            Author
          </label>
          <select
            id="byline_id"
            name="byline_id"
            defaultValue={values.bylineId ?? ''}
            className="field field-inline"
          >
            <option value="">(use the Byline field)</option>
            {authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink-muted">
            Shows the author&apos;s photo and name on the post. Manage them under{' '}
            <a href="/authors">Authors</a>.
          </p>
        </div>
      ) : null}

      {categories.length > 0 ? (
        <fieldset>
          <legend className="text-sm font-medium">Categories</legend>
          <p className="mt-1 text-sm text-ink-muted">
            Tick the most specific one. A parent category&apos;s archive also lists posts
            from its subcategories.
          </p>
          <div className="mt-2 flex flex-col gap-1.5">
            {categories.map(({ term, depth }) => (
              <label
                key={term.id}
                className="flex items-center gap-1.5 text-sm"
                style={{ paddingLeft: `${depth * 1.25}rem` }}
              >
                <input
                  type="checkbox"
                  name="term_ids"
                  value={term.id}
                  defaultChecked={values.termIds.includes(term.id)}
                />
                {depth > 0 ? (
                  <span aria-hidden="true" className="text-ink-muted">
                    └
                  </span>
                ) : null}
                {term.name}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {tags.length > 0 ? (
        <fieldset>
          <legend className="text-sm font-medium">Tags</legend>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
            {tags.map((term) => (
              <label key={term.id} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  name="term_ids"
                  value={term.id}
                  defaultChecked={values.termIds.includes(term.id)}
                />
                #{term.name}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <details className="rounded border border-line px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium">SEO overrides</summary>
        <div className="mt-3 flex flex-col gap-3">
          <div>
            <label htmlFor="seo_title" className="block text-sm">
              Title tag
            </label>
            <input
              id="seo_title"
              name="seo_title"
              defaultValue={values.seo_title}
              placeholder="Defaults to the post title"
              className="field"
            />
          </div>
          <div>
            <label htmlFor="seo_description" className="block text-sm">
              Meta description
            </label>
            <textarea
              id="seo_description"
              name="seo_description"
              rows={2}
              defaultValue={values.seo_description}
              placeholder="Defaults to the excerpt"
              className="field"
            />
          </div>
          <div>
            <label htmlFor="author_name" className="block text-sm">
              Byline (fallback)
            </label>
            <input
              id="author_name"
              name="author_name"
              defaultValue={values.author_name}
              className="field"
            />
            <p className="mt-1 text-xs text-ink-muted">
              Used only when no Author is selected above. Imported posts arrive with
              this filled in and no author record, which is why it stays.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="noindex" defaultChecked={values.noindex} />
            Ask search engines not to index this post
          </label>
        </div>
      </details>

      <StructuredDataPanel variant="post" defaultSnippets={values.structuredData} />

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <label htmlFor="status" className="text-sm font-medium">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={values.status}
          className="field field-sm field-inline"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>

        <button
          type="submit"
          disabled={pending || slug.includes('/')}
          className="btn btn-primary"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>

        {values.id && values.status === 'published' ? (
          <a
            href={`${site.base_url}${postPath(slug)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline"
          >
            View live ↗
          </a>
        ) : null}
      </div>
    </form>
  );
}
