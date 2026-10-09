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
import { BuilderSection } from '@/components/workspace/section';
import { Workspace } from '@/components/workspace/workspace';
import type { MediaOptions } from '@/lib/queries';

import { savePost, type SavePostState } from '@/app/actions/posts';
import { FeaturedImagePicker } from './featured-image-picker';
import { RichTextEditor } from './rich-text-editor';
import { StructuredDataPanel } from './structured-data-panel';

const INITIAL: SavePostState = {};

/*
 * The form IS the sidebar, and the bar's controls and the body reach it by
 * `form=`. Same arrangement as the CTA builder, for the same reason: the post
 * page also carries a delete form, and HTML does not nest forms — the parser
 * drops the inner one and its button becomes a submit button of the outer, so
 * Delete would run Save.
 */
const FORM_ID = 'post-form';

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
  danger,
}: {
  site: SiteRow;
  terms: TermRow[];
  media: MediaOptions;
  authors: Array<{ id: string; name: string }>;
  /** Active CTA blocks, for the editor's insert menu and its node views. */
  ctaBlocks: CtaBlockView[];
  values: PostFormValues;
  /**
   * The delete form, server-rendered and passed in. A SIBLING of this screen's
   * form rather than a child, because HTML does not nest forms — the parser
   * drops the inner one and its button becomes a submit button of the outer,
   * so Delete would run Save.
   */
  danger?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(savePost, INITIAL);
  const [slug, setSlug] = useState(values.slug);
  const [status, setStatus] = useState(values.status);
  const [open, setOpen] = useState<Record<string, boolean>>({ url: true });
  const toggle = (id: string) =>
    setOpen((current) => ({ ...current, [id]: !current[id] }));

  /* A closed section cannot report a validity error — the browser will not
     focus display:none. See the long note in cta-builder.tsx. */
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

  // Categories nest, so they render indented in tree order. Tags never do.
  const categories = flattenTermTree(terms.filter((term) => term.kind === 'category'));
  const tags = terms.filter((term) => term.kind === 'tag');


  return (
    <Workspace
      backHref="/posts"
      backLabel="All posts"
      name={
        <>
          {/*
            The heading the bar does not otherwise have: the title is an
            <input>, and an editable field is not a heading however much it
            looks like one. Carries the title as it was on open; a heading that
            changes under you as you type is worse than one a moment stale.
          */}
          <h1 className="sr-only">{values.title || 'New post'}</h1>
          <label htmlFor="title" className="sr-only">
            Title
          </label>
          <input
            id="title"
            name="title"
            form={FORM_ID}
            required
            defaultValue={values.title}
            placeholder="Untitled post"
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

          {values.id && status === 'published' ? (
            <a
              href={`${site.base_url}${postPath(slug)}`}
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
          {/*
            Why Save is off, said where Save is. The slug lives in a section
            that can be closed, and a disabled button with the explanation
            folded away inside it is a dead end.
          */}
          {badSlug ? (
            <button
              type="button"
              onClick={() => setOpen((current) => ({ ...current, url: true }))}
              className="chip chip-danger shrink-0"
            >
              Fix the slug
            </button>
          ) : null}
          <a href="/posts" className="btn btn-ghost btn-sm shrink-0">
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
        /*
          The column is the scroller; the form inside it is `display: contents`
          so it lays out nothing of its own. That is what lets the delete form
          sit beside it as a sibling, in the same scrolling column, without
          either being inside the other.
        */
        <div className="builder-side">
        <form
          id={FORM_ID}
          action={formAction}
          onInvalidCapture={onInvalid}
          className="contents"
        >
          {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

          {state.error ? <Alert tone="error">{state.error}</Alert> : null}
          {state.warning ? <Alert tone="warning">{state.warning}</Alert> : null}
          {state.savedId && !state.warning ? (
            <Alert tone="success">Saved and the live site was refreshed.</Alert>
          ) : null}

          <BuilderSection id="url" title="Address" summary={slug || undefined} open={!!open.url} onToggle={toggle}>
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
              {badSlug ? (
                <p className="mt-1 text-xs text-danger-ink">
                  A slug is one URL segment. Posts already live under{' '}
                  <code>/blog/</code> — enter just the last part.
                </p>
              ) : null}
              <p className="hint mt-1 break-words">
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
          </BuilderSection>

          <BuilderSection id="excerpt" title="Excerpt" open={!!open.excerpt} onToggle={toggle}>
            <label htmlFor="excerpt" className="label">
              Summary
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              rows={4}
              defaultValue={values.excerpt}
              placeholder="Generated from the opening of the body if left blank"
              className="field"
            />
          </BuilderSection>

          <BuilderSection id="image" title="Featured image" open={!!open.image} onToggle={toggle}>
            <FeaturedImagePicker media={media} defaultValue={values.featuredImageId} />
          </BuilderSection>

          {authors.length > 0 ? (
            <BuilderSection id="author" title="Author" open={!!open.author} onToggle={toggle}>
              <label htmlFor="byline_id" className="label">
                Shown on the post
              </label>
              <select
                id="byline_id"
                name="byline_id"
                defaultValue={values.bylineId ?? ''}
                className="field"
              >
                <option value="">(use the Byline field)</option>
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
              <p className="hint mt-1">
                Shows the author&apos;s photo and name on the post. Manage them under{' '}
                <a href="/authors">Authors</a>.
              </p>
            </BuilderSection>
          ) : null}

          {categories.length > 0 || tags.length > 0 ? (
            <BuilderSection
              id="terms"
              title="Categories & tags"
              summary={`${values.termIds.length || 'none'}`}
              open={!!open.terms}
              onToggle={toggle}
            >
              <div className="builder-stack">
                {categories.length > 0 ? (
                  <fieldset>
                    <legend className="label">Categories</legend>
                    <p className="hint">
                      Tick the most specific one. A parent category&apos;s archive also
                      lists posts from its subcategories.
                    </p>
                    <div className="mt-2 flex max-h-56 flex-col gap-1.5 overflow-y-auto">
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
                    <legend className="label">Tags</legend>
                    <div className="mt-2 flex max-h-48 flex-wrap gap-x-4 gap-y-2 overflow-y-auto">
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
              </div>
            </BuilderSection>
          ) : null}

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
                  placeholder="Defaults to the post title"
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
                  placeholder="Defaults to the excerpt"
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="author_name" className="label">
                  Byline (fallback)
                </label>
                <input
                  id="author_name"
                  name="author_name"
                  defaultValue={values.author_name}
                  className="field"
                />
                <p className="hint mt-1">
                  Used only when no Author is selected. Imported posts arrive with this
                  filled in and no author record, which is why it stays.
                </p>
              </div>
              <label className="builder-check">
                <input type="checkbox" name="noindex" defaultChecked={values.noindex} />
                <span>Ask search engines not to index this post</span>
              </label>
            </div>
          </BuilderSection>

          <BuilderSection
            id="schema"
            title="Structured data"
            summary={values.structuredData.length ? `${values.structuredData.length}` : undefined}
            open={!!open.schema}
            onToggle={toggle}
          >
            <StructuredDataPanel variant="post" defaultSnippets={values.structuredData} />
          </BuilderSection>
        </form>

        {danger}
        </div>
      }
    >
      {/*
        THE BODY GETS THE STAGE, which is the whole point of the rearrangement:
        it used to be one field among a dozen in a single column, about a third
        of the way down. Everything else is a setting about the post; this is
        the post.

        Its own scroll, so the sidebar never moves under it — and the editor's
        toolbar is `sticky top-0`, which now pins to the top of THIS box rather
        than to a page that no longer scrolls.
      */}
      <div className="builder-stage">
        <div className="builder-stage-inner builder-write">
          <RichTextEditor
            name="content_html"
            formId={FORM_ID}
            defaultValue={values.content_html}
            media={media}
            ctaBlocks={ctaBlocks}
          />
        </div>
      </div>
    </Workspace>
  );
}
