'use client';

import { useRef, useState, useTransition } from 'react';

import { mediaPublicUrl } from '@blog/core';

import { uploadFeaturedImage } from '@/app/actions/media';

export interface MediaOption {
  id: string;
  storage_path: string;
  alt: string | null;
}

/**
 * Choose a post's featured image, from the library or by uploading a new one.
 *
 * The upload calls a server action directly rather than through `<form action>`,
 * because this component renders inside the post form and a nested <form> is
 * invalid HTML — the parser drops it and the file would never be sent.
 *
 * The selection travels with the post form as a hidden input, so the image is
 * only attached when the post is saved. Uploading adds the file to the media
 * library immediately either way, which is the same thing the library's own
 * uploader does.
 */
export function FeaturedImagePicker({
  media,
  defaultValue,
}: {
  media: MediaOption[];
  defaultValue: string | null;
}) {
  const [options, setOptions] = useState(media);
  const [selectedId, setSelectedId] = useState(defaultValue ?? '');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const selected = options.find((item) => item.id === selectedId);

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    const formData = new FormData();
    formData.set('file', file);

    startTransition(async () => {
      const result = await uploadFeaturedImage(formData);

      // Clear the input either way, so picking the same file again re-fires
      // change and a failed upload can be retried without choosing another file.
      if (fileInput.current) fileInput.current.value = '';

      if (result.error || !result.media) {
        setError(result.error ?? 'Upload failed.');
        return;
      }

      setOptions((current) => [
        { id: result.media!.id, storage_path: result.media!.storage_path, alt: null },
        ...current,
      ]);
      setSelectedId(result.media!.id);
    });
  }

  return (
    <fieldset>
      <legend className="text-sm font-medium">Featured image</legend>
      <p className="mt-1 text-sm text-slate-600">
        Shown at the top of the post and as its thumbnail in listings.
      </p>

      {/* What actually reaches savePost. Empty string means "no image". */}
      <input type="hidden" name="featured_image_id" value={selectedId} />

      <div className="mt-3 flex flex-wrap items-start gap-4">
        <div className="flex h-28 w-42 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-50">
          {selected ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={mediaPublicUrl(selected.storage_path)}
              alt={selected.alt ?? ''}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="px-3 text-center text-xs text-slate-500">No image</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div>
            <label htmlFor="featured_pick" className="sr-only">
              Choose from the media library
            </label>
            <select
              id="featured_pick"
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              className="rounded border border-slate-300 px-2 py-2 text-sm"
            >
              <option value="">(none)</option>
              {options.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.alt?.trim() || item.storage_path.split('/').pop()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              onChange={onFileChange}
              disabled={pending}
              className="text-sm"
            />
            {pending ? <span className="text-xs text-slate-500">Uploading…</span> : null}
          </div>

          {selectedId ? (
            <button
              type="button"
              onClick={() => setSelectedId('')}
              className="self-start text-xs underline"
            >
              Remove
            </button>
          ) : null}

          {error ? (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </fieldset>
  );
}
