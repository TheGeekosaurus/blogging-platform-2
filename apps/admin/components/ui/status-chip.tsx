import type { PostStatus } from '@blog/core';

/**
 * Whether a post or page is live.
 *
 * `STATUS_STYLES` was declared three times — Posts, Pages and Links — with the
 * same four entries each time, and the wrapper class `rounded px-1.5 py-0.5
 * text-xs font-medium` was typed out at four call sites. All seven reached
 * into Tailwind's raw palette (`bg-emerald-100 text-emerald-900`) rather than
 * the chips, so the admin showed two different greens for "published" and
 * "live" depending on which screen you were on.
 *
 * The chip pairs are the measured ones; see the -ink tokens in globals.css.
 */
const CHIP: Record<PostStatus, string> = {
  published: 'chip-success',
  draft: 'chip-neutral',
  scheduled: 'chip-info',
  archived: 'chip-warning',
};

export function StatusChip({ status }: { status: PostStatus }) {
  return <span className={`chip ${CHIP[status]}`}>{status}</span>;
}
