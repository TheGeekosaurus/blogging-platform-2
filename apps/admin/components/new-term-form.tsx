'use client';

import { useActionState, useState } from 'react';

import type { FlatTerm } from '@blog/core';

import { createTerm, type TermState } from '@/app/actions/terms';

const INITIAL: TermState = {};

export function NewTermForm({ categories }: { categories: FlatTerm[] }) {
  const [state, formAction, pending] = useActionState(createTerm, INITIAL);

  /*
   * The parent picker is only shown for categories. Tags cannot nest — the
   * `terms_tag_flat` trigger rejects a tag with a parent — so leaving the
   * control visible would offer a combination the database refuses.
   */
  const [kind, setKind] = useState('category');

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="grow">
        <label htmlFor="name" className="label">
          Add a category or tag
        </label>
        <input
          id="name"
          name="name"
          required
          className="field"
        />
      </div>

      <label htmlFor="kind" className="sr-only">
        Kind
      </label>
      <select
        id="kind"
        name="kind"
        value={kind}
        onChange={(event) => setKind(event.target.value)}
        className="field field-inline"
      >
        <option value="category">Category</option>
        <option value="tag">Tag</option>
      </select>

      {kind === 'category' && categories.length > 0 ? (
        <>
          <label htmlFor="parent_id" className="sr-only">
            Parent category
          </label>
          <select
            id="parent_id"
            name="parent_id"
            defaultValue=""
            className="field field-inline"
          >
            <option value="">(top level)</option>
            {categories.map(({ term, depth }) => (
              <option key={term.id} value={term.id}>
                {'  '.repeat(depth)}
                {depth > 0 ? '└ ' : ''}
                {term.name}
              </option>
            ))}
          </select>
        </>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary"
      >
        Add
      </button>

      {state.error ? (
        <p role="alert" className="w-full text-sm text-danger-ink">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
