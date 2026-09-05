'use client';

import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { TableKit } from '@tiptap/extension-table';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useState } from 'react';

import type { MediaOptions } from '@/lib/queries';
import { MediaPicker } from './media-picker';

/**
 * The post body editor.
 *
 * The enabled extensions must stay aligned with the allowlist in
 * packages/core/src/sanitize.ts. Anything the editor can produce that the
 * sanitiser strips is silent data loss at save time — the author sees it in the
 * editor, saves, and it vanishes.
 *
 * THE RULE RUNS BOTH WAYS, and the second direction is the one that bit us.
 * Anything the SANITISER allows but the editor cannot represent is data loss at
 * LOAD time: ProseMirror parses incoming HTML against its schema and silently
 * drops what it has no node for, so opening such a post and saving it writes
 * the loss back to the database.
 *
 * That is exactly what happened to tables. The sanitiser has allowed
 * table/thead/tbody/tr/th/td since the beginning and the importer carried them
 * through intact — but there was no table extension here, so every imported
 * table survived the import and died the first time someone opened the post in
 * this editor. `posts.original_html` is the only reason they are recoverable.
 *
 * Alignments to preserve:
 *   - Headings start at h2. The sanitiser drops h1 because the page template
 *     owns the only h1 on the page.
 *   - Link and Image are explicit because the sanitiser allows <a> and <img>.
 *   - TableKit is configured `resizable: false`. Column resizing writes
 *     `colwidth` attributes and a <colgroup> of inline styles, and the
 *     sanitiser allows neither `style` anywhere nor `colwidth` on cells — so
 *     resizing would appear to work and be gone on save. Widening the
 *     allowlist for it would trade a real XSS boundary for a nicety; tables
 *     render full-width on the blog regardless.
 */

function ToolbarButton({
  editor: _editor,
  onClick,
  active,
  children,
  label,
}: {
  editor: Editor;
  onClick: () => void;
  active: boolean;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`rounded px-2 py-1 text-sm ${
        active ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  name,
  defaultValue,
  media,
}: {
  name: string;
  defaultValue: string;
  media: MediaOptions;
}) {
  const [html, setHtml] = useState(defaultValue);
  const [picking, setPicking] = useState(false);

  const editor = useEditor({
    // Required under SSR: rendering immediately causes a hydration mismatch.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4, 5, 6] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        // Matches the sanitiser's allowed schemes.
        protocols: ['http', 'https', 'mailto', 'tel'],
      }),
      Image.configure({ inline: false }),
      /*
       * resizable: false — see the note at the top. Also `HTMLAttributes: {}`
       * by default, so no editor-only classes reach the stored HTML.
       */
      TableKit.configure({ table: { resizable: false } }),
    ],
    content: defaultValue,
    onUpdate: ({ editor: instance }) => setHtml(instance.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose-editor min-h-[24rem] focus:outline-none',
      },
    },
  });

  if (!editor) {
    return (
      <div className="min-h-[24rem] rounded border border-slate-300 p-3 text-sm text-slate-500">
        Loading editor…
      </div>
    );
  }

  const addLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', previous ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  /*
   * Opens the picker instead of prompting for a URL twice.
   *
   * `window.prompt` required the image to already be uploaded somewhere and its
   * URL copied by hand — the same trip through the Media library the featured
   * image field had, plus a step.
   */
  const insertImage = (src: string, alt: string) => {
    setPicking(false);
    editor.chain().focus().setImage({ src, alt }).run();
  };

  return (
    <div className="rounded border border-slate-300">
      <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2">
        <ToolbarButton
          editor={editor}
          label="Bold"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          label="Italic"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </ToolbarButton>
        {[2, 3, 4].map((level) => (
          <ToolbarButton
            key={level}
            editor={editor}
            label={`Heading ${level}`}
            active={editor.isActive('heading', { level })}
            onClick={() =>
              editor
                .chain()
                .focus()
                .toggleHeading({ level: level as 2 | 3 | 4 })
                .run()
            }
          >
            H{level}
          </ToolbarButton>
        ))}
        <ToolbarButton
          editor={editor}
          label="Bullet list"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          label="Numbered list"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          label="Quote"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          Quote
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          label="Code block"
          active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          Code
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          label="Link"
          active={editor.isActive('link')}
          onClick={addLink}
        >
          Link
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          label="Image"
          active={picking}
          onClick={() => setPicking((open) => !open)}
        >
          Image
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          label="Insert table"
          active={editor.isActive('table')}
          onClick={() =>
            editor
              .chain()
              .focus()
              // A header row by default: the blog styles <th> distinctly, and a
              // table whose first row is not marked up as headers is the single
              // most common accessibility fault in pasted content.
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          Table
        </ToolbarButton>
      </div>

      {/*
        Table controls, shown only inside a table.

        A second row rather than six more buttons in the main toolbar: every one
        of these is meaningless with the caret anywhere else, and a permanently
        visible row of disabled buttons is noise on every post that has no
        table at all.
      */}
      {editor.isActive('table') ? (
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-100 p-2">
          <span className="mr-1 text-xs font-medium text-slate-500">Table</span>
          <ToolbarButton
            editor={editor}
            label="Add row below"
            active={false}
            onClick={() => editor.chain().focus().addRowAfter().run()}
          >
            + Row
          </ToolbarButton>
          <ToolbarButton
            editor={editor}
            label="Add column to the right"
            active={false}
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          >
            + Column
          </ToolbarButton>
          <ToolbarButton
            editor={editor}
            label="Delete row"
            active={false}
            onClick={() => editor.chain().focus().deleteRow().run()}
          >
            − Row
          </ToolbarButton>
          <ToolbarButton
            editor={editor}
            label="Delete column"
            active={false}
            onClick={() => editor.chain().focus().deleteColumn().run()}
          >
            − Column
          </ToolbarButton>
          <ToolbarButton
            editor={editor}
            label="Toggle header row"
            active={editor.isActive('tableHeader')}
            onClick={() => editor.chain().focus().toggleHeaderRow().run()}
          >
            Header row
          </ToolbarButton>
          <ToolbarButton
            editor={editor}
            label="Merge or split cells"
            active={false}
            onClick={() => editor.chain().focus().mergeOrSplit().run()}
          >
            Merge/split
          </ToolbarButton>
          <ToolbarButton
            editor={editor}
            label="Delete table"
            active={false}
            onClick={() => editor.chain().focus().deleteTable().run()}
          >
            Delete table
          </ToolbarButton>
        </div>
      ) : null}

      {/*
        Mounted between the toolbar and the body so choosing an image does not
        push the caret out of view. Not a modal: this component already sits
        inside the post form, and a dialog would need focus management to stay
        keyboard-usable for what is a two-click task.
      */}
      {picking ? (
        <div className="border-b border-slate-200 bg-slate-50 p-3">
          <MediaPicker
            media={media}
            selectedId=""
            allowNone={false}
            label="Choose an image to insert, or drop a file here to upload."
            onSelect={(item) => {
              if (item) insertImage(item.url, item.alt ?? '');
            }}
          />
        </div>
      ) : null}

      <div className="p-3">
        <EditorContent editor={editor} />
      </div>

      {/* The form posts this, not the contenteditable itself. */}
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
