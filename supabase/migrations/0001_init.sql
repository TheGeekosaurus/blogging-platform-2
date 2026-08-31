-- 0001_init.sql — core schema
--
-- Target: Supabase Postgres (references auth.users, which only exists there).
-- Apply with the Supabase SQL editor or `supabase db push`.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type post_status as enum ('draft', 'scheduled', 'published', 'archived');
create type member_role as enum ('owner', 'admin', 'editor', 'author');
create type term_kind as enum ('category', 'tag');

-- Explicit ranking. Enum declaration order would work, but it reads backwards
-- ("owner <= editor" meaning "owner outranks editor") and invites mistakes in
-- policy predicates. An integer rank keeps the comparisons obvious.
create function public.role_rank(r member_role)
returns int
language sql
immutable
parallel safe
as $$
  select case r
    when 'owner'  then 4
    when 'admin'  then 3
    when 'editor' then 2
    when 'author' then 1
  end;
$$;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- sites
-- ---------------------------------------------------------------------------
-- Contains NOTHING sensitive: every column here is readable by anonymous
-- visitors (see 0002_rls.sql). Per-site secrets live in site_secrets.

create table public.sites (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  name              text not null,
  description       text,
  -- Public origin, no trailing slash. Used for canonical URLs, sitemap, RSS.
  base_url          text not null,
  locale            text not null default 'en',
  logo_url          text,
  favicon_url       text,
  social            jsonb not null default '{}'::jsonb,
  analytics_id      text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint sites_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint sites_base_url_format check (base_url ~ '^https?://[^/]+$')
);

create trigger sites_touch_updated_at
  before update on public.sites
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- site_secrets
-- ---------------------------------------------------------------------------
-- Split out from `sites` deliberately. RLS is row-level, not column-level, so a
-- blanket public-read policy on `sites` would hand the revalidation secret to
-- anyone holding the anon key. Keeping secrets in a separate table with no anon
-- policy makes that impossible rather than merely unlikely.

create table public.site_secrets (
  site_id            uuid primary key references public.sites(id) on delete cascade,
  revalidate_secret  text not null default encode(gen_random_bytes(32), 'hex'),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger site_secrets_touch_updated_at
  before update on public.site_secrets
  for each row execute function public.touch_updated_at();

-- Every site gets a secret automatically.
create function public.create_site_secret()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.site_secrets (site_id) values (new.id);
  return new;
end;
$$;

create trigger sites_create_secret
  after insert on public.sites
  for each row execute function public.create_site_secret();

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
-- Never exposed to anonymous readers (it holds email addresses). Public
-- bylines are denormalised onto posts.author_name instead, which also gives
-- imported WordPress posts a byline without inventing an auth user for them.

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  display_name  text,
  avatar_url    text,
  bio           text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- site_members — per-site authorization
-- ---------------------------------------------------------------------------

create table public.site_members (
  site_id     uuid not null references public.sites(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        member_role not null default 'author',
  created_at  timestamptz not null default now(),
  primary key (site_id, user_id)
);

create index site_members_user_idx on public.site_members (user_id);

-- ---------------------------------------------------------------------------
-- media
-- ---------------------------------------------------------------------------
-- Declared before posts because posts.featured_image_id references it.
-- width/height/blur_data_url are stored at upload time so the renderer can
-- always reserve space and avoid layout shift.

create table public.media (
  id             uuid primary key default gen_random_uuid(),
  site_id        uuid not null references public.sites(id) on delete cascade,
  storage_path   text not null,
  alt            text,
  caption        text,
  width          int,
  height         int,
  blur_data_url  text,
  mime_type      text,
  bytes          bigint,
  -- Original WordPress URL, when this row came from an import.
  source_url     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint media_storage_path_unique unique (site_id, storage_path),
  constraint media_dimensions_positive check (
    (width is null or width > 0) and (height is null or height > 0)
  )
);

create trigger media_touch_updated_at
  before update on public.media
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- posts
-- ---------------------------------------------------------------------------

create table public.posts (
  id                 uuid primary key default gen_random_uuid(),
  site_id            uuid not null references public.sites(id) on delete cascade,

  -- Slug is preserved verbatim from WordPress on import. This is the
  -- SEO-critical field: changing it breaks inbound links and rankings.
  slug               text not null,
  title              text not null,
  excerpt            text,

  -- Canonical, render-ready, already-sanitised HTML. The public app echoes
  -- this straight out; it never sanitises at read time.
  content_html       text not null default '',
  -- Untouched source HTML from the WordPress import, kept so content can be
  -- re-derived if the sanitiser allowlist or transforms change.
  original_html      text,

  status             post_status not null default 'draft',
  published_at       timestamptz,

  -- author_id is null for imported posts (no auth user exists for them).
  author_id          uuid references public.profiles(id) on delete set null,
  -- Public byline. Always populated; the only author field anon readers see.
  author_name        text,

  featured_image_id  uuid references public.media(id) on delete set null,
  reading_minutes    int,

  -- SEO overrides; all optional, sensible defaults derived at render time.
  seo_title          text,
  seo_description    text,
  canonical_url      text,
  noindex            boolean not null default false,

  -- WordPress post ID, for idempotent re-imports.
  wp_post_id         bigint,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint posts_slug_per_site_unique unique (site_id, slug),
  -- Deliberately permissive. WordPress slugs are lowercased by sanitize_title()
  -- but may legitimately contain percent-encoded UTF-8 (Cyrillic, CJK, accented
  -- titles) and underscores. A tighter pattern would reject real content and
  -- fail the import, so this only rules out what would actually break routing:
  -- empty slugs, whitespace, and path separators.
  constraint posts_slug_valid check (slug <> '' and slug !~ '[\s/]'),
  -- A published post must have a publish time; the public read policy and the
  -- archive ordering both depend on it.
  constraint posts_published_needs_date check (
    status <> 'published' or published_at is not null
  ),
  constraint posts_scheduled_needs_date check (
    status <> 'scheduled' or published_at is not null
  )
);

-- Only one WordPress post ID per site, but many posts may have none.
create unique index posts_wp_post_id_unique
  on public.posts (site_id, wp_post_id)
  where wp_post_id is not null;

-- Drives the index page, archives and feeds.
create index posts_site_status_published_idx
  on public.posts (site_id, status, published_at desc);

-- Admin search (phase 4). Immutable expression, so it is index-safe.
create index posts_search_idx on public.posts using gin (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, ''))
);

create trigger posts_touch_updated_at
  before update on public.posts
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- terms — categories and tags in one table
-- ---------------------------------------------------------------------------

create table public.terms (
  id           uuid primary key default gen_random_uuid(),
  site_id      uuid not null references public.sites(id) on delete cascade,
  kind         term_kind not null,
  slug         text not null,
  name         text not null,
  description  text,
  -- Categories may nest; tags never do (enforced below).
  parent_id    uuid references public.terms(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint terms_slug_per_site_kind_unique unique (site_id, kind, slug),
  -- Permissive for the same reason as posts.slug_valid above.
  constraint terms_slug_valid check (slug <> '' and slug !~ '[\s/]'),
  constraint terms_no_self_parent check (parent_id is null or parent_id <> id)
);

create index terms_site_kind_idx on public.terms (site_id, kind);
create index terms_parent_idx on public.terms (parent_id);

create trigger terms_touch_updated_at
  before update on public.terms
  for each row execute function public.touch_updated_at();

-- Tags must stay flat.
create function public.enforce_tag_has_no_parent()
returns trigger
language plpgsql
as $$
begin
  if new.kind = 'tag' and new.parent_id is not null then
    raise exception 'tags cannot be nested (term %)', new.id;
  end if;
  return new;
end;
$$;

create trigger terms_tag_flat
  before insert or update on public.terms
  for each row execute function public.enforce_tag_has_no_parent();

-- ---------------------------------------------------------------------------
-- post_terms
-- ---------------------------------------------------------------------------

create table public.post_terms (
  post_id  uuid not null references public.posts(id) on delete cascade,
  term_id  uuid not null references public.terms(id) on delete cascade,
  primary key (post_id, term_id)
);

create index post_terms_term_idx on public.post_terms (term_id);

-- ---------------------------------------------------------------------------
-- redirects — old WordPress URLs that changed shape
-- ---------------------------------------------------------------------------

create table public.redirects (
  id           uuid primary key default gen_random_uuid(),
  site_id      uuid not null references public.sites(id) on delete cascade,
  from_path    text not null,
  to_path      text not null,
  status_code  int not null default 301,
  created_at   timestamptz not null default now(),

  constraint redirects_from_per_site_unique unique (site_id, from_path),
  constraint redirects_from_is_path check (from_path ~ '^/'),
  constraint redirects_status_code_valid check (status_code in (301, 302, 307, 308)),
  constraint redirects_not_circular check (from_path <> to_path)
);
