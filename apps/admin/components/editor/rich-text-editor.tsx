'use client';

import Image from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { useState } from 'react';

import type { MediaOptions } from '@/lib/queries';
import { LinkEditor } from './link-editor';
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
 * THE CHROME FOLLOWS THE CARET. Every control used to live in one bar at the
 * very top, which is fine on a short post and useless on a long one: select a
 * word two thousand pixels down, scroll all the way up to find the button,
 * scroll back to see what happened. Two things fix that — the toolbar is
 * sticky, so it stays on screen while the body scrolls under it, and a bubble
 * appears beside the selection with the formats that apply to selected text.
 * Neither replaces the other: the bubble is for what you have highlighted, the
 * toolbar for what you are about to type.
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

/** What the toolbar and bubble highlight. Summarised to drive re-renders. */
const MARK_NAMES = [
  'bold',
  'italic',
  'link',
  'bulletList',
  'orderedList',
  'blockquote',
  'codeBlock',
  'table',
  'tableHeader',
];

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
  /*
   * Whether the link editor is open. Kept here rather than inside the bubble
   * because the toolbar button opens it too, and because the bubble must stay
   * visible while the URL field has focus — see shouldShow below.
   */
  const [editingLink, setEditingLink] = useState(false);

  const editor = useEditor({
    // Required under SSR: rendering immediately causes a hydration mismatch.
    immediatelyRender: false,
    extensions: [
      /*
       * Link is configured THROUGH StarterKit, not registered beside it.
       *
       * StarterKit already bundles the Link extension, so importing
       * @tiptap/extension-link and adding it to this array registered a second
       * mark under the same name. Tiptap warned about it in the console —
       * "Duplicate extension names found: ['link']" — and nothing else did:
       * links still rendered, and editing them behaved unpredictably because
       * two marks were competing for the same name. That is the likeliest
       * reason clicking a link never showed its URL.
       */
      StarterKit.configure({
        heading: { levels: [2, 3, 4, 5, 6] },
        link: {
          openOnClick: false,
          autolink: true,
          // Matches the sanitiser's allowed schemes — see LINK_SCHEMES.
          protocols: ['http', 'https', 'mailto', 'tel'],
        },
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

  /*
   * Re-render when what the caret is SITTING IN changes.
   *
   * Without a subscription this component re-rendered only from `setHtml` in
   * onUpdate, which fires on content changes — so every `editor.isActive(...)`
   * read below described wherever the selection used to be. Bold stayed
   * highlighted after clicking away from bold text, and clicking into an
   * existing link left the button saying "Link" instead of "Edit link",
   * because the render that would have noticed never happened.
   *
   * The selector returns a STRING, not the transaction number. Selecting on
   * the transaction number re-renders on every transaction — including the
   * ones BubbleMenu dispatches as it repositions itself — and that is a render
   * loop: React aborted it with "Maximum update depth exceeded". A summary of
   * the active marks changes only when the answer actually changes, so the
   * cycle has nowhere to run.
   */
  useEditorState({
    editor,
    selector: ({ editor: instance }) => {
      if (!instance) return '';
      const marks = MARK_NAMES.filter((name) => instance.isActive(name));
      const levels = [2, 3, 4].filter((level) => instance.isActive('heading', { level }));
      return `${marks.join(',')}|${levels.join('')}`;
    },
  });

  if (!editor) {
    return (
      <div className="min-h-[24rem] rounded border border-slate-300 p-3 text-sm text-slate-500">
        Loading editor…
      </div>
    );
  }

  /*
   * Opens the inline editor instead of window.prompt. The prompt did pass the
   * existing href as a default, but a browser prompt renders that as
   * pre-selected text in a strip at the top of the window — nowhere near the
   * link and indistinguishable from a placeholder. See link-editor.tsx.
   */
  const openLinkEditor = () => {
    // Select the whole link first, so the editor reads the mark's href rather
    // than whatever the caret happens to sit between.
    editor.chain().focus().extendMarkRange('link').run();
    setEditingLink(true);
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
      {/*
        Sticky, so the controls stay reachable on a long post instead of
        scrolling away at the top. `top-0` because the dashboard has no fixed
        header to clear — the left rail is what is pinned, not a bar. An opaque
        background is not decoration here: the body scrolls UNDER this.

        The table row is inside the same sticky box rather than sticking on its
        own, so the two never separate and leave a floating strip behind.
      */}
      <div className="sticky top-0 z-20 rounded-t bg-slate-50">
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
          onClick={openLinkEditor}
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
      </div>

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

      {/*
        The bubble. Appears beside the selection, which is the whole point —
        the formats that apply to highlighted text, where the highlighted text
        is.

        `shouldShow` is doing real work. Tiptap's default hides the bubble
        whenever the selection is empty, which would close the link editor the
        instant the URL field took focus, so the third clause keeps it open
        while `editingLink` is set. The second shows it for a CARET inside a
        link with nothing selected, which is how you discover and fix an
        existing link — the case Denis hit, where selecting imported link text
        and pressing the toolbar button told him nothing about what was already
        there.
      */}
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
            {/*
              H2 and H3 only. The bubble is for the handful of things worth
              reaching without moving your eyes; the full set stays in the
              toolbar, which is now always on screen anyway.
            */}
            {[2, 3].map((level) => (
              <ToolbarButton
                key={level}
                editor={editor}
                label={`Heading ${level}`}
                active={editor.isActive('heading', { level })}
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .toggleHeading({ level: level as 2 | 3 })
                    .run()
                }
              >
                H{level}
              </ToolbarButton>
            ))}
            <ToolbarButton
              editor={editor}
              label={editor.isActive('link') ? 'Edit link' : 'Add link'}
              active={editor.isActive('link')}
              onClick={openLinkEditor}
            >
              {/* Says which it is, so an existing link is obvious before you click. */}
              {editor.isActive('link') ? 'Edit link' : 'Link'}
            </ToolbarButton>
          </>
        )}
      </BubbleMenu>

      <div className="p-3">
        <EditorContent editor={editor} />
      </div>

      {/* The form posts this, not the contenteditable itself. */}
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
