'use client';

import { useActionState, useState } from 'react';

import { flattenTermTree, postPath, type SiteRow, type TermRow } from '@blog/core';

import type { MediaOptions } from '@/lib/queries';

import { savePost, type SavePostState } from '@/app/actions/posts';
import { FeaturedImagePicker } from './featured-image-picker';
import { RichTextEditor } from './rich-text-editor';

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
  termIds: string[];
  featuredImageId: string | null;
}

export function PostForm({
  site,
  terms,
  media,
  authors,
  values,
}: {
  site: SiteRow;
  terms: TermRow[];
  media: MediaOptions;
  authors: Array<{ id: string; name: string }>;
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
        <p role="alert" className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          {state.error}
        </p>
      ) : null}

      {state.warning ? (
        <p role="alert" className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {state.warning}
        </p>
      ) : null}

      {state.savedId && !state.warning ? (
        <p className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Saved and the live site was refreshed.
        </p>
      ) : null}

      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={values.title}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-lg"
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium">
          URL slug
        </label>
        <input
          id="slug"
          name="slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="derived from the title if left blank"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-mono text-sm"
        />
        {slug.includes('/') ? (
          <p className="mt-1 text-xs text-red-700">
            A slug is one URL segment. Posts already live under <code>/blog/</code> — enter
            just the last part.
          </p>
        ) : null}
        <p className="mt-1 text-xs text-slate-500">
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
        <span className="block text-sm font-medium">Body</span>
        <div className="mt-1">
          <RichTextEditor
            name="content_html"
            defaultValue={values.content_html}
            media={media}
          />
        </div>
      </div>

      <div>
        <label htmlFor="excerpt" className="block text-sm font-medium">
          Excerpt
        </label>
        <textarea
          id="excerpt"
          name="excerpt"
          rows={2}
          defaultValue={values.excerpt}
          placeholder="Generated from the opening of the body if left blank"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <FeaturedImagePicker media={media} defaultValue={values.featuredImageId} />

      {authors.length > 0 ? (
        <div>
          <label htmlFor="byline_id" className="block text-sm font-medium">
            Author
          </label>
          <select
            id="byline_id"
            name="byline_id"
            defaultValue={values.bylineId ?? ''}
            className="mt-1 rounded border border-slate-300 px-2 py-2 text-sm"
          >
            <option value="">(use the Byline field)</option>
            {authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Shows the author&apos;s photo and name on the post. Manage them under{' '}
            <a href="/authors">Authors</a>.
          </p>
        </div>
      ) : null}

      {categories.length > 0 ? (
        <fieldset>
          <legend className="text-sm font-medium">Categories</legend>
          <p className="mt-1 text-sm text-slate-600">
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
                  <span aria-hidden="true" className="text-slate-400">
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

      <details className="rounded border border-slate-200 px-4 py-3">
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
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
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
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
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
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">
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

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
        <label htmlFor="status" className="text-sm font-medium">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={values.status}
          className="rounded border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>

        <button
          type="submit"
          disabled={pending || slug.includes('/')}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
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
