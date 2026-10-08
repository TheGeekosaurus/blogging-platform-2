'use client';

import type { CtaBlockView } from '@blog/core';

import { CTA_LABELS } from './cta-picker-labels';

/**
 * Choose which CTA block to drop in at the caret.
 *
 * A list rather than a select, because the thing being picked has a shape: the
 * layout and theme are most of what distinguishes two blocks with similar
 * names, and a dropdown showing only "Blended rate calculator" makes the author
 * insert, look, undo, and try the next one.
 */
export function CtaPicker({
  blocks,
  onPick,
}: {
  blocks: CtaBlockView[];
  onPick: (slug: string) => void;
}) {
  if (blocks.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        No active CTA blocks yet. Build one under <strong>CTAs</strong>, then
        come back and drop it in.
      </p>
    );
  }

  return (
    <ul className="grid list-none grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {blocks.map((block) => (
        <li key={block.slug}>
          <button
            type="button"
            onClick={() => onPick(block.slug)}
            className="w-full rounded-control border border-line bg-surface px-3 py-2 text-left transition-colors hover:border-brand hover:bg-brand-softer"
          >
            <span className="block truncate text-sm font-medium text-ink">
              {block.heading}
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-1">
              <span className="chip chip-neutral">{CTA_LABELS.layout[block.layout]}</span>
              <span className="chip chip-neutral">{CTA_LABELS.theme[block.theme]}</span>
              <span className="chip chip-brand">
                {block.kind === 'email' ? 'Email' : 'Link'}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
