-- 0002_rls.sql — row level security
--
-- Security model
-- --------------
-- Two consumers, two key types:
--
--   apps/blog   anon key. READ ONLY, and only ever published content. Deliberately
--               NOT the service-role key: with one Vercel project per blog that
--               key would be copied into N projects — N places to leak from — for
--               an app that never writes.
--
--   apps/admin  the signed-in user's own JWT. Every write is gated on the caller's
--               site_members role, so authorization is enforced by the database
--               rather than only by application code.
--
-- The service-role key is used in exactly one place: tools/wp-import, run locally.
-- It bypasses RLS entirely, which is why it must never reach a deployment.

-- ---------------------------------------------------------------------------
-- Table privileges
-- ---------------------------------------------------------------------------
-- RLS policies filter rows; they do not grant access. GRANT decides whether a
-- role may touch a table at all, and the two work together.
--
-- A Supabase project sets default privileges that would grant anon and
-- authenticated full DML on every new public table automatically. Relying on
-- that is doubly unwise: it is invisible project configuration this repo does
-- not control, and it would give `anon` INSERT/UPDATE/DELETE rights that are
-- withheld only by the absence of a permissive policy. One accidental
-- `for all` policy would then be a write hole.
--
-- So privileges are revoked and re-granted explicitly. `anon` ends up with
-- SELECT and nothing else, on only the tables the public site reads.

revoke all on all tables in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;

-- Public site: read-only, and only the tables it renders from.
grant select on public.sites, public.posts, public.terms, public.post_terms,
                public.media, public.redirects
  to anon;

-- Signed-in users: DML allowed, then narrowed by the policies below.
grant select, insert, update, delete on
  public.posts, public.terms, public.post_terms, public.media, public.redirects
  to authenticated;
grant select, update on public.sites to authenticated;
grant select, update on public.profiles to authenticated;
grant select, update on public.site_secrets to authenticated;
grant select, insert, update, delete on public.site_members to authenticated;

-- anon must never reach these, so no grant is issued at all.
revoke all on public.profiles, public.site_secrets, public.site_members from anon;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.sites        enable row level security;
alter table public.site_secrets enable row level security;
alter table public.profiles     enable row level security;
alter table public.site_members enable row level security;
alter table public.media        enable row level security;
alter table public.posts        enable row level security;
alter table public.terms        enable row level security;
alter table public.post_terms   enable row level security;
alter table public.redirects    enable row level security;

-- ---------------------------------------------------------------------------
-- Authorization helper
-- ---------------------------------------------------------------------------
-- security definer so the policies below can consult site_members without
-- recursing into site_members' own RLS policy.

create function public.has_site_role(p_site_id uuid, p_min_role member_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.site_members m
    where m.site_id = p_site_id
      and m.user_id = auth.uid()
      and public.role_rank(m.role) >= public.role_rank(p_min_role)
  );
$$;

revoke all on function public.has_site_role(uuid, member_role) from public;
grant execute on function public.has_site_role(uuid, member_role) to authenticated;

-- Is a post visible to the public right now?
create function public.post_is_public(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.posts p
    where p.id = p_post_id
      and p.status = 'published'
      and p.published_at is not null
      and p.published_at <= now()
  );
$$;

revoke all on function public.post_is_public(uuid) from public;
grant execute on function public.post_is_public(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- sites — public metadata, readable by everyone
-- ---------------------------------------------------------------------------

create policy sites_public_read on public.sites
  for select to anon, authenticated
  using (true);

create policy sites_admin_update on public.sites
  for update to authenticated
  using (public.has_site_role(id, 'admin'))
  with check (public.has_site_role(id, 'admin'));

-- Creating and deleting sites is an owner-level operation performed with the
-- service-role key (or straight SQL). No policy is granted for insert/delete,
-- so ordinary authenticated users cannot do either.

-- ---------------------------------------------------------------------------
-- site_secrets — no anon policy at all, by design
-- ---------------------------------------------------------------------------

create policy site_secrets_owner_read on public.site_secrets
  for select to authenticated
  using (public.has_site_role(site_id, 'admin'));

create policy site_secrets_owner_update on public.site_secrets
  for update to authenticated
  using (public.has_site_role(site_id, 'owner'))
  with check (public.has_site_role(site_id, 'owner'));

-- ---------------------------------------------------------------------------
-- profiles — never public (holds email addresses)
-- ---------------------------------------------------------------------------

create policy profiles_read_self on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- Members of a shared site can see each other, so the admin can list authors.
create policy profiles_read_co_members on public.profiles
  for select to authenticated
  using (
    exists (
      select 1
      from public.site_members mine
      join public.site_members theirs on theirs.site_id = mine.site_id
      where mine.user_id = auth.uid()
        and theirs.user_id = public.profiles.id
    )
  );

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- site_members
-- ---------------------------------------------------------------------------

create policy site_members_read on public.site_members
  for select to authenticated
  using (user_id = auth.uid() or public.has_site_role(site_id, 'admin'));

create policy site_members_admin_write on public.site_members
  for all to authenticated
  using (public.has_site_role(site_id, 'admin'))
  with check (public.has_site_role(site_id, 'admin'));

-- ---------------------------------------------------------------------------
-- posts
-- ---------------------------------------------------------------------------

-- The load-bearing public policy. A draft or future-dated post is unreachable
-- with the anon key even if its slug is guessed correctly.
create policy posts_public_read on public.posts
  for select to anon, authenticated
  using (
    status = 'published'
    and published_at is not null
    and published_at <= now()
  );

create policy posts_member_read_all on public.posts
  for select to authenticated
  using (public.has_site_role(site_id, 'author'));

-- Authors may create posts on their sites.
create policy posts_author_insert on public.posts
  for insert to authenticated
  with check (public.has_site_role(site_id, 'author'));

-- Authors may edit their own; editors and above may edit anyone's.
create policy posts_author_update_own on public.posts
  for update to authenticated
  using (
    public.has_site_role(site_id, 'editor')
    or (public.has_site_role(site_id, 'author') and author_id = auth.uid())
  )
  with check (
    public.has_site_role(site_id, 'editor')
    or (public.has_site_role(site_id, 'author') and author_id = auth.uid())
  );

create policy posts_editor_delete on public.posts
  for delete to authenticated
  using (public.has_site_role(site_id, 'editor'));

-- ---------------------------------------------------------------------------
-- terms
-- ---------------------------------------------------------------------------

create policy terms_public_read on public.terms
  for select to anon, authenticated
  using (true);

create policy terms_editor_write on public.terms
  for all to authenticated
  using (public.has_site_role(site_id, 'editor'))
  with check (public.has_site_role(site_id, 'editor'));

-- ---------------------------------------------------------------------------
-- post_terms
-- ---------------------------------------------------------------------------
-- Scoped through the post so an unpublished post's taxonomy does not leak.

create policy post_terms_public_read on public.post_terms
  for select to anon, authenticated
  using (public.post_is_public(post_id));

create policy post_terms_member_read on public.post_terms
  for select to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_terms.post_id
        and public.has_site_role(p.site_id, 'author')
    )
  );

create policy post_terms_author_write on public.post_terms
  for all to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_terms.post_id
        and public.has_site_role(p.site_id, 'author')
    )
  )
  with check (
    exists (
      select 1 from public.posts p
      where p.id = post_terms.post_id
        and public.has_site_role(p.site_id, 'author')
    )
  );

-- ---------------------------------------------------------------------------
-- media
-- ---------------------------------------------------------------------------
-- Public: the storage bucket is public anyway, so the metadata adds no exposure.

create policy media_public_read on public.media
  for select to anon, authenticated
  using (true);

create policy media_author_write on public.media
  for all to authenticated
  using (public.has_site_role(site_id, 'author'))
  with check (public.has_site_role(site_id, 'author'));

-- ---------------------------------------------------------------------------
-- redirects
-- ---------------------------------------------------------------------------
-- Read publicly because apps/blog reads them at build time to generate
-- next.config redirects with the anon key.

create policy redirects_public_read on public.redirects
  for select to anon, authenticated
  using (true);

create policy redirects_editor_write on public.redirects
  for all to authenticated
  using (public.has_site_role(site_id, 'editor'))
  with check (public.has_site_role(site_id, 'editor'));
