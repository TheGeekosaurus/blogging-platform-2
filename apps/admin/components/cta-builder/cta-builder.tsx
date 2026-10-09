'use client';

import Link from 'next/link';
import { useActionState, useRef, useState } from 'react';

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
import type { LeadMagnetOffer } from '@blog/core';
import { CtaBlock, CtaLinkButton, LeadMagnetCard, buttonClass, THEME_SKINS } from '@blog/ui';

import { saveLeadMagnet, type LeadMagnetState } from '@/app/actions/lead-magnets';
import { CTA_LABELS, LAYOUT_HINTS } from '@/components/editor/cta-picker-labels';
import { MediaPicker } from '@/components/editor/media-picker';
import { Alert } from '@/components/ui/alert';
import { BuilderSection } from '@/components/cta-builder/builder-section';
import type { MediaOptions, PostOption } from '@/lib/queries';

const INITIAL: LeadMagnetState = {};
const FIELD = 'field';

/*
 * The form is the SIDEBAR, and the bar's controls reach it by `form=`.
 *
 * Not a <form> wrapped round the whole builder, which is where this started
 * and which was wrong in a way that would have cost someone their block: the
 * stage holds the "Delete this offer" form, and HTML does not nest forms — the
 * parser drops the inner one, so its button becomes a submit button of the
 * outer form and Delete would have run Save. Associating by id keeps the two
 * forms siblings, which is what they are.
 */
const FORM_ID = 'cta-builder-form';

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
    <div className="mt-1 max-h-48 overflow-y-auto rounded-control border border-line bg-surface p-3">
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

/** A row of mutually exclusive pills. One name, one checked value, no select. */
function PillGroup<T extends string>({
  name,
  options,
  value,
  labels,
  hints,
  onPick,
  columns,
}: {
  name: string;
  options: readonly T[];
  value: T;
  labels: Record<T, string>;
  hints?: Record<T, string>;
  onPick: (option: T) => void;
  columns?: boolean;
}) {
  return (
    <div className={columns ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap gap-2'}>
      {options.map((option) => (
        <label
          key={option}
          className={`builder-pill ${value === option ? 'is-on' : ''}`}
        >
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={() => onPick(option)}
            className="sr-only"
          />
          <span className="builder-pill-label">{labels[option]}</span>
          {hints ? <span className="builder-pill-hint">{hints[option]}</span> : null}
        </label>
      ))}
    </div>
  );
}

/**
 * The CTA builder: a sidebar of controls and a live preview, filling the window.
 *
 * WHAT THIS REPLACES. One form of five hundred lines in a 34rem column, with
 * six fieldsets separated by hairlines and a preview pinned beside it — which
 * is to say a long form with a picture next to it. Denis, 2026-10-08: "Let's
 * revamp the CTA builder too, it's terrible."
 *
 * The shape is the one every builder of this kind settles on, and the reason
 * is the same every time: the thing being built is the subject of the screen,
 * so it gets the room, and the controls are a tool beside it rather than the
 * content of the page.
 *
 * The sections do NOT close each other. An accordion that allows one open
 * section at a time is tidier and worse: changing a headline and then its
 * background means opening Style, which shuts Content, which moves everything
 * you were reading. Only Content starts open, so the first screen is short.
 *
 * THE PREVIEW IS THE REAL COMPONENT, as it was before — `@blog/ui`'s CtaBlock,
 * the same one the blog renders. A preview that is a second implementation is
 * a preview that lies the first time a layout changes, and then the builder is
 * worse than no builder because it is confidently wrong.
 */
export function CtaBuilder({
  terms,
  posts,
  media,
  values,
  records,
}: {
  terms: TermRow[];
  posts: PostOption[];
  media: MediaOptions;
  values: LeadMagnetFormValues;
  /**
   * What this block has DONE, rendered under the preview: the recent leads and
   * the way to delete it. Server-rendered and passed through, because both are
   * queries this component has no business making.
   *
   * Under the preview rather than in the sidebar because they are a different
   * kind of thing. The sidebar is what the block will be; this is what it has
   * been, and a three-column table does not fit in 24rem anyway.
   */
  records?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(saveLeadMagnet, INITIAL);
  const [slug, setSlug] = useState(values.slug);
  const [imageId, setImageId] = useState(values.imageId ?? '');
  const form = useRef<HTMLFormElement>(null);

  const [open, setOpen] = useState<Record<string, boolean>>({ content: true });
  const toggle = (id: string) =>
    setOpen((current) => ({ ...current, [id]: !current[id] }));

  /*
   * A required field inside a CLOSED section.
   *
   * The browser will not report a validity error on something it cannot
   * focus — a `hidden` section's contents are display:none — so without this
   * the form would simply do nothing when you pressed Save, with one line in
   * the console and nothing on screen. Suppressing the browser's own report,
   * opening the section, and reporting again once React has painted is the
   * whole fix. `invalid` does not bubble, hence the capture phase.
   */
  function onInvalid(event: React.FormEvent) {
    const control = event.target as HTMLElement & { reportValidity?: () => void };
    const section = control.closest<HTMLElement>('[data-section]');
    if (!section) return;
    const id = section.dataset.section!;
    if (open[id]) return;

    event.preventDefault();
    setOpen((current) => ({ ...current, [id]: true }));
    setTimeout(() => {
      control.focus();
      control.reportValidity?.();
    }, 0);
  }

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
    collectName: values.collectName,
    successMessage: values.successMessage,
  });
  const set = <K extends keyof typeof preview>(key: K, value: (typeof preview)[K]) =>
    setPreview((current) => ({ ...current, [key]: value }));

  /*
   * The picture, resolved from the picker's own list.
   *
   * The preview used to pass `image: null` with a note that the id could not be
   * turned into a URL here — true of `mediaPublicUrl`, which needs the server's
   * SUPABASE_URL, but not of MediaOptions, which the server already built this
   * form with and which carries the URL for every thumbnail the picker shows.
   * So Split previewed as Banner and the sidebar card previewed with no image
   * at all, which is most of what the card IS.
   */
  const chosenImage = media.items.find((item) => item.id === imageId);
  const previewImage = chosenImage
    ? {
        url: chosenImage.url,
        alt: chosenImage.alt,
        // MediaOption carries no dimensions, so the card takes its plain <img>
        // path — see ImageRenderer in packages/ui.
        width: null,
        height: null,
      }
    : null;

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
    image: previewImage,
  };

  /*
   * WHICH PLACEMENT the preview is showing.
   *
   * A block has two of them, rendered by two different components, and the
   * builder used to know about one. Denis, 2026-10-09, with a screenshot of
   * each: "here is how it looks in the designer, and how it looks on the
   * actual post."
   *
   *   In a post body — <CtaBlock>, where you dropped a marker from the editor.
   *                    This is what layout and the eyebrow are for.
   *   In the sidebar — <LeadMagnetCard>, chosen by the targeting rules below.
   *                    One column, one arrangement, no eyebrow.
   *
   * It opens on whichever this block actually uses. Targeting rules mean it
   * appears in the sidebar; nothing targeted means it is only ever something
   * you insert by hand.
   */
  const targeted =
    values.siteWide ||
    values.categoryIds.length > 0 ||
    values.tagIds.length > 0 ||
    values.postIds.length > 0;
  const [placement, setPlacement] = useState<'body' | 'sidebar'>(
    targeted ? 'sidebar' : 'body',
  );


  const previewOffer: LeadMagnetOffer = {
    slug: previewBlock.slug,
    kind: previewBlock.kind,
    href: previewBlock.kind === 'link' ? previewBlock.href : null,
    theme: previewBlock.theme,
    accentBorder: previewBlock.accentBorder,
    heading: previewBlock.heading,
    body: previewBlock.body,
    buttonLabel: previewBlock.buttonLabel,
    successMessage: preview.successMessage.trim() || 'Check your inbox.',
    collectName: preview.collectName,
    consentText: previewBlock.consentText,
    image: previewImage,
  };

  /*
   * WHERE A CHOSEN IMAGE ACTUALLY SHOWS UP.
   *
   * Only two things render one: the Split layout, and the sidebar card. Banner,
   * Billboard and Strip ignore `image` entirely — see the switch in
   * packages/ui/src/cta-block.tsx. So picking a picture on a Banner block did
   * nothing visible anywhere, and the builder said nothing about it. Denis,
   * 2026-10-09: "The image function doesn't seem to work... it doesn't seem to
   * do anything when I select one." The picker was working; it had nowhere to
   * put the result.
   */
  const imageShowsInBody = preview.layout === 'split';
  const imageShowsSomewhere = imageShowsInBody || targeted;
  const imageIgnored = Boolean(imageId) && !imageShowsSomewhere;

  const categories = terms.filter((term) => term.kind === 'category');
  const tags = terms.filter((term) => term.kind === 'tag');
  const dark = THEME_SKINS[previewBlock.theme].dark;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/*
        The builder's own bar. The NAME lives here rather than in a section,
        and not for want of room: it is required, and a required field inside
        a section you can close is a field you can be blocked by without
        seeing. Up here it is also what the screen is called, which is what a
        name is.
      */}
      <header className="builder-bar">
        <Link href="/lead-magnets" className="builder-back" aria-label="All CTA blocks">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-[16px] w-[16px]"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>

        {/*
          The screen's heading, which the bar does not otherwise have: the name
          is an <input>, and an editable field is not a heading however much it
          looks like one. Without this the builder is the only screen in the
          admin with no <h1> — a page a screen reader cannot announce or skip to.
          It carries the name as it was on open; it does not track edits,
          because a heading that changes under you as you type is worse than
          one that is a moment stale.
        */}
        <h1 className="sr-only">{values.name || 'New CTA block'}</h1>

        <label htmlFor="name" className="sr-only">
          Name
        </label>
        <input
          id="name"
          name="name"
          form={FORM_ID}
          required
          defaultValue={values.name}
          placeholder="Untitled block"
          className="builder-name"
        />

        <label className="builder-live">
          <input
            type="checkbox"
            name="active"
            form={FORM_ID}
            defaultChecked={values.active}
          />
          Live
        </label>

        <Link href="/lead-magnets" className="btn btn-ghost btn-sm">
          Cancel
        </Link>
        <button
          type="submit"
          form={FORM_ID}
          disabled={pending}
          className="btn btn-primary btn-sm"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* ---------------------------------------------------------------- */}
        <form
          ref={form}
          id={FORM_ID}
          action={formAction}
          /* Capture, because `invalid` does not bubble to the form on its own. */
          onInvalidCapture={onInvalid}
          className="builder-side"
        >
          {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
          {/* What reaches saveLeadMagnet. Empty string means "no image". */}
          <input type="hidden" name="image_id" value={imageId} />

          {state.error ? <Alert tone="error">{state.error}</Alert> : null}
          {state.staleWarning ? (
            <Alert tone="warning">{state.staleWarning}</Alert>
          ) : null}
          {state.savedId && !state.staleWarning ? (
            <Alert tone="success">Saved, and every post was refreshed.</Alert>
          ) : null}

          <BuilderSection
            id="content"
            title="Content"
            open={!!open.content}
            onToggle={toggle}
          >
            <div className="builder-stack">
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
                  required
                  defaultValue={values.heading}
                  onChange={(e) => set('heading', e.target.value)}
                  placeholder="Get the Equipment Financing Toolkit"
                  className={FIELD}
                />
              </div>

              <div>
                <label htmlFor="body" className="label">
                  Supporting line
                </label>
                <textarea
                  id="body"
                  name="body"
                  rows={3}
                  defaultValue={values.body}
                  onChange={(e) => set('body', e.target.value)}
                  className={FIELD}
                />
                <p className="hint mt-1">
                  Plain text. Markup is shown as typed rather than rendered — the
                  card is a headline, a sentence and a button.
                </p>
              </div>

              <div>
                <label htmlFor="button_label" className="label">
                  Button
                </label>
                <input
                  id="button_label"
                  name="button_label"
                  defaultValue={values.buttonLabel}
                  onChange={(e) => set('buttonLabel', e.target.value)}
                  placeholder="Send it to me"
                  className={FIELD}
                />
              </div>
            </div>
          </BuilderSection>

          <BuilderSection
            id="style"
            title="Style"
            summary={`${CTA_LABELS.layout[preview.layout]} · ${CTA_LABELS.theme[preview.theme]}`}
            open={!!open.style}
            onToggle={toggle}
          >
            <div className="builder-stack">
              <div>
                <span className="label">
                  Layout{' '}
                  {placement === 'sidebar' ? (
                    <span className="font-normal text-ink-muted">
                      — post body only
                    </span>
                  ) : null}
                </span>
                <PillGroup
                  name="layout"
                  options={CTA_LAYOUTS}
                  value={preview.layout}
                  labels={CTA_LABELS.layout}
                  hints={LAYOUT_HINTS}
                  onPick={(option) => set('layout', option)}
                  columns
                />
              </div>

              <div>
                <span className="label">Background</span>
                <PillGroup
                  name="theme"
                  options={CTA_THEMES}
                  value={preview.theme}
                  labels={CTA_LABELS.theme}
                  onPick={(option) => set('theme', option)}
                />
                <p className="hint mt-1">
                  Drawn from this site&rsquo;s own palette, so a block looks right
                  on whichever site it is on — and in dark mode.
                </p>
              </div>

              <label className="builder-check">
                <input
                  type="checkbox"
                  name="accent_border"
                  defaultChecked={values.accentBorder}
                  onChange={(e) => set('accentBorder', e.target.checked)}
                />
                <span className="font-medium">Accent edge along the top</span>
              </label>
            </div>
          </BuilderSection>

          <BuilderSection
            id="action"
            title="Action"
            summary={CTA_LABELS.kind[preview.kind]}
            open={!!open.action}
            onToggle={toggle}
          >
            <div className="builder-stack">
              {/*
                Two pills, not a select: there are two options and the choice
                changes which field below is relevant, so showing both at once
                is what makes that obvious.
              */}
              <PillGroup
                name="kind"
                options={CTA_KINDS}
                value={preview.kind}
                labels={CTA_LABELS.kind}
                onPick={(option) => set('kind', option)}
              />

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
                  Readers enter an email and the address lands in{' '}
                  <strong>Leads</strong>. What they get back is under Delivery.
                </p>
              )}
            </div>
          </BuilderSection>

          <BuilderSection
            id="image"
            title="Image"
            summary={
              imageId
                ? imageIgnored
                  ? 'Not shown — see inside'
                  : (chosenImage?.name ?? 'Chosen')
                : 'None'
            }
            open={!!open.image}
            onToggle={toggle}
          >
            {/*
              Said before the grid rather than after it, because by the time
              someone has picked an image and seen nothing happen the question
              in their head is "is this broken", and the answer has to arrive
              first.
            */}
            {imageIgnored ? (
              <div className="builder-warn">
                <p>
                  Nothing will show this image.{' '}
                  <strong>{CTA_LABELS.layout[preview.layout]}</strong> has no place
                  for one — only <strong>Split</strong> does — and this block has
                  no targeting rules, so it never appears in the sidebar either.
                </p>
                <button
                  type="button"
                  onClick={() => set('layout', 'split')}
                  className="btn btn-ghost btn-sm mt-2"
                >
                  Use the Split layout
                </button>
              </div>
            ) : imageId && !imageShowsInBody ? (
              <p className="hint mb-3">
                Shown in the sidebar, where this block is targeted. The{' '}
                <strong>{CTA_LABELS.layout[preview.layout]}</strong> layout has no
                place for an image, so a copy dropped into a post body will not
                show it — only <strong>Split</strong> does.
              </p>
            ) : null}

            <p className="hint">
              Shown across the top of the sidebar card, and in the right-hand panel
              of the <strong>Split</strong> layout. It is never cropped — the card
              grows to fit, so a tall image makes a tall card. Around 700px wide is
              plenty.
            </p>
            <div className="mt-3">
              <MediaPicker
                media={media}
                selectedId={imageId}
                onSelect={(item) => setImageId(item?.id ?? '')}
              />
            </div>
          </BuilderSection>

          {/*
            ALWAYS RENDERED, including for a link block, and that is a
            correctness requirement rather than a layout choice. saveLeadMagnet
            reads success_message, consent_text, asset_url and collect_name
            unconditionally, so a section that unmounts takes those four fields
            out of the FormData — and switching an email block to a link and
            pressing Save would quietly blank all four. The note covers the
            only cost of leaving it in, which is a moment of "why am I being
            asked this".
          */}
          <BuilderSection
            id="delivery"
            title="Delivery"
            summary={preview.kind === 'link' ? 'Email blocks only' : undefined}
            open={!!open.delivery}
            onToggle={toggle}
          >
            <div className="builder-stack">
                {preview.kind === 'link' ? (
                  <p className="hint">
                    These apply when a block captures an email. This one links
                    out instead, so they are kept but unused — switch it back to
                    Email capture and they are still here.
                  </p>
                ) : null}
                <label className="builder-check">
                  <input
                    type="checkbox"
                    name="collect_name"
                    defaultChecked={values.collectName}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-medium">Ask for a first name too</span>
                    <span className="block text-ink-muted">
                      A second field costs conversions and buys a name to greet
                      them by. Leave off unless the follow-up email needs it.
                    </span>
                  </span>
                </label>

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
                  <p className="hint mt-1">
                    Handed straight back after they submit, so they get it even if
                    the email never arrives. Never appears in the page source
                    before then. Leave blank if the file only goes out by email.
                  </p>
                </div>

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
                    defaultValue={values.consentText}
                    onChange={(e) => set('consentText', e.target.value)}
                    placeholder="No spam. Unsubscribe any time."
                    className={FIELD}
                  />
                  <p className="hint mt-1">
                    Optional, and deliberately not filled in for you — what consent
                    you need to state is your call, not this form&rsquo;s.
                  </p>
                </div>
            </div>
          </BuilderSection>

          <BuilderSection
            id="targeting"
            title="Where it appears"
            open={!!open.targeting}
            onToggle={toggle}
          >
            <div className="builder-stack">
              <p className="hint">
                Tick nothing and it appears nowhere. Where a post matches more than
                one offer the more specific one wins — a post beats a tag, a tag
                beats a category, a category beats site-wide — and only ever one
                card is shown.
              </p>

              <label className="builder-check">
                <input
                  type="checkbox"
                  name="target_site"
                  defaultChecked={values.siteWide}
                />
                <span className="font-medium">Every post</span>
              </label>

              <div>
                <span className="label">Categories</span>
                <p className="hint">
                  Includes posts filed under a child category, matching how the
                  category archives already work.
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
            </div>
          </BuilderSection>

          <BuilderSection
            id="advanced"
            title="Advanced"
            summary={slug || undefined}
            open={!!open.advanced}
            onToggle={toggle}
          >
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
              <p className="hint mt-1">
                What the webhook receives, so automations can branch on it, and what
                the marker in a post body refers to. Derived from the name if you
                leave it blank. Changing it later breaks any automation matching the
                old value — and any post that already has this block in it.
              </p>
            </div>
          </BuilderSection>

          <p className="hint px-1 pb-2">
            Saving refreshes every post, because targeting can change which ones show
            this. That takes a few seconds.
          </p>
        </form>

        {/* ---------------------------------------------------------------- */}
        <div className="builder-stage">
          {/*
            Which of the two places this block can turn up in. Not a device
            switcher — see the note below on why there isn't one.
          */}
          <div className="builder-places" role="group" aria-label="Preview placement">
            {([
              ['body', 'In a post body'],
              ['sidebar', 'In the sidebar'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPlacement(key)}
                aria-pressed={placement === key}
                className="builder-place"
              >
                {label}
              </button>
            ))}
          </div>

          <div
            className={
              placement === 'sidebar'
                ? 'builder-stage-inner builder-stage-aside'
                : 'builder-stage-inner'
            }
          >
            {/*
              The width is the blog's own article column, not a round number:
              max-w-7xl minus the page gutter minus the aside and the frame
              gutter. A block judged at a width it never gets is a block whose
              headline wraps somewhere else on the day it ships.

              NOT a device switcher. CtaBlock's internal breakpoints are `sm:`,
              which is the VIEWPORT, so narrowing this box would show the
              desktop arrangement at phone width — a preview that lies. Making
              a real one means rendering into an iframe, or moving CtaBlock to
              container queries so it answers to its column instead.
            */}
            {placement === 'sidebar' ? (
              /*
                THE REAL CARD, the same component the blog's sidebar renders —
                which is the only reason this is worth showing at all. It moved
                into @blog/ui for exactly this; before, the builder previewed
                the in-body block for every offer, including the ones that only
                ever appear here.

                `onClose` and `onConverted` do nothing: both belong to the
                wrapper on the blog, which also draws the orbiting gold edge
                this cannot — that reads --color-gold, a blog palette value its
                contrast test deliberately keeps out of shared code.
              */
              <LeadMagnetCard
                offer={previewOffer}
                onClose={() => {}}
                onConverted={() => {}}
              />
            ) : (
            <CtaBlock
              block={previewBlock}
              action={
                previewBlock.kind === 'email' ? (
                  /* A stand-in, as in the editor — a live form in a preview
                     invites someone to submit it. */
                  <span className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-5 py-3 text-sm ${
                        dark
                          ? 'border-white/25 text-white/50'
                          : 'border-[var(--cta-line)] text-[var(--cta-ink-muted)]'
                      }`}
                    >
                      you@example.com
                    </span>
                    <span className={buttonClass(dark)}>{previewBlock.buttonLabel}</span>
                  </span>
                ) : (
                  <CtaLinkButton block={previewBlock} />
                )
              }
            />
            )}

            {placement === 'sidebar' ? (
              <p className="builder-note">
                The sidebar has one arrangement, so <strong>Layout</strong> and the
                eyebrow do nothing here. Everything else — the background, the
                image, the copy and the button — is what a reader sees. The blog
                adds an orbiting gold edge this preview leaves off.
              </p>
            ) : null}
            {placement === 'body' && previewBlock.layout === 'split' && !previewImage ? (
              <p className="builder-note">
                Split needs an image. Without one it renders as Banner — here, and
                on the site.
              </p>
            ) : null}
            {placement === 'body' && previewBlock.layout === 'strip' ? (
              <p className="builder-note">
                Strip shows the headline and the button only. Body copy is not
                rendered in this layout.
              </p>
            ) : null}

          </div>

          {/*
            Outside the preview's box, so the leads table and the delete notice
            keep the full column when the preview narrows to the sidebar's
            350px. They are about the block, not part of it.
          */}
          {records ? <div className="builder-stage-inner">{records}</div> : null}
        </div>
      </div>
    </div>
  );
}
