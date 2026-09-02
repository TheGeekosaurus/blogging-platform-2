'use client';

import { useMemo, useRef, useState, useTransition } from 'react';

import { setMediaAlt, uploadImage } from '@/app/actions/media';
import type { MediaOption, MediaOptions } from '@/lib/queries';

/**
 * Visual image picker: a grid of thumbnails, with upload in place.
 *
 * Replaces a <select> of file names. Choosing an image by reading a truncated
 * storage path, having memorised which one you wanted, is the whole problem this
 * exists to remove — you pick by looking at it.
 *
 * NOTHING HERE MAY IMPORT FROM @blog/core's env or URL helpers. `mediaPublicUrl`
 * reads SUPABASE_URL, which has no NEXT_PUBLIC_ prefix and is therefore never
 * inlined into the browser bundle; calling it here throws in the user's browser.
 * URLs arrive pre-built from the server instead. Guarded by
 * apps/admin/__tests__/client-env.test.ts.
 */
export function MediaPicker({
  media,
  selectedId,
  onSelect,
  /** Featured image shows a clear option; inserting into a body does not. */
  allowNone = true,
  label,
}: {
  media: MediaOptions;
  selectedId: string;
  onSelect: (item: MediaOption | null) => void;
  allowNone?: boolean;
  label?: string;
}) {
  const [items, setItems] = useState(media.items);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) || (item.alt ?? '').toLowerCase().includes(q),
    );
  }, [items, filter]);

  function upload(file: File | undefined) {
    if (!file) return;
    setError(null);

    const formData = new FormData();
    formData.set('file', file);

    startTransition(async () => {
      const result = await uploadImage(formData);

      // Cleared either way, so retrying the same file still fires a change event.
      if (fileInput.current) fileInput.current.value = '';

      if (result.error || !result.media) {
        setError(result.error ?? 'Upload failed.');
        return;
      }

      setItems((current) => [result.media!, ...current]);
      onSelect(result.media);
    });
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        upload(event.dataTransfer.files?.[0]);
      }}
      className={`rounded border p-4 ${
        dragging ? 'border-slate-900 bg-slate-50' : 'border-slate-200'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {label ?? 'Click an image to choose it, or drop a file here to upload.'}
        </p>
        <label className="text-sm">
          <span className="sr-only">Filter images</span>
          <input
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter…"
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          />
        </label>
      </div>

      <ul className="mt-3 grid max-h-72 grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4 lg:grid-cols-6">
        <li>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={pending}
            className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded border-2 border-dashed border-slate-300 text-xs text-slate-600 hover:border-slate-500 disabled:opacity-60"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              +
            </span>
            {pending ? 'Uploading…' : 'Upload'}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            onChange={(event) => upload(event.target.files?.[0])}
            className="sr-only"
            tabIndex={-1}
          />
        </li>

        {allowNone ? (
          <li>
            <button
              type="button"
              onClick={() => onSelect(null)}
              aria-pressed={selectedId === ''}
              className={`aspect-square w-full rounded border text-xs ${
                selectedId === ''
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 text-slate-600 hover:border-slate-400'
              }`}
            >
              No image
            </button>
          </li>
        ) : null}

        {shown.map((item) => {
          const isSelected = item.id === selectedId;

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                aria-pressed={isSelected}
                title={item.alt?.trim() || item.name}
                className={`relative block aspect-square w-full overflow-hidden rounded border-2 ${
                  isSelected ? 'border-slate-900' : 'border-transparent hover:border-slate-400'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.alt ?? ''}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                {isSelected ? (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-1 right-1 rounded-full bg-slate-900 px-1.5 text-xs text-white"
                  >
                    ✓
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      {shown.length === 0 && filter.trim() ? (
        <p className="mt-3 text-sm text-slate-600">Nothing matches “{filter.trim()}”.</p>
      ) : null}

      {media.total > items.length ? (
        <p className="mt-3 text-xs text-slate-500">
          Showing the {items.length} most recent of {media.total} images. Older ones are in
          Media.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {selected ? <AltField item={selected} onSaved={(alt) => {
        setItems((current) =>
          current.map((item) => (item.id === selected.id ? { ...item, alt } : item)),
        );
      }} /> : null}
    </div>
  );
}

/**
 * Alt text for the chosen image, editable here.
 *
 * Without this the trip to the Media library survives for alt text alone, which
 * is the trip this component exists to remove. Saves on blur rather than behind
 * a button: it is one field, and a button people do not press leaves images
 * without alt text.
 */
function AltField({
  item,
  onSaved,
}: {
  item: MediaOption;
  onSaved: (alt: string) => void;
}) {
  const [value, setValue] = useState(item.alt ?? '');
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Reset when a different image is chosen.
  const [lastId, setLastId] = useState(item.id);
  if (lastId !== item.id) {
    setLastId(item.id);
    setValue(item.alt ?? '');
    setState('idle');
  }

  async function save() {
    if (value.trim() === (item.alt ?? '').trim()) return;
    setState('saving');
    const result = await setMediaAlt(item.id, value);
    if (result.error) {
      setState('error');
      return;
    }
    setState('saved');
    onSaved(value.trim());
  }

  return (
    <div className="mt-4 border-t border-slate-200 pt-3">
      <label htmlFor={`alt-${item.id}`} className="block text-sm font-medium">
        Alt text
      </label>
      <p className="mt-1 text-xs text-slate-500">
        Describes the image for screen readers and search engines. Leave empty only if it
        is purely decorative.
      </p>
      <div className="mt-1 flex items-center gap-2">
        <input
          id={`alt-${item.id}`}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setState('idle');
          }}
          onBlur={save}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <span className="w-16 shrink-0 text-xs text-slate-500">
          {state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : ''}
        </span>
      </div>
      {state === 'error' ? (
        <p role="alert" className="mt-1 text-sm text-red-700">
          Could not save the alt text.
        </p>
      ) : null}
    </div>
  );
}
