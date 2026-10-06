'use client';

import { useActionState } from 'react';

import { saveRedirect, type RedirectState } from '@/app/actions/redirects';

const INITIAL: RedirectState = {};

/**
 * Add a redirect.
 *
 * One row of fields rather than a separate page: a redirect is three values,
 * and the list it belongs to is the context you need while typing it.
 */
export function RedirectForm() {
  const [state, formAction, pending] = useActionState(saveRedirect, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error ? (
        <p
          role="alert"
          className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          {state.error}
        </p>
      ) : null}
      {state.saved ? (
        <p className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Redirect added. It goes live on the next deploy.
        </p>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <div className="grow">
          <label htmlFor="from_path" className="block text-sm font-medium">
            From
          </label>
          <input
            id="from_path"
            name="from_path"
            required
            placeholder="/old-post-url/"
            className="field mt-1 font-mono"
          />
          {/* Because pasting the whole URL out of the address bar is what people
              actually do, and the action strips the origin rather than refusing. */}
          <p className="mt-1 text-xs text-ink-muted">
            A path on this site. Pasting a full URL is fine — the domain is trimmed.
          </p>
        </div>

        <div className="grow">
          <label htmlFor="to_path" className="block text-sm font-medium">
            To
          </label>
          <input
            id="to_path"
            name="to_path"
            required
            placeholder="/blog/new-post-url/"
            className="field mt-1 font-mono"
          />
          <p className="mt-1 text-xs text-ink-muted">
            A path, or a full URL to send visitors off-site.
          </p>
        </div>

        <div>
          <label htmlFor="status_code" className="block text-sm font-medium">
            Code
          </label>
          <select
            id="status_code"
            name="status_code"
            defaultValue="301"
            className="field field-inline mt-1"
          >
            {/* 301 first and default: it is the one that passes ranking on, and
                it is what a moved URL almost always wants. */}
            <option value="301">301 permanent</option>
            <option value="302">302 temporary</option>
            <option value="307">307 temporary, keep method</option>
            <option value="308">308 permanent, keep method</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary"
        >
          {pending ? 'Adding…' : 'Add'}
        </button>
      </div>
    </form>
  );
}
