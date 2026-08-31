'use client';

import { useActionState } from 'react';

import { createTerm, type TermState } from '@/app/actions/terms';

const INITIAL: TermState = {};

export function NewTermForm() {
  const [state, formAction, pending] = useActionState(createTerm, INITIAL);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="grow">
        <label htmlFor="name" className="block text-sm font-medium">
          Add a category or tag
        </label>
        <input
          id="name"
          name="name"
          required
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <label htmlFor="kind" className="sr-only">
        Kind
      </label>
      <select
        id="kind"
        name="kind"
        className="rounded border border-slate-300 px-2 py-2 text-sm"
      >
        <option value="category">Category</option>
        <option value="tag">Tag</option>
      </select>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        Add
      </button>

      {state.error ? (
        <p role="alert" className="w-full text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
