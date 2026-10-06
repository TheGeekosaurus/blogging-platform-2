'use client';

import { useActionState, useState } from 'react';

import type {
  ProofFrequency,
  ProofImageMode,
  ProofPosition,
  ProofTemplate,
  TermRow,
} from '@blog/core';
import {
  PROOF_PRESET_ICONS,
  proofPlace,
  type ProofEventPayload,
  type ProofPresetIcon,
} from '@blog/core/proof';
import { ProofToast } from '@blog/core/proof-toast';

import { saveProofCampaign, type ProofCampaignState } from '@/app/actions/proof-notifications';
import { MediaPicker } from '@/components/editor/media-picker';
import { blankEvent, parsePastedEvents, type ProofEventDraft } from '@/lib/proof-events';
import type { MediaOptions, PostOption } from '@/lib/queries';

const INITIAL: ProofCampaignState = {};
const FIELD = 'field mt-1';
const SMALL = 'field field-sm';
const DEFAULT_ACCENT = '#2563eb';

export type { ProofEventDraft };

export interface ProofCampaignFormValues {
  id?: string;
  name: string;
  active: boolean;
  template: ProofTemplate;
  imageMode: ProofImageMode;
  presetIcon: ProofPresetIcon;
  imageId: string | null;
  position: ProofPosition;
  showOnMobile: boolean;
  initialDelayS: number;
  displayS: number;
  gapS: number;
  maxPerView: number;
  repeat: boolean;
  frequency: ProofFrequency;
  showTimeAgo: boolean;
  accent: string | null;
  siteWide: boolean;
  categoryIds: string[];
  tagIds: string[];
  postIds: string[];
  includePaths: string;
  excludePaths: string;
  events: ProofEventDraft[];
}

const PRESET_LABEL: Record<ProofPresetIcon, string> = {
  fire: '🔥',
  check: '✅',
  cart: '🛒',
  star: '⭐',
  bell: '🔔',
  gift: '🎁',
  download: '📥',
  user: '👤',
};

/** The checkbox list from the lead-magnet form — see the reasoning there. */
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
    <div className="mt-1 max-h-48 overflow-y-auto rounded-control border border-line p-3">
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

function Choice<T extends string>({
  name,
  value,
  current,
  onChange,
  children,
}: {
  name: string;
  value: T;
  current: T;
  onChange: (value: T) => void;
  children: React.ReactNode;
}) {
  const on = value === current;
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-control border px-3 py-2 text-sm ${
        on ? 'border-brand bg-brand-softer font-medium' : 'border-line'
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={on}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      {children}
    </label>
  );
}

export function ProofCampaignForm({
  terms,
  posts,
  media,
  values,
}: {
  terms: TermRow[];
  posts: PostOption[];
  media: MediaOptions;
  values: ProofCampaignFormValues;
}) {
  const [state, formAction, pending] = useActionState(saveProofCampaign, INITIAL);

  const [template, setTemplate] = useState(values.template);
  const [imageMode, setImageMode] = useState(values.imageMode);
  const [presetIcon, setPresetIcon] = useState(values.presetIcon);
  const [imageId, setImageId] = useState(values.imageId ?? '');
  const [position, setPosition] = useState(values.position);
  const [accent, setAccent] = useState(values.accent ?? DEFAULT_ACCENT);
  const [showTimeAgo, setShowTimeAgo] = useState(values.showTimeAgo);
  const [events, setEvents] = useState<ProofEventDraft[]>(
    values.events.length > 0 ? values.events : [blankEvent()],
  );
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [paste, setPaste] = useState('');

  const categories = terms.filter((term) => term.kind === 'category');
  const tags = terms.filter((term) => term.kind === 'tag');
  const mediaUrl = (id: string | null) =>
    id ? (media.items.find((item) => item.id === id) ?? null) : null;

  const update = (key: string, patch: Partial<ProofEventDraft>) =>
    setEvents((list) => list.map((e) => (e.key === key ? { ...e, ...patch } : e)));

  const move = (key: string, by: -1 | 1) =>
    setEvents((list) => {
      const i = list.findIndex((e) => e.key === key);
      const j = i + by;
      if (i < 0 || j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });

  const previewDraft =
    events.find((e) => e.key === previewKey) ?? events.find((e) => e.action.trim()) ?? events[0];

  /** The draft as the toast will receive it, image precedence included. */
  const preview = ((): { event: ProofEventPayload; mapPending: boolean } | null => {
    if (!previewDraft) return null;
    const place = proofPlace(previewDraft);
    const fullPlace =
      [previewDraft.city, previewDraft.region, previewDraft.country].filter(Boolean).join(', ') ||
      null;

    let image: ProofEventPayload['image'] = null;
    let isMap = false;
    let mapPending = false;

    if (imageMode !== 'none') {
      const own = mediaUrl(previewDraft.imageId);
      if (own) image = { url: own.url, alt: own.alt };
      if (!image && imageMode === 'map') {
        if (previewDraft.mapUrl && previewDraft.mapPlace === fullPlace) {
          image = { url: previewDraft.mapUrl, alt: null };
          isMap = true;
        } else if (fullPlace) {
          mapPending = true;
        }
      }
      if (!image && imageMode === 'custom') {
        const campaign = mediaUrl(imageId);
        if (campaign) image = { url: campaign.url, alt: campaign.alt };
      }
    }

    return {
      mapPending,
      event: {
        name: previewDraft.name || null,
        place,
        action: previewDraft.action || 'recently got the guide',
        minutesAgo: [previewDraft.minutesMin, previewDraft.minutesMax],
        link: null,
        image,
        isMap,
      },
    };
  })();

  const [vertical, horizontal] = position.split('-') as ['top' | 'bottom', 'left' | 'right'];

  return (
    <form action={formAction} className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <div className="flex max-w-2xl flex-1 flex-col gap-5">
        {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
        <input
          type="hidden"
          name="events_json"
          value={JSON.stringify(
            events.map(({ key: _key, mapUrl: _url, mapPlace: _place, ...event }) => event),
          )}
        />

        {state.error ? (
          <p role="alert" className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
            {state.error}
          </p>
        ) : null}
        {state.staleWarning ? (
          <p role="alert" className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {state.staleWarning}
          </p>
        ) : null}
        {state.mapWarning ? (
          <p role="alert" className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {state.mapWarning}
          </p>
        ) : null}
        {state.savedId && !state.staleWarning ? (
          <p className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Saved, and the live site was refreshed.
          </p>
        ) : null}

        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Name
          </label>
          <input id="name" name="name" required defaultValue={values.name} className={FIELD} />
          <p className="mt-1 text-sm text-ink-muted">Internal only. Readers never see it.</p>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="active" defaultChecked={values.active} />
          Live on the site
        </label>

        {/* ---------------------------------------------------------------- */}
        <fieldset className="flex flex-col gap-5 border-t border-line pt-5">
          <legend className="text-sm font-semibold">Look</legend>

          <div>
            <span className="block text-sm font-medium">Template</span>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <Choice name="template" value="pill" current={template} onChange={setTemplate}>
                <span aria-hidden="true" className="inline-block h-4 w-8 rounded-full border border-current" />
                Rounded
              </Choice>
              <Choice name="template" value="card" current={template} onChange={setTemplate}>
                <span aria-hidden="true" className="inline-block h-4 w-8 rounded border border-current" />
                Square, rounded corners
              </Choice>
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium">Image on the left</span>
            <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Choice name="image_mode" value="none" current={imageMode} onChange={setImageMode}>
                No image
              </Choice>
              <Choice name="image_mode" value="preset" current={imageMode} onChange={setImageMode}>
                Icon
              </Choice>
              <Choice name="image_mode" value="custom" current={imageMode} onChange={setImageMode}>
                Your image
              </Choice>
              <Choice name="image_mode" value="map" current={imageMode} onChange={setImageMode}>
                City map
              </Choice>
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              {imageMode === 'map'
                ? 'Each event gets a map of its own city, drawn from OpenStreetMap when you save. Events without a city — or one the map service cannot find — show the icon below.'
                : imageMode === 'custom'
                  ? 'One image for every event. Any event can still override it with its own.'
                  : imageMode === 'none'
                    ? 'Text only.'
                    : 'One of the built-in icons. Any event can override it with its own image.'}
            </p>
          </div>

          {imageMode !== 'none' && imageMode !== 'custom' ? (
            <div>
              <span className="block text-sm font-medium">
                {imageMode === 'map' ? 'Fallback icon' : 'Icon'}
              </span>
              <input type="hidden" name="preset_icon" value={presetIcon} />
              <div className="mt-1 flex flex-wrap gap-2">
                {PROOF_PRESET_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setPresetIcon(icon)}
                    aria-pressed={presetIcon === icon}
                    aria-label={icon}
                    className={`flex h-11 w-11 items-center justify-center rounded-full border text-xl ${
                      presetIcon === icon ? 'border-brand bg-brand-softer' : 'border-line'
                    }`}
                  >
                    {PRESET_LABEL[icon]}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <input type="hidden" name="preset_icon" value={presetIcon} />
          )}

          <input type="hidden" name="image_id" value={imageId} />
          {imageMode === 'custom' ? (
            <div>
              <span className="block text-sm font-medium">Image</span>
              <p className="mt-1 text-sm text-ink-muted">
                Square works best — it is cropped to a {template === 'pill' ? 'circle' : 'rounded square'} about 60px across.
              </p>
              <div className="mt-3">
                <MediaPicker
                  media={media}
                  selectedId={imageId}
                  onSelect={(item) => setImageId(item?.id ?? '')}
                />
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="position" className="block text-sm font-medium">
                Corner
              </label>
              <select
                id="position"
                name="position"
                value={position}
                onChange={(e) => setPosition(e.target.value as ProofPosition)}
                className={FIELD}
              >
                <option value="bottom-left">Bottom left</option>
                <option value="bottom-right">Bottom right</option>
                <option value="top-left">Top left</option>
                <option value="top-right">Top right</option>
              </select>
            </div>
            <div>
              <label htmlFor="accent" className="block text-sm font-medium">
                Accent colour
              </label>
              <input
                id="accent"
                name="accent"
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="mt-1 h-10 w-20 cursor-pointer rounded-control border border-line"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="show_time_ago"
              checked={showTimeAgo}
              onChange={(e) => setShowTimeAgo(e.target.checked)}
            />
            Show how long ago (&ldquo;7 min ago&rdquo;)
          </label>
        </fieldset>

        {/* ---------------------------------------------------------------- */}
        <fieldset className="flex flex-col gap-4 border-t border-line pt-5">
          <legend className="text-sm font-semibold">Events</legend>
          <p className="text-sm text-ink-muted">
            Shown in this order, one at a time. Leave the name blank for
            &ldquo;Someone&rdquo;. The time shown is picked at random inside each
            event&rsquo;s range on every view, so it never looks frozen.{' '}
            <strong>Use real activity</strong> — a toast claiming something that did
            not happen is a deceptive claim, not a design choice.
          </p>

          <ol className="flex flex-col gap-3">
            {events.map((event, index) => {
              const open = openKey === event.key;
              const own = mediaUrl(event.imageId);
              return (
                <li key={event.key} className="rounded-control border border-line p-3">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <input
                      aria-label={`Event ${index + 1} name`}
                      placeholder="Name"
                      value={event.name}
                      onChange={(e) => update(event.key, { name: e.target.value })}
                      className={SMALL}
                    />
                    <input
                      aria-label={`Event ${index + 1} city`}
                      placeholder="City"
                      value={event.city}
                      onChange={(e) => update(event.key, { city: e.target.value })}
                      className={SMALL}
                    />
                    <input
                      aria-label={`Event ${index + 1} state or region`}
                      placeholder="State / region"
                      value={event.region}
                      onChange={(e) => update(event.key, { region: e.target.value })}
                      className={SMALL}
                    />
                    <input
                      aria-label={`Event ${index + 1} country`}
                      placeholder="Country"
                      value={event.country}
                      onChange={(e) => update(event.key, { country: e.target.value })}
                      className={SMALL}
                    />
                    <input
                      aria-label={`Event ${index + 1} action`}
                      placeholder="recently got the Equipment Financing Guide"
                      value={event.action}
                      onChange={(e) => update(event.key, { action: e.target.value })}
                      className={`${SMALL} col-span-2 sm:col-span-4`}
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-1 text-sm">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPreviewKey(event.key)}>
                      Preview
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      aria-expanded={open}
                      onClick={() => setOpenKey(open ? null : event.key)}
                    >
                      {open ? 'Less' : 'Time, link & image'}
                    </button>
                    <span className="flex-1" />
                    <button type="button" className="btn btn-ghost btn-sm" aria-label="Move up" onClick={() => move(event.key, -1)}>
                      ↑
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" aria-label="Move down" onClick={() => move(event.key, 1)}>
                      ↓
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      aria-label="Remove event"
                      onClick={() => setEvents((list) => list.filter((e) => e.key !== event.key))}
                    >
                      ✕
                    </button>
                  </div>

                  {open ? (
                    <div className="mt-3 flex flex-col gap-3 border-t border-line pt-3">
                      <div className="flex flex-wrap items-end gap-2 text-sm">
                        <label>
                          <span className="block">Between (minutes ago)</span>
                          <input
                            type="number"
                            min={0}
                            value={event.minutesMin}
                            onChange={(e) => update(event.key, { minutesMin: Number(e.target.value) })}
                            className={`${SMALL} w-24`}
                          />
                        </label>
                        <label>
                          <span className="block">and</span>
                          <input
                            type="number"
                            min={0}
                            value={event.minutesMax}
                            onChange={(e) => update(event.key, { minutesMax: Number(e.target.value) })}
                            className={`${SMALL} w-24`}
                          />
                        </label>
                        <span className="pb-2 text-ink-muted">1440 = a day</span>
                      </div>
                      <label className="text-sm">
                        <span className="block">Link (optional)</span>
                        <input
                          value={event.link}
                          placeholder="/funding-solutions or https://…"
                          onChange={(e) => update(event.key, { link: e.target.value })}
                          className={`${SMALL} w-full`}
                        />
                      </label>
                      <div className="text-sm">
                        <span className="block">
                          Own image {own ? '' : '(optional — overrides the campaign image)'}
                        </span>
                        <div className="mt-2">
                          <MediaPicker
                            media={media}
                            selectedId={event.imageId ?? ''}
                            onSelect={(item) => update(event.key, { imageId: item?.id ?? null })}
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>

          <div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEvents((l) => [...l, blankEvent()])}>
              Add event
            </button>
          </div>

          <details className="rounded-control border border-line p-3 text-sm">
            <summary className="cursor-pointer font-medium">Paste a list</summary>
            <p className="mt-2 text-ink-muted">
              One per line: <code>name, city, state, country, action</code>. Copying
              rows straight out of Google Sheets or Excel works too.
            </p>
            <textarea
              rows={4}
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder={'James, San Diego, CA, US, recently got the Equipment Financing Guide\nMaria, Austin, TX, US, booked a funding call'}
              className={FIELD}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm mt-2"
              onClick={() => {
                const parsed = parsePastedEvents(paste);
                if (parsed.length === 0) return;
                setEvents((list) => [
                  ...list.filter((e) => e.name || e.city || e.action),
                  ...parsed,
                ]);
                setPaste('');
              }}
            >
              Add these
            </button>
          </details>
        </fieldset>

        {/* ---------------------------------------------------------------- */}
        <fieldset className="flex flex-col gap-5 border-t border-line pt-5">
          <legend className="text-sm font-semibold">Where it appears</legend>

          <p className="text-sm text-ink-muted">
            Tick nothing and it appears nowhere. Where a page matches several
            campaigns the most specific wins — a post beats a tag, a tag beats a
            category, a category beats a URL pattern, a pattern beats the whole site —
            and only one ever shows. An excluded URL always wins.
          </p>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="target_site" defaultChecked={values.siteWide} />
            Every page on the site
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="include_paths" className="block text-sm font-medium">
                Only on these URLs
              </label>
              <textarea
                id="include_paths"
                name="include_paths"
                rows={4}
                defaultValue={values.includePaths}
                placeholder={'/\n/blog/**\n/calculators/*'}
                className={`${FIELD} font-mono text-xs`}
              />
            </div>
            <div>
              <label htmlFor="exclude_paths" className="block text-sm font-medium">
                Never on these URLs
              </label>
              <textarea
                id="exclude_paths"
                name="exclude_paths"
                rows={4}
                defaultValue={values.excludePaths}
                placeholder={'/get-started\n/funding-solutions/**'}
                className={`${FIELD} font-mono text-xs`}
              />
            </div>
          </div>
          <p className="-mt-3 text-sm text-ink-muted">
            One per line. <code>/blog/*</code> is every page one level under /blog;{' '}
            <code>/blog/**</code> is /blog and everything below it. Full URLs pasted
            from the address bar work.
          </p>

          <div>
            <span className="block text-sm font-medium">Posts in these categories</span>
            <p className="text-sm text-ink-muted">Includes posts filed under a child category.</p>
            <CheckboxList
              name="target_category"
              options={categories.map((term) => ({ id: term.id, label: term.name }))}
              selected={values.categoryIds}
              empty="No categories yet."
            />
          </div>

          <div>
            <span className="block text-sm font-medium">Posts with these tags</span>
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

        {/* ---------------------------------------------------------------- */}
        <fieldset className="flex flex-col gap-4 border-t border-line pt-5">
          <legend className="text-sm font-semibold">Timing</legend>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <label className="text-sm">
              <span className="block font-medium">First after</span>
              <input type="number" name="initial_delay_s" min={0} max={600} defaultValue={values.initialDelayS} className={FIELD} />
              <span className="text-ink-muted">seconds</span>
            </label>
            <label className="text-sm">
              <span className="block font-medium">Each stays</span>
              <input type="number" name="display_s" min={2} max={60} defaultValue={values.displayS} className={FIELD} />
              <span className="text-ink-muted">seconds</span>
            </label>
            <label className="text-sm">
              <span className="block font-medium">Gap between</span>
              <input type="number" name="gap_s" min={0} max={600} defaultValue={values.gapS} className={FIELD} />
              <span className="text-ink-muted">seconds</span>
            </label>
            <label className="text-sm">
              <span className="block font-medium">At most</span>
              <input type="number" name="max_per_view" min={1} max={50} defaultValue={values.maxPerView} className={FIELD} />
              <span className="text-ink-muted">per page view</span>
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="repeat_events" defaultChecked={values.repeat} />
            Start over from the first event after the last
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="show_on_mobile" defaultChecked={values.showOnMobile} />
            Show on phones
          </label>

          <div>
            <label htmlFor="frequency" className="block text-sm font-medium">
              How often
            </label>
            <select id="frequency" name="frequency" defaultValue={values.frequency} className={FIELD}>
              <option value="every_page">On every page they visit</option>
              <option value="once_per_session">Once per visit</option>
            </select>
            <p className="mt-1 text-sm text-ink-muted">
              Closing a toast always stops it for the rest of that visit.
            </p>
          </div>
        </fieldset>

        <div>
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? 'Saving…' : 'Save campaign'}
          </button>
          <p className="mt-2 text-sm text-ink-muted">
            Saving refreshes the live site
            {imageMode === 'map' ? ' and draws any new city maps — allow a second per new city' : ''}.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      <aside className="xl:sticky xl:top-6 xl:w-[420px] xl:shrink-0">
        <p className="mb-2 text-sm font-semibold">Preview</p>
        <div
          className="relative h-64 overflow-hidden rounded-control border border-line"
          style={{
            background:
              'repeating-linear-gradient(0deg, #f8fafc 0 22px, #f1f5f9 22px 23px), #f8fafc',
          }}
        >
          {preview ? (
            <div style={{ position: 'absolute', [vertical]: 12, [horizontal]: 12, transform: 'scale(0.92)', transformOrigin: `${vertical} ${horizontal}` }}>
              <ProofToast
                template={template}
                imageMode={imageMode}
                presetIcon={presetIcon}
                accent={accent}
                event={preview.event}
                minutesAgo={showTimeAgo ? Math.max(preview.event.minutesAgo[0], 7) : null}
                onClose={() => {}}
              />
            </div>
          ) : null}
        </div>
        {preview?.mapPending ? (
          <p className="mt-2 text-sm text-ink-muted">
            The map for this city is drawn when you save; the icon stands in until then.
          </p>
        ) : null}
      </aside>
    </form>
  );
}
