'use client';

import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { useState } from 'react';

import { LinkEditor } from './link-editor';

/**
 * A one-field editor for a prose FRAGMENT — an author's role line or bio.
 *
 * Separate from RichTextEditor rather than a variant of it, because almost
 * nothing carries over: headings, lists, quotes, code blocks, images and tables
 * are all meaningless in a sentence that renders inside someone else's byline
 * row. What it shares is the part worth sharing — the same LinkEditor, so
 * adding a link works identically in both places.
 *
 * The schema is deliberately narrower than the field could hold, and it matches
 * sanitizeAuthorHtml exactly. That alignment is the whole safety property here:
 * a mark the editor can produce that the sanitiser strips is silent data loss
 * at save time, and a tag the sanitiser allows that the editor cannot represent
 * is silent loss at LOAD time. Both have bitten this codebase already.
 *
 * `singleLine` disables Enter. A role line that wraps to two paragraphs breaks
 * the byline layout it sits in, and there is no way to see that from here.
 */
export function InlineTextEditor({
  name,
  defaultValue,
  singleLine = false,
  placeholder,
  describedBy,
}: {
  name: string;
  defaultValue: string;
  singleLine?: boolean;
  placeholder?: string;
  describedBy?: string;
}) {
  const [html, setHtml] = useState(defaultValue);
  const [editingLink, setEditingLink] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Everything a fragment has no use for. Explicit `false` rather than a
        // narrower kit so the list reads as a decision.
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        strike: false,
        link: {
          openOnClick: false,
          autolink: true,
          protocols: ['http', 'https', 'mailto', 'tel'],
        },
      }),
    ],
    content: defaultValue,
    onUpdate: ({ editor: instance }) => {
      /*
       * getHTML wraps in <p>. Stored as-is: sanitizeAuthorHtml disallows <p>
       * and unwraps it, so the column keeps the fragment rather than a
       * paragraph. Unwrapping here as well would be a second place to get it
       * wrong.
       */
      setHtml(instance.isEmpty ? '' : instance.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose-editor focus:outline-none' +
          (singleLine ? ' inline-field-single' : ' min-h-[5rem]'),
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
      },
      handleKeyDown: (_view, event) => {
        // Return true to swallow it. This sits inside the author form, so a
        // bare Enter would otherwise submit the whole form.
        if (singleLine && event.key === 'Enter') return true;
        return false;
      },
    },
  });

  // Same reason as the post editor: without a subscription every isActive()
  // read below describes the previous selection.
  useEditorState({
    editor,
    selector: ({ editor: instance }) =>
      instance
        ? `${instance.isActive('bold')}${instance.isActive('italic')}${instance.isActive('link')}`
        : '',
  });

  if (!editor) {
    return (
      <div className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  const openLinkEditor = () => {
    editor.chain().focus().extendMarkRange('link').run();
    setEditingLink(true);
  };

  return (
    <div className="mt-1 rounded border border-slate-300">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1">
        <MarkButton
          label="Bold"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </MarkButton>
        <MarkButton
          label="Italic"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </MarkButton>
        <MarkButton
          label={editor.isActive('link') ? 'Edit link' : 'Add link'}
          active={editor.isActive('link')}
          onClick={openLinkEditor}
        >
          {editor.isActive('link') ? 'Edit link' : 'Link'}
        </MarkButton>

        {placeholder ? (
          <span className="ml-auto text-xs text-slate-500">{placeholder}</span>
        ) : null}
      </div>

      <BubbleMenu
        editor={editor}
        shouldShow={({ editor: instance, from, to }) =>
          editingLink || instance.isActive('link') || from !== to
        }
        className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white p-1 shadow-lg"
      >
        {editingLink ? (
          <LinkEditor editor={editor} onClose={() => setEditingLink(false)} />
        ) : (
          <>
            <MarkButton
              label="Bold"
              active={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <strong>B</strong>
            </MarkButton>
            <MarkButton
              label="Italic"
              active={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <em>I</em>
            </MarkButton>
            <MarkButton
              label={editor.isActive('link') ? 'Edit link' : 'Add link'}
              active={editor.isActive('link')}
              onClick={openLinkEditor}
            >
              {editor.isActive('link') ? 'Edit link' : 'Link'}
            </MarkButton>
          </>
        )}
      </BubbleMenu>

      <div className="px-3 py-2">
        <EditorContent editor={editor} />
      </div>

      {/* The form posts this, not the contenteditable. */}
      <input type="hidden" name={name} value={html} />
    </div>
  );
}

function MarkButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`rounded px-2 py-0.5 text-sm ${
        active ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}
