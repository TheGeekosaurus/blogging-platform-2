'use client';

import { useActionState } from 'react';

import { uploadMedia, type UploadState } from '@/app/actions/media';

const INITIAL: UploadState = {};

export function MediaUploader() {
  const [state, formAction, pending] = useActionState(uploadMedia, INITIAL);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="files" className="label">
          Upload images
        </label>
        <input
          id="files"
          name="files"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          required
          className="mt-1 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary"
      >
        {pending ? 'Uploading…' : 'Upload'}
      </button>

      {state.error ? (
        <p role="alert" className="w-full text-sm text-danger-ink">
          {state.error}
        </p>
      ) : null}
      {state.uploaded ? (
        <p className="w-full text-sm text-success-ink">
          Uploaded {state.uploaded} {state.uploaded === 1 ? 'image' : 'images'}.
        </p>
      ) : null}
    </form>
  );
}
