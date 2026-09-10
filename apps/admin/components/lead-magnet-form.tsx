'use client';

import { useActionState, useState } from 'react';

import type { TermRow } from '@blog/core';

import { saveLeadMagnet, type LeadMagnetState } from '@/app/actions/lead-magnets';
import type { PostOption } from '@/lib/queries';

const INITIAL: LeadMagnetState = {};

export interface LeadMagnetFormValues {
  id?: string;
  name: string;
  slug: string;
  heading: string;
  body: string;
  buttonLabel: string;
  successMessage: string;
  collectName: boolean;
  consentText: string;
  assetUrl: string;
  active: boolean;
  categoryIds: string[];
  tagIds: string[];
  postIds: string[];
  siteWide: boolean;
}

const FIELD = 'mt-1 w-full rounded border border-slate-300 px-3 py-2';

/**
 * A scrolling list of checkboxes.
 *
 * Rather than a multi-select: a `<select multiple>` needs ctrl-click to add a
 * second value and gives no indication that it does, which is how someone
 * targets one category while believing they targeted four. Checkboxes are
 * bigger on screen and unambiguous, and the box caps how much of the page they
 * can take.
 */
function CheckboxList({
  name,
  options,
  selected,
  empty,
}: {
  name: string;
  options: Array<{ id: string; label: string }>;
  selected: string[];
  empty: string;
}) {
  if (options.length === 0) {
    return <p className="mt-1 text-sm text-slate-500">{empty}</p>;
  }

  return (
    <div className="mt-1 max-h-56 overflow-y-auto rounded border border-slate-300 p-3">
      <ul className="flex flex-col gap-2">
        {options.map((option) => (
          <li key={option.id}>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name={name}
                value={option.id}
                defaultChecked={selected.includes(option.id)}
                className="mt-0.5"
              />
              <span>{option.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LeadMagnetForm({
  terms,
  posts,
  values,
}: {
  terms: TermRow[];
  posts: PostOption[];
  values: LeadMagnetFormValues;
}) {
  const [state, formAction, pending] = useActionState(saveLeadMagnet, INITIAL);
  const [slug, setSlug] = useState(values.slug);

  const categories = terms.filter((term) => term.kind === 'category');
  const tags = terms.filter((term) => term.kind === 'tag');

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      {state.error ? (
        <p
          role="alert"
          className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          {state.error}
        </p>
      ) : null}

      {state.staleWarning ? (
        <p
          role="alert"
          className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {state.staleWarning}
        </p>
      ) : null}

      {state.savedId && !state.staleWarning ? (
        <p className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Saved, and every post was refreshed.
        </p>
      ) : null}

      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={values.name}
          className={FIELD}
        />
        <p className="mt-1 text-sm text-slate-500">
          Internal only — how you find this in the list. Readers never see it.
        </p>
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium">
          Key
        </label>
        <input
          id="slug"
          name="slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="equipment-financing-toolkit"
          className={FIELD}
        />
        <p className="mt-1 text-sm text-slate-500">
          What the webhook receives, so automations can branch on it. Derived from
          the name if you leave it blank. Changing it later breaks any automation
          matching the old value.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="active" defaultChecked={values.active} />
        Live on the site
      </label>

      <fieldset className="flex flex-col gap-5 border-t border-slate-200 pt-5">
        <legend className="text-sm font-semibold">The card</legend>

        <div>
          <label htmlFor="heading" className="block text-sm font-medium">
            Headline
          </label>
          <input
            id="heading"
            name="heading"
            required
            defaultValue={values.heading}
            placeholder="Get the Equipment Financing Toolkit"
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium">
            Supporting line
          </label>
          <textarea
            id="body"
            name="body"
            rows={3}
            defaultValue={values.body}
            className={FIELD}
          />
          <p className="mt-1 text-sm text-slate-500">
            Plain text. Markup is shown as typed rather than rendered — the card is
            a headline, a sentence and a button.
          </p>
        </div>

        <div>
          <label htmlFor="button_label" className="block text-sm font-medium">
            Button
          </label>
          <input
            id="button_label"
            name="button_label"
            defaultValue={values.buttonLabel}
            placeholder="Send it to me"
            className={FIELD}
          />
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="collect_name"
            defaultChecked={values.collectName}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium">Ask for a first name too</span>
            <span className="block text-slate-500">
              A second field costs conversions and buys a name to greet them by.
              Leave off unless the follow-up email needs it.
            </span>
          </span>
        </label>

        <div>
          <label htmlFor="success_message" className="block text-sm font-medium">
            After they submit
          </label>
          <input
            id="success_message"
            name="success_message"
            defaultValue={values.successMessage}
            placeholder="Check your inbox — it is on the way."
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="consent_text" className="block text-sm font-medium">
            Small print
          </label>
          <input
            id="consent_text"
            name="consent_text"
            defaultValue={values.consentText}
            placeholder="No spam. Unsubscribe any time."
            className={FIELD}
          />
          <p className="mt-1 text-sm text-slate-500">
            Optional, and deliberately not filled in for you — what consent you need
            to state is your call, not this form&rsquo;s.
          </p>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-5 border-t border-slate-200 pt-5">
        <legend className="text-sm font-semibold">The file</legend>

        <div>
          <label htmlFor="asset_url" className="block text-sm font-medium">
            Download link
          </label>
          <input
            id="asset_url"
            name="asset_url"
            type="url"
            defaultValue={values.assetUrl}
            placeholder="https://…"
            className={FIELD}
          />
          <p className="mt-1 text-sm text-slate-500">
            Handed straight back after they submit, so they get it even if the email
            never arrives. Never appears in the page source before then. Leave blank
            if the file only goes out by email.
          </p>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-5 border-t border-slate-200 pt-5">
        <legend className="text-sm font-semibold">Where it appears</legend>

        <p className="text-sm text-slate-600">
          Tick nothing and it appears nowhere. Where a post matches more than one
          offer the more specific one wins — a post beats a tag, a tag beats a
          category, a category beats site-wide — and only ever one card is shown.
        </p>

        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="target_site" defaultChecked={values.siteWide} />
          Every post
        </label>

        <div>
          <span className="block text-sm font-medium">Categories</span>
          <p className="text-sm text-slate-500">
            Includes posts filed under a child category, matching how the category
            archives already work.
          </p>
          <CheckboxList
            name="target_category"
            options={categories.map((term) => ({ id: term.id, label: term.name }))}
            selected={values.categoryIds}
            empty="No categories yet."
          />
        </div>

        <div>
          <span className="block text-sm font-medium">Tags</span>
          <CheckboxList
            name="target_tag"
            options={tags.map((term) => ({ id: term.id, label: term.name }))}
            selected={values.tagIds}
            empty="No tags yet."
          />
        </div>

        <div>
          <span className="block text-sm font-medium">Individual posts</span>
          <CheckboxList
            name="target_post"
            options={posts.map((post) => ({ id: post.id, label: post.title }))}
            selected={values.postIds}
            empty="No posts yet."
          />
        </div>
      </fieldset>

      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save offer'}
        </button>
        <p className="mt-2 text-sm text-slate-500">
          Saving refreshes every post, because targeting can change which ones show
          this. That takes a few seconds.
        </p>
      </div>
    </form>
  );
}
