-- 0006_authors.sql — public author records for post bylines
--
-- Until now a byline was `posts.author_name`, a free-text field typed per post.
-- That is fine for an imported archive and useless for anything else: no photo,
-- no bio, no links, and a typo makes a second author.
--
-- Why a new table rather than the two author-ish things already in the schema:
--
--   posts.author_id  already exists and is NOT a byline. It references
--                    profiles(id) — auth users — and it is load-bearing in RLS:
--
--                      or (public.has_site_role(site_id, 'author')
--                          and author_id = auth.uid())
--
--                    Repurposing it would silently change who may edit which
--                    posts, which is not a change anyone would notice until it
--                    mattered.
--
--   profiles         has display_name, avatar_url and bio, so it looks like the
--                    right home. It is not: 0001 revokes it from anon entirely
--                    because it holds email addresses, and an imported post has
--                    no auth user to point at. A public byline cannot live in a
--                    table the public cannot read.
--
-- So: a table of public author records, and a second FK on posts named
-- `byline_id` — because `author_id` is taken and two columns a letter apart
-- meaning different things is how the wrong one gets used.
--
-- `posts.author_name` STAYS. The WordPress importer keeps writing it, and a
-- resolver in packages/core prefers the record where one is attached and falls
-- back to the text where it is not. That is what lets 200 imported posts keep
-- their bylines while only the handful of real authors get records.

-- ---------------------------------------------------------------------------
-- authors
-- ---------------------------------------------------------------------------

create table public.authors (
  id         uuid primary key default gen_random_uuid(),
  site_id    uuid not null references public.sites(id) on delete cascade,

  -- No author archive routes exist yet. The slug is here because every future
  -- one needs it and adding a column later means backfilling it for every row
  -- from a name that may by then have been edited.
  slug       text not null,
  name       text not null,

  /*
   * Short role line shown under the name on a post: "Founder, Nanotom Capital".
   *
   * Deliberately separate from `bio`. A bio is a paragraph for the author box;
   * a role is a few words that sit on one line under a byline. Making one field
   * do both means writing the bio to work as a role line, and it reads badly
   * either way.
   */
  title      text,
  bio        text,

  /*
   * The avatar hangs off authors, not off posts, and that placement is
   * load-bearing rather than tidiness.
   *
   * The public post query embeds its image as `featured_image:media(...)`,
   * which PostgREST can only resolve because featured_image_id is the SINGLE
   * foreign key from posts to media. A second posts → media FK would make that
   * embed ambiguous and break every existing post query until each one named
   * its constraint explicitly. Routing through authors leaves it alone.
   */
  avatar_id  uuid references public.media(id) on delete set null,

  /*
   * Social links as jsonb, matching sites.social rather than inventing a
   * different shape for the same kind of data. The five platforms are named
   * once in TypeScript (SOCIAL_PLATFORMS in packages/core), which drives the
   * admin form and validation — so a sixth platform is a one-line change and
   * not a migration.
   *
   * URLs are validated in the server action, not here. A check constraint over
   * jsonb values would be both awkward and the wrong place: the same reasoning
   * as posts_slug_valid, which is deliberately permissive so real content
   * cannot fail an import.
   */
  social     jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint authors_slug_per_site_unique unique (site_id, slug),
  -- Permissive for the same reason as posts_slug_valid: rule out only what
  -- would actually break a URL.
  constraint authors_slug_valid check (slug <> '' and slug !~ '[\s/]'),
  constraint authors_name_present check (name <> ''),
  constraint authors_social_is_object check (jsonb_typeof(social) = 'object')
);

create index authors_site_idx on public.authors (site_id);

create trigger authors_touch_updated_at
  before update on public.authors
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- posts.byline_id
-- ---------------------------------------------------------------------------
-- `on delete set null`, not cascade: deleting an author must not delete their
-- posts. Those posts fall back to author_name, so a delete costs the photo and
-- the links, never the writing.

alter table public.posts
  add column byline_id uuid references public.authors(id) on delete set null;

-- Answers "how many posts would this delete affect", which the admin shows next
-- to each author for the same reason the taxonomy screen shows a post count:
-- there is no confirmation dialog anywhere in that app, and a number you can
-- see beforehand does the same job better.
create index posts_byline_idx on public.posts (byline_id);

-- ---------------------------------------------------------------------------
-- Privileges and RLS — mirrors terms
-- ---------------------------------------------------------------------------
-- The GRANT is not optional decoration. 0002 revokes all privileges from anon
-- and authenticated on every table in the schema and re-grants explicitly, so a
-- new table with a perfectly good policy and no grant returns a permission
-- error rather than an empty set.

alter table public.authors enable row level security;

grant select on public.authors to anon;
grant select, insert, update, delete on public.authors to authenticated;

-- Flatly public, like terms and media: this table holds only what a byline
-- shows anyway. Nothing here is gated on a post being published — an author
-- referenced solely by a draft is visible, exactly as that draft's category and
-- featured-image metadata already are.
create policy authors_public_read on public.authors
  for select to anon, authenticated
  using (true);

-- `editor`, not `author`. Authors are site-level configuration, like the
-- taxonomy — someone who may write a post should not be able to rewrite the
-- byline records every other post on the site points at.
create policy authors_editor_write on public.authors
  for all to authenticated
  using (public.has_site_role(site_id, 'editor'))
  with check (public.has_site_role(site_id, 'editor'));
