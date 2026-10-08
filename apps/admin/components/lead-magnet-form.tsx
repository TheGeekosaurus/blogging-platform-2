'use client';

import { useActionState, useState } from 'react';

import {
  CTA_KINDS,
  CTA_LAYOUTS,
  CTA_THEMES,
  type CtaBlockView,
  type CtaKind,
  type CtaLayout,
  type CtaTheme,
  type TermRow,
} from '@blog/core';
import { CtaBlock, CtaLinkButton, buttonClass, THEME_SKINS } from '@blog/ui';

import { Alert } from '@/components/ui/alert';
import { saveLeadMagnet, type LeadMagnetState } from '@/app/actions/lead-magnets';
import { CTA_LABELS, LAYOUT_HINTS } from '@/components/editor/cta-picker-labels';
import { MediaPicker } from '@/components/editor/media-picker';
import type { MediaOptions, PostOption } from '@/lib/queries';

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
  imageId: string | null;
  consentText: string;
  assetUrl: string;
  active: boolean;
  kind: CtaKind;
  href: string;
  layout: CtaLayout;
  theme: CtaTheme;
  accentBorder: boolean;
  eyebrow: string;
  categoryIds: string[];
  tagIds: string[];
  postIds: string[];
  siteWide: boolean;
}

const FIELD = 'field mt-1';

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
    return <p className="mt-1 text-sm text-ink-muted">{empty}</p>;
  }

  return (
    <div className="mt-1 max-h-56 overflow-y-auto rounded-control border border-line p-3">
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
  media,
  values,
}: {
  terms: TermRow[];
  posts: PostOption[];
  media: MediaOptions;
  values: LeadMagnetFormValues;
}) {
  const [state, formAction, pending] = useActionState(saveLeadMagnet, INITIAL);
  const [slug, setSlug] = useState(values.slug);
  const [imageId, setImageId] = useState(values.imageId ?? '');

  /*
   * What the preview shows.
   *
   * Mirrored from the inputs rather than controlling them: the fields stay
   * uncontrolled with `defaultValue`, which is what the rest of this admin
   * does and what lets the form submit without React owning every keystroke.
   * This holds only the fields the preview can actually show — a change to
   * `asset_url` or the targeting rules does not alter how the block looks.
   */
  const [preview, setPreview] = useState({
    kind: values.kind,
    layout: values.layout,
    theme: values.theme,
    accentBorder: values.accentBorder,
    eyebrow: values.eyebrow,
    heading: values.heading,
    body: values.body,
    buttonLabel: values.buttonLabel,
    consentText: values.consentText,
    href: values.href,
  });
  const set = <K extends keyof typeof preview>(key: K, value: (typeof preview)[K]) =>
    setPreview((current) => ({ ...current, [key]: value }));

  const previewBlock: CtaBlockView = {
    slug: slug || 'preview',
    kind: preview.kind,
    layout: preview.layout,
    theme: preview.theme,
    accentBorder: preview.accentBorder,
    eyebrow: preview.eyebrow.trim() || null,
    heading: preview.heading.trim() || 'Your headline goes here',
    body: preview.body.trim() || null,
    buttonLabel: preview.buttonLabel.trim() || 'Send it to me',
    href: preview.href.trim() || '#',
    consentText: preview.consentText.trim() || null,
    collectName: values.collectName,
    successMessage: values.successMessage,
    // The chosen image is not resolvable to a URL here — the picker deals in
    // ids and `mediaPublicUrl` needs the server's SUPABASE_URL. The Split
    // layout therefore previews as Banner, which is also what it renders as
    // when a block genuinely has no image.
    image: null,
  };

  const categories = terms.filter((term) => term.kind === 'category');
  const tags = terms.filter((term) => term.kind === 'tag');

  return (
    <form
      action={formAction}
      /*
        The builder: controls left, preview right, the preview sticky so it
        stays beside whichever control is being used. A single column with the
        preview at the bottom would mean scrolling away from the thing you are
        changing to see what it did, which is the whole complaint about the
        form this replaces.
      */
      className="grid items-start gap-8 xl:grid-cols-[minmax(0,34rem)_minmax(0,1fr)]"
    >
      <div className="flex flex-col gap-5">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      {state.error ? (
        <Alert tone="error">
          {state.error}
        </Alert>
      ) : null}

      {state.staleWarning ? (
        <Alert tone="warning">
          {state.staleWarning}
        </Alert>
      ) : null}

      {state.savedId && !state.staleWarning ? (
        <Alert tone="success">
          Saved, and every post was refreshed.
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
          className={FIELD}
        />
        <p className="mt-1 text-sm text-ink-muted">
          Internal only — how you find this in the list. Readers never see it.
        </p>
      </div>

      <div>
        <label htmlFor="slug" className="label">
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
        <p className="mt-1 text-sm text-ink-muted">
          What the webhook receives, so automations can branch on it. Derived from
          the name if you leave it blank. Changing it later breaks any automation
          matching the old value.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="active" defaultChecked={values.active} />
        Live on the site
      </label>

      <fieldset className="flex flex-col gap-4 border-t border-line pt-5">
        <legend className="text-sm font-semibold">What it does</legend>

        {/*
          Two radios, not a select: there are two options and the choice
          changes which field below is relevant, so showing both at once is
          what makes that obvious.
        */}
        <div className="flex flex-wrap gap-2">
          {CTA_KINDS.map((option) => (
            <label
              key={option}
              className={`cursor-pointer rounded-control border px-3 py-2 text-sm transition-colors ${
                preview.kind === option
                  ? 'border-brand bg-brand-softer font-medium text-ink'
                  : 'border-line text-ink-muted hover:border-brand'
              }`}
            >
              <input
                type="radio"
                name="kind"
                value={option}
                defaultChecked={values.kind === option}
                onChange={() => set('kind', option)}
                className="sr-only"
              />
              {CTA_LABELS.kind[option]}
            </label>
          ))}
        </div>

        {preview.kind === 'link' ? (
          <div>
            <label htmlFor="href" className="label">
              Destination
            </label>
            <input
              id="href"
              name="href"
              defaultValue={values.href}
              onChange={(e) => set('href', e.target.value)}
              placeholder="/calculators/dscr-calculator"
              className={FIELD}
            />
            <p className="hint mt-1">
              A path on this site, or a full URL. A bare domain gets{' '}
              <code>https://</code> added.
            </p>
          </div>
        ) : (
          <p className="hint">
            Readers enter an email and the address lands in <strong>Leads</strong>.
            The delivery link and the success message are further down.
          </p>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-t border-line pt-5">
        <legend className="text-sm font-semibold">How it looks</legend>

        <div>
          <span className="label">Layout</span>
          <div className="grid grid-cols-2 gap-2">
            {CTA_LAYOUTS.map((option) => (
              <label
                key={option}
                className={`cursor-pointer rounded-control border px-3 py-2 transition-colors ${
                  preview.layout === option
                    ? 'border-brand bg-brand-softer'
                    : 'border-line hover:border-brand'
                }`}
              >
                <input
                  type="radio"
                  name="layout"
                  value={option}
                  defaultChecked={values.layout === option}
                  onChange={() => set('layout', option)}
                  className="sr-only"
                />
                <span className="label">
                  {CTA_LABELS.layout[option]}
                </span>
                <span className="mt-0.5 block text-xs text-ink-muted">
                  {LAYOUT_HINTS[option]}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <span className="label">Background</span>
          <div className="flex flex-wrap gap-2">
            {CTA_THEMES.map((option) => (
              <label
                key={option}
                className={`cursor-pointer rounded-control border px-3 py-2 text-sm transition-colors ${
                  preview.theme === option
                    ? 'border-brand bg-brand-softer font-medium text-ink'
                    : 'border-line text-ink-muted hover:border-brand'
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  value={option}
                  defaultChecked={values.theme === option}
                  onChange={() => set('theme', option)}
                  className="sr-only"
                />
                {CTA_LABELS.theme[option]}
              </label>
            ))}
          </div>
          <p className="hint mt-1">
            Drawn from this site&rsquo;s own palette, so a block looks right on
            whichever site it is on — and in dark mode.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="accent_border"
            defaultChecked={values.accentBorder}
            onChange={(e) => set('accentBorder', e.target.checked)}
          />
          Accent edge along the top
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-5 border-t border-line pt-5">
        <legend className="text-sm font-semibold">What it says</legend>

        <div>
          <label htmlFor="eyebrow" className="label">
            Eyebrow <span className="font-normal text-ink-muted">(optional)</span>
          </label>
          <input
            id="eyebrow"
            name="eyebrow"
            defaultValue={values.eyebrow}
            onChange={(e) => set('eyebrow', e.target.value)}
            placeholder="Free tool"
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="heading" className="label">
            Headline
          </label>
          <input
            id="heading"
            name="heading"
            onChange={(e) => set('heading', e.target.value)}
            required
            defaultValue={values.heading}
            placeholder="Get the Equipment Financing Toolkit"
            className={FIELD}
          />
        </div>

        {/*
          MediaPicker directly rather than a third thin wrapper beside
          FeaturedImagePicker and AvatarPicker. Those exist because their forms
          are server-rendered around a client island; this form is already a
          client component, so the hidden input and the state can just live
          here.
        */}
        <fieldset>
          <legend className="text-sm font-medium">Image</legend>
          <p className="mt-1 text-sm text-ink-muted">
            Optional, and shown full width across the top of the card. It is never
            cropped — the card grows to fit, so a tall image makes a tall card.
            Around 700px wide is plenty; the sidebar renders it at about 350.
          </p>

          {/* What reaches saveLeadMagnet. Empty string means "no image". */}
          <input type="hidden" name="image_id" value={imageId} />

          <div className="mt-3">
            <MediaPicker
              media={media}
              selectedId={imageId}
              onSelect={(item) => setImageId(item?.id ?? '')}
            />
          </div>
        </fieldset>

        <div>
          <label htmlFor="body" className="label">
            Supporting line
          </label>
          <textarea
            id="body"
            name="body"
            onChange={(e) => set('body', e.target.value)}
            rows={3}
            defaultValue={values.body}
            className={FIELD}
          />
          <p className="mt-1 text-sm text-ink-muted">
            Plain text. Markup is shown as typed rather than rendered — the card is
            a headline, a sentence and a button.
          </p>
        </div>

        <div>
          <label htmlFor="button_label" className="label">
            Button
          </label>
          <input
            id="button_label"
            name="button_label"
            onChange={(e) => set('buttonLabel', e.target.value)}
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
            <span className="block text-ink-muted">
              A second field costs conversions and buys a name to greet them by.
              Leave off unless the follow-up email needs it.
            </span>
          </span>
        </label>

        <div>
          <label htmlFor="success_message" className="label">
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
          <label htmlFor="consent_text" className="label">
            Small print
          </label>
          <input
            id="consent_text"
            name="consent_text"
            onChange={(e) => set('consentText', e.target.value)}
            defaultValue={values.consentText}
            placeholder="No spam. Unsubscribe any time."
            className={FIELD}
          />
          <p className="mt-1 text-sm text-ink-muted">
            Optional, and deliberately not filled in for you — what consent you need
            to state is your call, not this form&rsquo;s.
          </p>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-5 border-t border-line pt-5">
        <legend className="text-sm font-semibold">The file</legend>

        <div>
          <label htmlFor="asset_url" className="label">
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
          <p className="mt-1 text-sm text-ink-muted">
            Handed straight back after they submit, so they get it even if the email
            never arrives. Never appears in the page source before then. Leave blank
            if the file only goes out by email.
          </p>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-5 border-t border-line pt-5">
        <legend className="text-sm font-semibold">Where it appears</legend>

        <p className="text-sm text-ink-muted">
          Tick nothing and it appears nowhere. Where a post matches more than one
          offer the more specific one wins — a post beats a tag, a tag beats a
          category, a category beats site-wide — and only ever one card is shown.
        </p>

        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="target_site" defaultChecked={values.siteWide} />
          Every post
        </label>

        <div>
          <span className="label">Categories</span>
          <p className="text-sm text-ink-muted">
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
          <span className="label">Tags</span>
          <CheckboxList
            name="target_tag"
            options={tags.map((term) => ({ id: term.id, label: term.name }))}
            selected={values.tagIds}
            empty="No tags yet."
          />
        </div>

        <div>
          <span className="label">Individual posts</span>
          <CheckboxList
            name="target_post"
            options={posts.map((post) => ({ id: post.id, label: post.title }))}
            selected={values.postIds}
            empty="No posts yet."
          />
        </div>
      </fieldset>

        <div>
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? 'Saving…' : 'Save block'}
          </button>
          <p className="mt-2 text-sm text-ink-muted">
            Saving refreshes every post, because targeting can change which ones
            show this. That takes a few seconds.
          </p>
        </div>
      </div>

      {/*
        THE PREVIEW, rendered with the SAME component the blog uses.

        Not a mock-up of one. `@blog/ui` exists for this: a preview that is a
        second implementation is a preview that lies the first time a layout
        changes, and then the builder is worse than no builder because it is
        confidently wrong.
      */}
      <aside className="sticky top-24 hidden xl:block">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Preview
        </p>
        {/*
          On the canvas, not on a card: a block is read against the page it
          sits in, and judging a tinted treatment against white is how you
          ship one that disappears.
        */}
        <div className="rounded-card bg-canvas p-5">
          <CtaBlock
            block={previewBlock}
            action={
              previewBlock.kind === 'email' ? (
                /* A stand-in, as in the editor — a live form in a preview
                   invites someone to submit it. */
                <span className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-5 py-3 text-sm ${
                      THEME_SKINS[previewBlock.theme].dark
                        ? 'border-white/25 text-white/50'
                        : 'border-[var(--cta-line)] text-[var(--cta-ink-muted)]'
                    }`}
                  >
                    you@example.com
                  </span>
                  <span className={buttonClass(THEME_SKINS[previewBlock.theme].dark)}>
                    {previewBlock.buttonLabel}
                  </span>
                </span>
              ) : (
                <CtaLinkButton block={previewBlock} />
              )
            }
          />
        </div>

        {previewBlock.layout === 'split' ? (
          <p className="mt-3 text-sm text-ink-muted">
            Split needs an image. Without one it renders as Banner — here, and
            on the site.
          </p>
        ) : null}
        {previewBlock.layout === 'strip' ? (
          <p className="mt-3 text-sm text-ink-muted">
            Strip shows the headline and the button only. Body copy is not
            rendered in this layout.
          </p>
        ) : null}
      </aside>
    </form>
  );
}
