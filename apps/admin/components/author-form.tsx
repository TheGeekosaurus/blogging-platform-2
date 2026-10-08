'use client';

import { useActionState, useState } from 'react';

import { SOCIAL_PLATFORMS, type SocialPlatform } from '@blog/core';

import { Alert } from '@/components/ui/alert';
import { saveAuthor, type AuthorState } from '@/app/actions/authors';
import { AvatarPicker } from '@/components/editor/avatar-picker';
import { InlineTextEditor } from '@/components/editor/inline-text-editor';
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
  title: string;
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
        <Alert tone="error">
          {state.error}
        </Alert>
      ) : null}

      {state.savedId ? (
        <Alert tone="success">
          Saved and the live site was refreshed.
        </Alert>
      ) : null}

      <div>
        <label htmlFor="name" className="label">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={values.name}
          className="field text-lg"
        />
        <p className="mt-1 text-xs text-ink-muted">
          The byline readers see. Replaces whatever is typed in a post&apos;s Byline
          field once this author is attached to it.
        </p>
      </div>

      <div>
        <label className="label">
          Title
        </label>
        <InlineTextEditor
          name="title"
          defaultValue={values.title}
          singleLine
          placeholder="e.g. Founder, Nanotom Capital"
          describedBy="title-help"
        />
        <p id="title-help" className="mt-1 text-xs text-ink-muted">
          A short role line, shown under the name on every post and in the author box.
          Links are allowed — a company name can point at its site. Enter is disabled
          on purpose: a role that wraps to two paragraphs breaks the byline it sits in.
        </p>
      </div>

      <div>
        <label htmlFor="slug" className="label">
          URL slug
        </label>
        <input
          id="slug"
          name="slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="derived from the name if left blank"
          className="field font-mono"
        />
        <p className="mt-1 text-xs text-ink-muted">
          The author&rsquo;s archive lives at <code>/blog/author/&lt;slug&gt;</code>, and
          every byline links to it. Changing this breaks any link already pointing at
          the old one.
        </p>
      </div>

      <div>
        <label className="label">
          Bio
        </label>
        <InlineTextEditor
          name="bio"
          defaultValue={values.bio}
          describedBy="bio-help"
        />
        <p id="bio-help" className="mt-1 text-xs text-ink-muted">
          Shown in the author box under every post and on the author&rsquo;s archive
          page. Bold, italic and links only — headings and lists would fight the
          layouts it renders inside.
        </p>
      </div>

      <AvatarPicker media={media} defaultValue={values.avatarId} />

      <fieldset>
        <legend className="text-sm font-medium">Social links</legend>
        <p className="mt-1 text-sm text-ink-muted">
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
                  className="field"
                />
              </div>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}
