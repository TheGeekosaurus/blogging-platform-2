'use client';

import { useActionState, useState } from 'react';

import { pagePath, type PageRow, type SiteRow } from '@blog/core';

import { Alert } from '@/components/ui/alert';
import { BuilderSection } from '@/components/workspace/section';
import { Workspace } from '@/components/workspace/workspace';
import { savePage, type SavePageState } from '@/app/actions/pages';
import { StructuredDataPanel } from './editor/structured-data-panel';
import type { PageListItem } from '@/lib/queries';

const INITIAL: SavePageState = {};

/* The form IS the sidebar; the bar's controls and the HTML field reach it by
   `form=`. See the note in post-form.tsx — the page screen also carries a
   delete form, and HTML does not nest forms. */
const FORM_ID = 'page-form';

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
  danger,
}: {
  site: SiteRow;
  parents: PageListItem[];
  values: PageFormValues;
  /** The delete form — a SIBLING of this one, never a child. */
  danger?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(savePage, INITIAL);
  const [slug, setSlug] = useState(values.slug);
  const [parentId, setParentId] = useState(values.parent_id);

  const [status, setStatus] = useState(values.status);
  const [open, setOpen] = useState<Record<string, boolean>>({ url: true });
  const toggle = (id: string) =>
    setOpen((current) => ({ ...current, [id]: !current[id] }));

  /* A closed section cannot report a validity error. See cta-builder.tsx. */
  function onInvalid(event: React.FormEvent) {
    const control = event.target as HTMLElement & { reportValidity?: () => void };
    const section = control.closest<HTMLElement>('[data-section]');
    if (!section) return;
    const id = section.dataset.section!;
    if (open[id]) return;
    event.preventDefault();
    setOpen((current) => ({ ...current, [id]: true }));
    setTimeout(() => {
      control.focus();
      control.reportValidity?.();
    }, 0);
  }

  const badSlug = slug.includes('/');
  const parentPath = parents.find((p) => p.id === parentId)?.path ?? '';
  const previewPath = [parentPath, slug || 'page-slug'].filter(Boolean).join('/');


  return (
    <Workspace
      backHref="/pages"
      backLabel="All pages"
      name={
        <>
          <h1 className="sr-only">{values.title || 'New page'}</h1>
          <label htmlFor="title" className="sr-only">
            Title
          </label>
          <input
            id="title"
            name="title"
            form={FORM_ID}
            required
            defaultValue={values.title}
            placeholder="Untitled page"
            className="builder-name"
          />
        </>
      }
      status={
        <>
          <label htmlFor="status" className="sr-only">
            Status
          </label>
          <select
            id="status"
            name="status"
            form={FORM_ID}
            defaultValue={values.status}
            onChange={(event) => setStatus(event.target.value)}
            className="field field-sm field-inline shrink-0"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          {values.id && values.path && status === 'published' ? (
            <a
              href={`${site.base_url}${pagePath(values.path)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm shrink-0"
            >
              View live ↗
            </a>
          ) : null}
        </>
      }
      actions={
        <>
          {badSlug ? (
            <button
              type="button"
              onClick={() => setOpen((current) => ({ ...current, url: true }))}
              className="chip chip-danger shrink-0"
            >
              Fix the slug
            </button>
          ) : null}
          <a href="/pages" className="btn btn-ghost btn-sm shrink-0">
            Cancel
          </a>
          <button
            type="submit"
            form={FORM_ID}
            disabled={pending || badSlug}
            className="btn btn-primary btn-sm shrink-0"
          >
            {pending ? 'Saving…' : 'Save'}
          </button>
        </>
      }
      sidebar={
        <div className="builder-side">
          <form
            id={FORM_ID}
            action={formAction}
            onInvalidCapture={onInvalid}
            className="contents"
          >
            {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

            {state.error ? <Alert tone="error">{state.error}</Alert> : null}
            {state.savedId ? (
              <Alert tone="success">Saved and the live site was refreshed.</Alert>
            ) : null}

            <BuilderSection
              id="url"
              title="Address"
              summary={previewPath}
              open={!!open.url}
              onToggle={toggle}
            >
              <div className="builder-stack">
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
                  <p className="hint mt-1">
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
                  {badSlug ? (
                    <p className="mt-1 text-xs text-danger-ink">
                      A slug is one URL segment — remove the &quot;/&quot; and pick a
                      parent instead.
                    </p>
                  ) : null}
                </div>

                <p className="hint break-words rounded bg-surface px-3 py-2">
                  URL:{' '}
                  <code>
                    {site.base_url}
                    {pagePath(previewPath)}
                  </code>
                </p>
              </div>
            </BuilderSection>

            <BuilderSection
              id="template"
              title="Template"
              summary={values.template === 'full' ? 'Full width' : 'Prose'}
              open={!!open.template}
              onToggle={toggle}
            >
              <label htmlFor="template" className="label">
                Layout
              </label>
              <select
                id="template"
                name="template"
                defaultValue={values.template}
                className="field"
              >
                <option value="prose">Prose — centred column, blog styling</option>
                <option value="full">Full width — page supplies its own layout</option>
              </select>
              <p className="hint mt-1">
                Choose Full width for a landing page that brings its own CSS. Prose
                wraps the content in the site&apos;s reading column.
              </p>
            </BuilderSection>

            <BuilderSection id="seo" title="SEO" open={!!open.seo} onToggle={toggle}>
              <div className="builder-stack">
                <div>
                  <label htmlFor="seo_title" className="label">
                    Title tag
                  </label>
                  <input
                    id="seo_title"
                    name="seo_title"
                    defaultValue={values.seo_title}
                    placeholder="Defaults to the page title"
                    className="field"
                  />
                </div>
                <div>
                  <label htmlFor="seo_description" className="label">
                    Meta description
                  </label>
                  <textarea
                    id="seo_description"
                    name="seo_description"
                    rows={3}
                    defaultValue={values.seo_description}
                    className="field"
                  />
                </div>
                <label className="builder-check">
                  <input type="checkbox" name="noindex" defaultChecked={values.noindex} />
                  <span>Ask search engines not to index this page</span>
                </label>
              </div>
            </BuilderSection>

            <BuilderSection
              id="schema"
              title="Structured data"
              summary={
                values.structuredData.length ? `${values.structuredData.length}` : undefined
              }
              open={!!open.schema}
              onToggle={toggle}
            >
              <StructuredDataPanel variant="page" defaultSnippets={values.structuredData} />
            </BuilderSection>
          </form>

          {danger}
        </div>
      }
    >
      {/*
        THE HTML GETS THE STAGE. A plain textarea, deliberately: page content is
        typically a generated layout blob, and round-tripping it through a rich
        text editor would quietly rewrite the markup and destroy the design.
        What it gets instead is room — it was 22 rows in a column of form
        fields, which is a window onto a document, not a document.
      */}
      <div className="builder-stage">
        <div className="builder-stage-inner builder-write">
          <div className="flex min-h-0 flex-1 flex-col rounded-control border border-line bg-surface">
            <label htmlFor="content_html" className="label border-b border-line px-3 py-2">
              HTML
            </label>
            <textarea
              id="content_html"
              name="content_html"
              form={FORM_ID}
              defaultValue={values.content_html}
              spellCheck={false}
              className="min-h-0 flex-1 resize-none border-0 bg-transparent p-3 font-mono text-sm text-ink focus:outline-none"
              placeholder="<section>…</section>"
            />
            <p className="hint border-t border-line px-3 py-2">
              Paste HTML. <code>&lt;style&gt;</code>, classes and inline styles are kept;
              scripts and event handlers are stripped on save.
            </p>
          </div>
        </div>
      </div>
    </Workspace>
  );
}
