import { mediaPublicUrl } from '@blog/core';

import { deleteMedia, updateAlt } from '@/app/actions/media';
import { CopyButton } from '@/components/copy-button';
import { MediaUploader } from '@/components/media-uploader';
import { requireCurrentSite } from '@/lib/current-site';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function MediaPage() {
  const site = await requireCurrentSite();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('media')
    .select('*')
    .eq('site_id', site.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Could not load media: ${error.message}`);
  const items = data ?? [];

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">Media</h1>

      <div className="mt-5">
        <MediaUploader />
      </div>

      {items.length === 0 ? (
        <p className="mt-10 text-slate-600">Nothing uploaded yet.</p>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const url = mediaPublicUrl(item.storage_path);

            return (
              <li key={item.id} className="rounded border border-slate-200 p-3">
                {/* Plain <img>: this is a management grid, not the public site,
                    so Next image optimisation would only add cost here. */}
                <img
                  src={url}
                  alt={item.alt ?? ''}
                  width={item.width ?? undefined}
                  height={item.height ?? undefined}
                  className="h-40 w-full rounded object-cover"
                />

                <form action={updateAlt} className="mt-3 flex gap-2">
                  <input type="hidden" name="id" value={item.id} />
                  <label htmlFor={`alt-${item.id}`} className="sr-only">
                    Alt text
                  </label>
                  <input
                    id={`alt-${item.id}`}
                    name="alt"
                    defaultValue={item.alt ?? ''}
                    placeholder="Describe this image"
                    className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                  <button type="submit" className="rounded border border-slate-300 px-2 text-sm">
                    Save
                  </button>
                </form>

                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                  <span>
                    {item.width && item.height ? `${item.width}×${item.height}` : 'unknown size'}
                  </span>
                  <CopyButton value={url} label="Copy URL" />
                  <form action={deleteMedia} className="ml-auto">
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="storage_path" value={item.storage_path} />
                    <button type="submit" className="text-red-700 underline">
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-8 text-sm text-slate-500">
        Copy an image URL, then use the editor&apos;s Image button to insert it. Alt text
        set here is for the library; the editor asks for alt text on insert.
      </p>
    </>
  );
}
