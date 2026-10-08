'use client';

import { ctaMarker, type CtaBlockView } from '@blog/core';
import { CtaBlock, CtaLinkButton, buttonClass, THEME_SKINS } from '@blog/ui';
import { mergeAttributes, Node } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';

/**
 * The in-content CTA block, as a Tiptap node.
 *
 * The FIRST custom node in this editor, and the shape is dictated by what gets
 * stored: a block is referenced in the body by an empty div carrying its slug,
 * `<div data-cta="…"></div>`, which is all `sanitizePostHtml` keeps. So the
 * node is an ATOM — it has no content of its own, and everything shown here is
 * read from the database at render time, not from the document.
 *
 * That is also why the node view renders the REAL `<CtaBlock>` from @blog/ui
 * rather than a grey placeholder: the author is choosing where a specific piece
 * of design goes, and a box saying "CTA: blended-rate-calculator" tells them
 * nothing about whether it belongs at that point in the article.
 */

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    ctaBlock: {
      insertCtaBlock: (slug: string) => ReturnType;
    };
  }
}

export interface CtaNodeOptions {
  /** Every active block on the site, so the node view can render one. */
  blocks: Map<string, CtaBlockView>;
}

function CtaNodeView({ node, extension, selected, deleteNode }: NodeViewProps) {
  const slug = String(node.attrs.slug ?? '');
  const options = extension.options as CtaNodeOptions;
  const block = options.blocks.get(slug);

  return (
    /*
     * `contentEditable={false}` via NodeViewWrapper's atom handling, plus a
     * ring when selected: an atom gives no caret feedback of its own, so
     * without this there is no way to tell a selected block from an unselected
     * one before pressing Delete.
     */
    <NodeViewWrapper
      className={`relative my-4 rounded-2xl ${selected ? 'ring-2 ring-brand ring-offset-2' : ''}`}
      data-drag-handle
    >
      {block ? (
        <CtaBlock
          block={block}
          action={
            block.kind === 'email' ? (
              /*
               * A STAND-IN for the capture form, not the form itself. Rendering
               * the real one inside a contenteditable puts focusable inputs in
               * a document whose selection model does not own them — clicking
               * the field fights the editor for the caret. It is the same size
               * and the same button, which is what the author is judging.
               */
              <span className="flex items-center gap-2">
                <span
                  className={`rounded-full border px-5 py-3 text-sm ${
                    THEME_SKINS[block.theme].dark
                      ? 'border-white/25 text-white/50'
                      : 'border-[var(--cta-line)] text-[var(--cta-ink-muted)]'
                  }`}
                >
                  you@example.com
                </span>
                <span className={buttonClass(THEME_SKINS[block.theme].dark)}>
                  {block.buttonLabel}
                </span>
              </span>
            ) : (
              <CtaLinkButton block={block} />
            )
          }
        />
      ) : (
        /*
         * The block is gone — deleted, deactivated, or renamed.
         *
         * The reader sees nothing at this point in the article, so the author
         * has to: a marker that renders as blank in the editor as well is one
         * nobody will ever find and remove.
         */
        <div className="rounded-2xl border border-dashed border-danger bg-surface px-5 py-4 text-sm">
          <p className="font-medium text-ink">
            No active CTA block called <code>{slug}</code>
          </p>
          <p className="mt-1 text-ink-muted">
            It was deleted, renamed, or switched off. Readers see nothing here.
          </p>
          <button
            type="button"
            onClick={deleteNode}
            className="btn btn-ghost btn-sm mt-3"
          >
            Remove this block
          </button>
        </div>
      )}
    </NodeViewWrapper>
  );
}

export const CtaNode = Node.create<CtaNodeOptions>({
  name: 'ctaBlock',
  group: 'block',
  atom: true,
  draggable: true,
  // Without this the node is editable-adjacent and the caret can land "inside"
  // something with no content to put it in.
  selectable: true,

  addOptions() {
    return { blocks: new Map() };
  },

  addAttributes() {
    return {
      slug: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-cta'),
        renderHTML: (attributes) => ({ 'data-cta': attributes.slug }),
      },
    };
  },

  /*
   * Matches what the sanitiser lets through, and nothing else. `getAttrs`
   * returning false means "not this node", so an ordinary div is left alone.
   */
  parseHTML() {
    return [
      {
        tag: 'div[data-cta]',
        getAttrs: (element) =>
          (element as HTMLElement).getAttribute('data-cta') ? null : false,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CtaNodeView);
  },

  addCommands() {
    return {
      insertCtaBlock:
        (slug: string) =>
        ({ commands }) =>
          commands.insertContent(ctaMarker(slug)),
    };
  },
});
