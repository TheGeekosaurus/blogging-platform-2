'use client';

import { useState } from 'react';

import {
  AUTO_POST_SCHEMAS,
  MAX_SNIPPETS,
  SCHEMA_TEMPLATES,
  parseSnippet,
} from '@blog/core';

/**
 * Schema.org markup, added and edited by hand.
 *
 * The mechanism worth understanding: THE TEXTAREAS ARE THE FORM FIELDS. Each
 * one carries name="structured_data", and the server action reads them with
 * formData.getAll('structured_data'), which returns them in document order.
 * That is the same idiom the category checkboxes use (all named term_ids).
 *
 * So there are no hidden inputs here, unlike featured-image-picker or the rich
 * text editor — those have to mirror a widget's state into a field, and this
 * has no widget to mirror. Removing a snippet removes its textarea and there
 * is nothing left over to keep in sync, which is the one bug class a panel
 * like this would otherwise have.
 *
 * Validation comes from parseSnippet in @blog/core, the same function the
 * server action gates on. A panel with its own rules would eventually call
 * something valid that the save then refused, and an author would have no way
 * to tell which of the two was right.
 */

export type StructuredDataVariant = 'post' | 'page' | 'site';

interface Snippet {
  key: string;
  text: string;
}

/*
 * A counter, not crypto.randomUUID(): this runs during SSR too, and a fresh id
 * per render pass would differ between the server's HTML and the client's
 * hydration. Keys only need to be unique within one list.
 */
let sequence = 0;
function nextKey(): string {
  sequence += 1;
  return `snippet-${sequence}`;
}

const INTRO: Record<StructuredDataVariant, string> = {
  post: 'Extra schema.org markup for this post, on top of what is generated automatically.',
  page: 'Schema.org markup for this page. Pages get none automatically — a page can be any shape, so there is nothing to infer.',
  site: 'Schema.org markup emitted on every page of the site. This is where Organization and Website belong.',
};

export function StructuredDataPanel({
  variant,
  defaultSnippets,
}: {
  variant: StructuredDataVariant;
  /** Stored nodes, already pretty-printed by the server component. */
  defaultSnippets: string[];
}) {
  const [snippets, setSnippets] = useState<Snippet[]>(() =>
    defaultSnippets.map((text) => ({ key: nextKey(), text })),
  );
  const [templateId, setTemplateId] = useState(SCHEMA_TEMPLATES[0]!.id);

  const full = snippets.length >= MAX_SNIPPETS;

  function add() {
    const template = SCHEMA_TEMPLATES.find((item) => item.id === templateId);
    if (!template || full) return;

    setSnippets((current) => [...current, { key: nextKey(), text: template.json }]);
  }

  return (
    <details className="rounded border border-slate-200 px-4 py-3">
      <summary className="cursor-pointer text-sm font-medium">
        Schema markup{snippets.length > 0 ? ` (${snippets.length})` : ''}
      </summary>

      <div className="mt-3 flex flex-col gap-4">
        <p className="text-xs text-slate-500">{INTRO[variant]}</p>

        {variant === 'post' ? (
          <div className="rounded bg-slate-50 px-3 py-2">
            <p className="text-xs font-medium text-slate-700">
              Added automatically — no need to add these yourself
            </p>
            <ul className="mt-1 flex flex-col gap-0.5">
              {AUTO_POST_SCHEMAS.map((auto) => (
                <li key={auto.type} className="text-xs text-slate-500">
                  <code className="font-mono text-slate-700">{auto.type}</code> — {auto.summary}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {snippets.map((snippet, index) => (
          <SnippetCard
            key={snippet.key}
            index={index}
            text={snippet.text}
            onChange={(text) =>
              setSnippets((current) =>
                current.map((item) => (item.key === snippet.key ? { ...item, text } : item)),
              )
            }
            onRemove={() =>
              setSnippets((current) => current.filter((item) => item.key !== snippet.key))
            }
          />
        ))}

        {/*
          A select plus a button, matching NewTermForm. Not a popup menu: there
          is no menu primitive in this app, and one built from scratch would
          need its own focus and keyboard handling to match what a native
          select already does.
        */}
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor={`schema-template-${variant}`} className="block text-sm">
              Add a snippet
            </label>
            <select
              id={`schema-template-${variant}`}
              value={templateId}
              onChange={(event) => setTemplateId(event.target.value)}
              className="mt-1 rounded border border-slate-300 px-2 py-2 text-sm"
            >
              {SCHEMA_TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={add}
            disabled={full}
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            + Add
          </button>

          {full ? (
            <p className="text-xs text-slate-500">
              {MAX_SNIPPETS} is the limit. These are inlined into every copy of the page.
            </p>
          ) : null}
        </div>
      </div>
    </details>
  );
}

function SnippetCard({
  index,
  text,
  onChange,
  onRemove,
}: {
  index: number;
  text: string;
  onChange: (text: string) => void;
  onRemove: () => void;
}) {
  const blank = !text.trim();
  const result = blank ? null : parseSnippet(text);
  const label = result?.ok ? result.label : `Snippet ${index + 1}`;

  return (
    <div className="rounded border border-slate-200">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
        <span className="font-mono text-xs font-medium text-slate-700">{label}</span>
        <button type="button" onClick={onRemove} className="text-xs text-red-700 underline">
          Remove
        </button>
      </div>

      {/*
        font-mono / spellCheck off / no autocorrect, matching the page HTML
        field. The name is what makes this a form field at all — see the
        component docstring.
      */}
      <textarea
        name="structured_data"
        aria-label={`Schema snippet ${index + 1}`}
        rows={Math.min(24, Math.max(6, text.split('\n').length + 1))}
        value={text}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        className="w-full resize-y border-0 px-3 py-2 font-mono text-xs focus:outline-none"
        placeholder='{ "@type": "FAQPage" }'
      />

      <div className="border-t border-slate-200 px-3 py-1.5">
        {blank ? (
          <p className="text-xs text-slate-500">
            Empty — this snippet is dropped when you save.
          </p>
        ) : result?.ok ? (
          <p className="text-xs text-emerald-700">Valid JSON-LD · {result.label}</p>
        ) : (
          <p className="text-xs text-red-700">{result?.error}</p>
        )}
      </div>
    </div>
  );
}
