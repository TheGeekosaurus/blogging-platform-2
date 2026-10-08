'use client';

import { useActionState, useState } from 'react';

import { pagePath, type PageRow, type SiteRow } from '@blog/core';

import { Alert } from '@/components/ui/alert';
import { savePage, type SavePageState } from '@/app/actions/pages';
import { StructuredDataPanel } from './editor/structured-data-panel';
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
  /** One pretty-printed JSON-LD node per snippet, in emission order. */
  structuredData: string[];
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="parent_id" className="label">
            Parent page
          </label>
          <select
            id="parent_id"
            name="parent_id"
            value={parentId}
            onChange={(event) => setParentId(event.target.value)}
            className="field"
          >
            <option value="">(top level)</option>
            {parents.map((page) => (
              <option key={page.id} value={page.id}>
                /{page.path}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink-muted">
            Nesting is set here, not by typing a path into the slug.
          </p>
        </div>

        <div>
          <label htmlFor="slug" className="label">
            Slug
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
              A slug is one URL segment — remove the &quot;/&quot; and pick a parent instead.
            </p>
          ) : null}
        </div>
      </div>

      <p className="rounded bg-canvas px-3 py-2 text-xs text-ink-muted">
        URL:{' '}
        <code>
          {site.base_url}
          {pagePath(previewPath)}
        </code>
      </p>

      <div>
        <label htmlFor="template" className="label">
          Template
        </label>
        <select
          id="template"
          name="template"
          defaultValue={values.template}
          className="field field-inline"
        >
          <option value="prose">Prose — centred column, blog styling</option>
          <option value="full">Full width — page supplies its own layout</option>
        </select>
        <p className="mt-1 text-xs text-ink-muted">
          Choose Full width for a landing page that brings its own CSS. Prose wraps the
          content in the site&apos;s reading column.
        </p>
      </div>

      <div>
        <label htmlFor="content_html" className="label">
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
          className="field field-sm font-mono"
          placeholder="<section>…</section>"
        />
        <p className="mt-1 text-xs text-ink-muted">
          Paste HTML. <code>&lt;style&gt;</code>, classes and inline styles are kept;
          scripts and event handlers are stripped on save.
        </p>
      </div>

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
              className="field"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="noindex" defaultChecked={values.noindex} />
            Ask search engines not to index this page
          </label>
        </div>
      </details>

      <StructuredDataPanel variant="page" defaultSnippets={values.structuredData} />

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
