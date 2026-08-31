-- 0003_storage.sql — the media bucket
--
-- Supabase Storage keeps object metadata in storage.objects, which has its own
-- RLS. The `media` table's policies govern our metadata row; these govern the
-- bytes. Both are needed — securing one and not the other leaves a gap.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- Objects are keyed `{site_id}/{uuid}.{ext}`, so the first path segment is the
-- site. storage.foldername() returns those segments as an array.
create or replace function public.storage_site_id(object_name text)
returns uuid
language plpgsql
immutable
as $$
declare
  first_segment text;
begin
  first_segment := (storage.foldername(object_name))[1];
  return first_segment::uuid;
exception when others then
  -- A key that is not `{uuid}/...` belongs to no site and will fail every
  -- policy below, which is the intended outcome.
  return null;
end;
$$;

-- Public read: the bucket is public, so this simply makes that explicit rather
-- than leaving it to bucket configuration alone.
create policy "media public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media');

create policy "media member insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'media'
    and public.has_site_role(public.storage_site_id(name), 'author')
  );

create policy "media member update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'media'
    and public.has_site_role(public.storage_site_id(name), 'author')
  );

create policy "media member delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'media'
    and public.has_site_role(public.storage_site_id(name), 'editor')
  );
