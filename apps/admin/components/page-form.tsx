'use client';

import { useActionState, useState } from 'react';

import { pagePath, type PageRow, type SiteRow } from '@blog/core';

import { savePage, type SavePageState } from '@/app/actions/pages';
import type { PageListItem } from '@/lib/queries';

const INITIAL: SavePageState = {};

export interface PageFormValues {
  id?: string;
  title: string;
  slug: string;
  parent_id: string;
  template: PageRow['template'];
  status: string;
  content_html: string;
  seo_title: string;
  seo_description: string;
  noindex: boolean;
  /** Current live path, for the preview line. */
  path?: string;
}

export function PageForm({
  site,
  parents,
  values,
}: {
  site: SiteRow;
  parents: PageListItem[];
  values: PageFormValues;
}) {
  const [state, formAction, pending] = useActionState(savePage, INITIAL);
  const [slug, setSlug] = useState(values.slug);
  const [parentId, setParentId] = useState(values.parent_id);

  const parentPath = parents.find((p) => p.id === parentId)?.path ?? '';
  const previewPath = [parentPath, slug || 'page-slug'].filter(Boolean).join('/');

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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="parent_id" className="block text-sm font-medium">
            Parent page
          </label>
          <select
            id="parent_id"
            name="parent_id"
            value={parentId}
            onChange={(event) => setParentId(event.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-2 text-sm"
          >
            <option value="">(top level)</option>
            {parents.map((page) => (
              <option key={page.id} value={page.id}>
                /{page.path}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Nesting is set here, not by typing a path into the slug.
          </p>
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium">
            Slug
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
              A slug is one URL segment — remove the &quot;/&quot; and pick a parent instead.
            </p>
          ) : null}
        </div>
      </div>

      <p className="rounded bg-slate-50 px-3 py-2 text-xs text-slate-600">
        URL:{' '}
        <code>
          {site.base_url}
          {pagePath(previewPath)}
        </code>
      </p>

      <div>
        <label htmlFor="template" className="block text-sm font-medium">
          Template
        </label>
        <select
          id="template"
          name="template"
          defaultValue={values.template}
          className="mt-1 rounded border border-slate-300 px-2 py-2 text-sm"
        >
          <option value="prose">Prose — centred column, blog styling</option>
          <option value="full">Full width — page supplies its own layout</option>
        </select>
        <p className="mt-1 text-xs text-slate-500">
          Choose Full width for a landing page that brings its own CSS. Prose wraps the
          content in the site&apos;s reading column.
        </p>
      </div>

      <div>
        <label htmlFor="content_html" className="block text-sm font-medium">
          HTML
        </label>
        {/*
          A plain textarea, deliberately. Page content is typically a generated
          layout blob; round-tripping it through a rich text editor would quietly
          rewrite the markup and destroy the design.
        */}
        <textarea
          id="content_html"
          name="content_html"
          rows={22}
          defaultValue={values.content_html}
          spellCheck={false}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-mono text-xs"
          placeholder="<section>…</section>"
        />
        <p className="mt-1 text-xs text-slate-500">
          Paste HTML. <code>&lt;style&gt;</code>, classes and inline styles are kept;
          scripts and event handlers are stripped on save.
        </p>
      </div>

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
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="noindex" defaultChecked={values.noindex} />
            Ask search engines not to index this page
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

        {values.id && values.path && values.status === 'published' ? (
          <a
            href={`${site.base_url}${pagePath(values.path)}`}
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
