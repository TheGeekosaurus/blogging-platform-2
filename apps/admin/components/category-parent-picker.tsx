'use client';

import { useActionState } from 'react';

import type { FlatTerm } from '@blog/core';

import { setTermParent, type TermState } from '@/app/actions/terms';

const INITIAL: TermState = {};

/**
 * Move a category under a different parent, or to the top level.
 *
 * The category itself is excluded from its own options, and so are its
 * descendants — selecting one would detach the subtree from the tree and the
 * database would reject it (`terms_check_parent`, migration 0005). Filtering
 * here means the impossible choice is never offered.
 */
export function CategoryParentPicker({
  termId,
  currentParentId,
  categories,
}: {
  termId: string;
  currentParentId: string | null;
  categories: FlatTerm[];
}) {
  const [state, formAction, pending] = useActionState(setTermParent, INITIAL);

  // `categories` is in tree order, so a term's descendants are exactly the
  // entries following it that are deeper than it — the next same-or-shallower
  // entry ends the subtree.
  const index = categories.findIndex((entry) => entry.term.id === termId);
  const self = index === -1 ? undefined : categories[index];
  const forbidden = new Set<string>([termId]);

  if (self) {
    for (let i = index + 1; i < categories.length; i += 1) {
      const entry = categories[i];
      if (!entry || entry.depth <= self.depth) break;
      forbidden.add(entry.term.id);
    }
  }

  const options = categories.filter((entry) => !forbidden.has(entry.term.id));

  return (
    <form action={formAction} className="flex items-center gap-1.5">
      <input type="hidden" name="id" value={termId} />

      <label htmlFor={`parent-${termId}`} className="sr-only">
        Parent category
      </label>
      <select
        id={`parent-${termId}`}
        name="parent_id"
        defaultValue={currentParentId ?? ''}
        disabled={pending}
        className="rounded border border-slate-300 px-1.5 py-1 text-xs"
      >
        <option value="">(top level)</option>
        {options.map(({ term, depth }) => (
          <option key={term.id} value={term.id}>
            {' '.repeat(depth * 2)}
            {term.name}
          </option>
        ))}
      </select>

      <button type="submit" disabled={pending} className="text-xs underline disabled:opacity-60">
        Move
      </button>

      {state.error ? (
        <span role="alert" className="text-xs text-red-700">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
