'use client';

import { useActionState, useState } from 'react';

import { SOCIAL_PLATFORMS, type SocialPlatform } from '@blog/core';

import { saveAuthor, type AuthorState } from '@/app/actions/authors';
import { AvatarPicker } from '@/components/editor/avatar-picker';
import type { MediaOptions } from '@/lib/queries';

const INITIAL: AuthorState = {};

/** Labels and placeholders, so the five URL fields are one loop rather than five blocks. */
const SOCIAL_FIELDS: Record<SocialPlatform, { label: string; placeholder: string }> = {
  facebook: { label: 'Facebook', placeholder: 'https://facebook.com/…' },
  instagram: { label: 'Instagram', placeholder: 'https://instagram.com/…' },
  x: { label: 'X', placeholder: 'https://x.com/…' },
  youtube: { label: 'YouTube', placeholder: 'https://youtube.com/@…' },
  linkedin: { label: 'LinkedIn', placeholder: 'https://linkedin.com/in/…' },
};

export interface AuthorFormValues {
  id?: string;
  name: string;
  slug: string;
  bio: string;
  avatarId: string | null;
  social: Partial<Record<SocialPlatform, string>>;
}

export function AuthorForm({
  media,
  values,
}: {
  media: MediaOptions;
  values: AuthorFormValues;
}) {
  const [state, formAction, pending] = useActionState(saveAuthor, INITIAL);
  const [slug, setSlug] = useState(values.slug);

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

      {state.savedId ? (
        <p className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Saved and the live site was refreshed.
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
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-lg"
        />
        <p className="mt-1 text-xs text-slate-500">
          The byline readers see. Replaces whatever is typed in a post&apos;s Byline
          field once this author is attached to it.
        </p>
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium">
          URL slug
        </label>
        <input
          id="slug"
          name="slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="derived from the name if left blank"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-mono text-sm"
        />
        <p className="mt-1 text-xs text-slate-500">
          Nothing links to this yet — there are no author pages. It is stored now so
          adding them later does not mean inventing a slug for every author from a
          name that may have changed by then.
        </p>
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={values.bio}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-slate-500">
          Stored but not shown yet. It is what the author box will use.
        </p>
      </div>

      <AvatarPicker media={media} defaultValue={values.avatarId} />

      <fieldset>
        <legend className="text-sm font-medium">Social links</legend>
        <p className="mt-1 text-sm text-slate-600">
          Full URLs, starting with <code>https://</code>. Anything else is ignored
          rather than saved — these become links, and a link is the one place a
          malformed URL does damage. Leave a field empty to skip that platform.
        </p>

        <div className="mt-3 flex flex-col gap-3">
          {SOCIAL_PLATFORMS.map((platform) => {
            const field = SOCIAL_FIELDS[platform];

            return (
              <div key={platform}>
                <label htmlFor={`social_${platform}`} className="block text-sm">
                  {field.label}
                </label>
                <input
                  id={`social_${platform}`}
                  name={`social_${platform}`}
                  type="url"
                  inputMode="url"
                  defaultValue={values.social[platform] ?? ''}
                  placeholder={field.placeholder}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}
