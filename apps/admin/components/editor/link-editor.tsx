'use client';

import { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';

import { normaliseLinkHref } from '@blog/core';

/**
 * Editing a link, in place.
 *
 * Replaces `window.prompt`, which was failing at the one job it had. The prompt
 * passed the existing href as its default value, but a browser prompt shows
 * that as pre-selected text in a strip at the top of the window — miles from
 * the link, impossible to tell apart from a placeholder, and gone the moment
 * you type. Denis's report was that it "doesn't show me what link is already in
 * there", which is what that amounts to in practice.
 *
 * So the URL is now a real input, next to the link, with the current value in
 * it and Remove and Open beside it.
 *
 * Validation happens HERE rather than at save time because the sanitiser's
 * scheme list is not advisory: a `javascript:` or `ftp:` href is stripped on
 * write, and the author would see their text quietly un-linked with nothing
 * explaining why. normaliseLinkHref shares that list — see @blog/core.
 */
export function LinkEditor({
  editor,
  onClose,
}: {
  editor: Editor;
  onClose: () => void;
}) {
  /*
   * Read the href ONCE, when the editor opens.
   *
   * Not derived on every render: typing in the field changes the selection's
   * stored marks in ways that would fight a controlled value read back out of
   * the document.
   */
  const [value, setValue] = useState(
    () => (editor.getAttributes('link').href as string | undefined) ?? '',
  );
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const existing = Boolean(editor.getAttributes('link').href);

  useEffect(() => {
    // Focus and select, so typing replaces the old URL and Enter keeps it.
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function save() {
    const result = normaliseLinkHref(value);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    /*
     * extendMarkRange first. Without it, applying a link to a caret sitting
     * INSIDE an existing link only rewrites the part after the cursor, leaving
     * one visual link that is secretly two marks with different hrefs.
     */
    editor.chain().focus().extendMarkRange('link').setLink({ href: result.href }).run();
    onClose();
  }

  function remove() {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    onClose();
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            /*
             * Handled here rather than letting them bubble: this sits inside
             * the post form, so Enter would otherwise submit the whole post,
             * and Escape would reach the editor and move the selection out
             * from under the link being edited.
             */
            if (event.key === 'Enter') {
              event.preventDefault();
              save();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              onClose();
            }
          }}
          placeholder="https://example.com/page"
          aria-label="Link URL"
          aria-invalid={error ? true : undefined}
          className="w-72 rounded border border-slate-300 px-2 py-1 font-mono text-xs"
        />

        <button
          type="button"
          onClick={save}
          className="rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white"
        >
          {existing ? 'Update' : 'Add'}
        </button>

        {existing ? (
          <>
            <button
              type="button"
              onClick={remove}
              className="rounded px-2 py-1 text-xs text-red-700 hover:bg-red-50"
            >
              Remove
            </button>
            {/*
              Checks the CURRENT stored href, not the input: opening what you
              are halfway through typing is never what you meant.
            */}
            <a
              href={(editor.getAttributes('link').href as string) ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
            >
              Open ↗
            </a>
          </>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>

      {error ? (
        <p role="alert" className="max-w-md text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
