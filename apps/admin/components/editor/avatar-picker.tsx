'use client';

import { useState } from 'react';

import type { MediaOptions } from '@/lib/queries';
import { MediaPicker } from './media-picker';

/**
 * The author's photo.
 *
 * A thin wrapper over <MediaPicker>, the same shape as featured-image-picker:
 * the grid, plus the hidden input the author form reads. Uploading lands in the
 * media library immediately; the selection only takes effect when the author is
 * saved.
 *
 * Note what is NOT here: any call to `mediaPublicUrl`. It reads SUPABASE_URL,
 * which is never inlined into the browser bundle, so calling it from a client
 * component throws in the user's browser. URLs arrive pre-built from the server.
 * Guarded by apps/admin/__tests__/client-env.test.ts.
 */
export function AvatarPicker({
  media,
  defaultValue,
}: {
  media: MediaOptions;
  defaultValue: string | null;
}) {
  const [selectedId, setSelectedId] = useState(defaultValue ?? '');

  return (
    <fieldset>
      <legend className="text-sm font-medium">Photo</legend>
      <p className="mt-1 text-sm text-slate-600">
        Shown beside the byline on each of this author&apos;s posts. A square crop
        reads best.
      </p>

      <input type="hidden" name="avatar_id" value={selectedId} />

      <div className="mt-3">
        <MediaPicker
          media={media}
          selectedId={selectedId}
          onSelect={(item) => setSelectedId(item?.id ?? '')}
          label="Click an image to use it as the photo, or drop a file here to upload."
        />
      </div>
    </fieldset>
  );
}
