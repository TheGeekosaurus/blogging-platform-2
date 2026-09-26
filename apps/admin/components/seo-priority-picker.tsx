'use client';

import { useActionState } from 'react';

import { SEO_PRIORITIES, SEO_PRIORITY_LABELS, type SeoPagePriority } from '@blog/core';

import { setPagePriority, type SeoPageState } from '@/app/actions/seo';

const INITIAL: SeoPageState = {};

/**
 * Set a planned page's priority.
 *
 * Lives INSIDE the row's disclosure, not in its summary. A <summary> toggles on
 * any click it receives, so a select placed there would open and close the row
 * every time someone tried to change the value — and a control that fights the
 * thing it sits in is worse than one extra click. The summary carries the chip;
 * this changes it.
 *
 * Modelled on CategoryParentPicker: select plus an explicit submit rather than
 * submitting on change, so the control works without JavaScript and a stray
 * keyboard arrow does not silently rewrite the queue.
 */
export function SeoPriorityPicker({
  pageId,
  priority,
}: {
  pageId: string;
  priority: SeoPagePriority | null;
}) {
  const [state, formAction, pending] = useActionState(setPagePriority, INITIAL);

  return (
    <form action={formAction} className="flex items-center gap-1.5">
      <input type="hidden" name="id" value={pageId} />

      <label
        htmlFor={`priority-${pageId}`}
        className="text-xs font-semibold uppercase tracking-wide text-[#787c82]"
      >
        Priority
      </label>
      <select
        id={`priority-${pageId}`}
        name="priority"
        defaultValue={priority ?? ''}
        disabled={pending}
        className="rounded border border-slate-300 px-1.5 py-1 text-xs"
      >
        {/* First, and empty-valued, so clearing a rank is as easy as setting
            one. `parsePriority` turns this into a null write. */}
        <option value="">Not ranked</option>
        {SEO_PRIORITIES.map((value) => (
          <option key={value} value={value}>
            {SEO_PRIORITY_LABELS[value]}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={pending}
        className="text-xs underline disabled:opacity-60"
      >
        Save
      </button>

      {state.error ? (
        <span role="alert" className="text-xs text-red-700">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
