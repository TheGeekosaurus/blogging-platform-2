'use client';

import { useActionState, useState, useTransition } from 'react';

import type { SiteRow } from '@blog/core';

import { flushCache, saveSettings, type SettingsState } from '@/app/actions/site';

const INITIAL: SettingsState = {};

export function SettingsForm({ site }: { site: SiteRow }) {
  const [state, formAction, pending] = useActionState(saveSettings, INITIAL);
  const [flushState, setFlushState] = useState<SettingsState>({});
  const [flushing, startFlush] = useTransition();

  return (
    <>
      <form action={formAction} className="flex max-w-xl flex-col gap-4">
        {state.error ? (
          <p role="alert" className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
            {state.error}
          </p>
        ) : null}
        {state.saved ? (
          <p className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Settings saved.
          </p>
        ) : null}

        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Site name
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={site.name}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            defaultValue={site.description ?? ''}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="base_url" className="block text-sm font-medium">
            Public URL
          </label>
          <input
            id="base_url"
            name="base_url"
            required
            defaultValue={site.base_url}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-mono text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">
            An origin with no trailing path, e.g. <code>https://example.com</code>. Canonical
            URLs, the sitemap, the feed, and cache refreshes are all built from this — if it
            is wrong, publishing will not update the live site.
          </p>
        </div>

        <div>
          <label htmlFor="locale" className="block text-sm font-medium">
            Locale
          </label>
          <input
            id="locale"
            name="locale"
            defaultValue={site.locale}
            className="mt-1 w-32 rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="analytics_id" className="block text-sm font-medium">
            Analytics ID
          </label>
          <input
            id="analytics_id"
            name="analytics_id"
            defaultValue={site.analytics_id ?? ''}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </form>

      <section className="mt-10 max-w-xl border-t border-slate-200 pt-6">
        <h2 className="text-lg font-semibold">Cache</h2>
        <p className="mt-1 text-sm text-slate-600">
          Publishing refreshes the affected pages automatically. Use this if a publish
          reported that it could not reach the live site.
        </p>

        {flushState.error ? (
          <p role="alert" className="mt-3 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
            {flushState.error}
          </p>
        ) : null}
        {flushState.saved ? (
          <p className="mt-3 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            The live site was refreshed.
          </p>
        ) : null}

        <button
          type="button"
          disabled={flushing}
          onClick={() =>
            startFlush(async () => {
              setFlushState(await flushCache());
            })
          }
          className="mt-3 rounded border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {flushing ? 'Refreshing…' : 'Flush cache'}
        </button>
      </section>
    </>
  );
}
