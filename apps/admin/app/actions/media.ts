'use server';

import { randomUUID } from 'node:crypto';

import { revalidatePath } from 'next/cache';
import sharp from 'sharp';

import { MEDIA_BUCKET } from '@blog/core';

import { requireCurrentSite } from '@/lib/current-site';
import { createClient } from '@/lib/supabase/server';

export interface UploadState {
  error?: string;
  uploaded?: number;
}

const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/avif', 'avif'],
  ['image/gif', 'gif'],
]);

/**
 * A tiny blurred stand-in, inlined as a data URI.
 *
 * Stored so next/image can paint something immediately at the right aspect
 * ratio. 16px wide keeps it well under a kilobyte — big enough to suggest the
 * image, small enough that inlining it costs nothing.
 */
async function blurPlaceholder(input: Buffer): Promise<string | null> {
  try {
    const tiny = await sharp(input).resize(16, null, { fit: 'inside' }).webp({ quality: 40 }).toBuffer();
    return `data:image/webp;base64,${tiny.toString('base64')}`;
  } catch {
    return null;
  }
}

export async function uploadMedia(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const site = await requireCurrentSite();
  const supabase = await createClient();

  const files = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: 'Choose at least one image.' };

  let uploaded = 0;

  for (const file of files) {
    if (file.size > MAX_BYTES) {
      return { error: `${file.name} is larger than 10 MB.` };
    }

    const extension = ALLOWED.get(file.type);
    if (!extension) {
      return { error: `${file.name} is a ${file.type || 'unknown'} file. Images only.` };
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Dimensions come from the bytes, not from anything the client claimed —
    // storing wrong ones would reintroduce the layout shift they exist to prevent.
    let width: number | null = null;
    let height: number | null = null;
    try {
      const meta = await sharp(buffer).metadata();
      width = meta.width ?? null;
      height = meta.height ?? null;
    } catch {
      return { error: `${file.name} could not be read as an image.` };
    }

    const storagePath = `${site.id}/${randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      return { error: `Upload failed for ${file.name}: ${uploadError.message}` };
    }

    const { error: rowError } = await supabase.from('media').insert({
      site_id: site.id,
      storage_path: storagePath,
      alt: '',
      width,
      height,
      blur_data_url: await blurPlaceholder(buffer),
      mime_type: file.type,
      bytes: file.size,
    });

    if (rowError) {
      // Roll back the object so the bucket does not accumulate files no row
      // points at.
      await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
      return { error: `Could not record ${file.name}: ${rowError.message}` };
    }

    uploaded += 1;
  }

  revalidatePath('/media');
  return { uploaded };
}

export async function updateAlt(formData: FormData) {
  const site = await requireCurrentSite();
  const supabase = await createClient();

  const { error } = await supabase
    .from('media')
    .update({ alt: String(formData.get('alt') ?? '').trim() })
    .eq('id', String(formData.get('id') ?? ''))
    .eq('site_id', site.id);

  if (error) throw new Error(`Could not save the alt text: ${error.message}`);
  revalidatePath('/media');
}

export async function deleteMedia(formData: FormData) {
  const site = await requireCurrentSite();
  const supabase = await createClient();

  const id = String(formData.get('id') ?? '');
  const storagePath = String(formData.get('storage_path') ?? '');

  const { error } = await supabase.from('media').delete().eq('id', id).eq('site_id', site.id);
  if (error) throw new Error(`Could not delete: ${error.message}`);

  // Best-effort: an orphaned object wastes space but breaks nothing, whereas a
  // failed row delete would leave a broken entry in the library.
  if (storagePath) {
    await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
  }

  revalidatePath('/media');
}
