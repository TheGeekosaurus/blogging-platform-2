-- 0004_pages.sql — pages with arbitrary-depth nesting
--
-- Posts move under /blog/<slug>; pages own the root and nest WordPress-style:
-- /projects, /projects/solar, /projects/solar/phase-two.

create type page_template as enum ('prose', 'full');

create table public.pages (
  id              uuid primary key default gen_random_uuid(),
  site_id         uuid not null references public.sites(id) on delete cascade,

  -- One path segment. Nesting comes from parent_id, never from typing a path
  -- into the slug — which is what silently produced "blog-test-post".
  slug            text not null,
  parent_id       uuid references public.pages(id) on delete cascade,

  -- Materialised full path, e.g. 'projects/solar/phase-two'. Maintained by
  -- trigger below. Resolving the chain per request would be one query per level;
  -- this makes a page lookup a single indexed hit and generateStaticParams trivial.
  path            text not null,

  title           text not null,
  content_html    text not null default '',
  original_html   text,

  -- 'prose' renders inside the typographic container used for posts.
  -- 'full' renders bare, for landing pages that own their own layout.
  template        page_template not null default 'prose',

  status          post_status not null default 'draft',
  published_at    timestamptz,

  seo_title       text,
  seo_description text,
  canonical_url   text,
  noindex         boolean not null default false,

  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint pages_slug_valid check (slug <> '' and slug !~ '[\s/]'),
  constraint pages_published_needs_date check (
    status <> 'published' or published_at is not null
  ),
  constraint pages_no_self_parent check (parent_id is null or parent_id <> id),

  -- NULLS NOT DISTINCT is load-bearing: by default Postgres treats each NULL
  -- parent_id as unique, so two top-level pages could both claim '/about'.
  constraint pages_slug_per_parent unique nulls not distinct (site_id, parent_id, slug),
  constraint pages_path_unique unique (site_id, path)
);

create index pages_site_status_idx on public.pages (site_id, status);
create index pages_parent_idx on public.pages (parent_id);

create trigger pages_touch_updated_at
  before update on public.pages
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Path materialisation
-- ---------------------------------------------------------------------------

/*
 * Compute `path`, and reject cycles.
 *
 * Both live in one function so their order cannot drift: a cycle has to be
 * caught before any attempt to walk the chain, or the walk never terminates.
 */
create function public.pages_set_path()
returns trigger
language plpgsql
as $$
declare
  cursor_id   uuid;
  depth       int := 0;
  parent_path text;
begin
  -- Cycle and depth check first.
  cursor_id := new.parent_id;
  while cursor_id is not null loop
    if cursor_id = new.id then
      raise exception 'page hierarchy cycle: % cannot be its own ancestor', new.id;
    end if;
    depth := depth + 1;
    if depth > 50 then
      raise exception 'page hierarchy deeper than 50 levels; likely a cycle';
    end if;
    select parent_id into cursor_id from public.pages where id = cursor_id;
  end loop;

  if new.parent_id is null then
    new.path := new.slug;
  else
    select path into parent_path from public.pages where id = new.parent_id;
    if parent_path is null then
      raise exception 'parent page % does not exist', new.parent_id;
    end if;
    new.path := parent_path || '/' || new.slug;
  end if;

  return new;
end;
$$;

create trigger pages_set_path_before
  before insert or update of slug, parent_id on public.pages
  for each row execute function public.pages_set_path();

/*
 * Re-parenting or renaming a page has to move its whole subtree.
 *
 * Updating a child's `path` fires this same trigger on that child, so the
 * rewrite cascades down on its own. It terminates because a level only fires
 * when its path actually changed.
 */
create function public.pages_rewrite_descendants()
returns trigger
language plpgsql
as $$
begin
  if new.path is distinct from old.path then
    update public.pages
    set path = new.path || '/' || slug
    where parent_id = new.id;
  end if;
  return null;
end;
$$;

/*
 * Fires on ANY update, not `after update of path`.
 *
 * `UPDATE OF path` triggers on the columns named in the statement's SET clause,
 * not on whether the value changed. Re-parenting says `SET parent_id = ...` and
 * lets the BEFORE trigger recompute path — so `OF path` never fires and subtrees
 * silently kept their old paths. Caught by testing a re-parent against a real
 * database. The guard inside the function makes the unrestricted version cheap.
 */
create trigger pages_rewrite_descendants_after
  after update on public.pages
  for each row execute function public.pages_rewrite_descendants();

-- ---------------------------------------------------------------------------
-- Homepage
-- ---------------------------------------------------------------------------
-- Null means '/' falls back to the post index, so the site keeps working before
-- a homepage exists.

alter table public.sites
  add column homepage_page_id uuid references public.pages(id) on delete set null;

-- ---------------------------------------------------------------------------
-- Privileges and RLS — mirrors posts exactly
-- ---------------------------------------------------------------------------

alter table public.pages enable row level security;

grant select on public.pages to anon;
grant select, insert, update, delete on public.pages to authenticated;

create policy pages_public_read on public.pages
  for select to anon, authenticated
  using (
    status = 'published'
    and published_at is not null
    and published_at <= now()
  );

create policy pages_member_read_all on public.pages
  for select to authenticated
  using (public.has_site_role(site_id, 'author'));

create policy pages_editor_write on public.pages
  for all to authenticated
  using (public.has_site_role(site_id, 'editor'))
  with check (public.has_site_role(site_id, 'editor'));
