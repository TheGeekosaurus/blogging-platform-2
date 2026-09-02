'use client';

import { useState } from 'react';

import type { MediaOptions } from '@/lib/queries';
import { MediaPicker } from './media-picker';

/**
 * The post's featured image.
 *
 * A thin wrapper over <MediaPicker>: the grid, plus the hidden input the post
 * form already reads. The selection only takes effect when the post is saved,
 * while an upload lands in the media library immediately — same as the library's
 * own uploader.
 */
export function FeaturedImagePicker({
  media,
  defaultValue,
}: {
  media: MediaOptions;
  defaultValue: string | null;
}) {
  const [selectedId, setSelectedId] = useState(defaultValue ?? '');

  return (
    <fieldset>
      <legend className="text-sm font-medium">Featured image</legend>
      <p className="mt-1 text-sm text-slate-600">
        Shown at the top of the post and as its thumbnail in listings.
      </p>

      {/* What reaches savePost. Empty string means "no image". */}
      <input type="hidden" name="featured_image_id" value={selectedId} />

      <div className="mt-3">
        <MediaPicker
          media={media}
          selectedId={selectedId}
          onSelect={(item) => setSelectedId(item?.id ?? '')}
        />
      </div>
    </fieldset>
  );
}
