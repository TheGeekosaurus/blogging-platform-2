-- 0013_seo.sql — keyword research and the content roadmap
--
-- Two screens read these three tables, and the split between them is the whole
-- design:
--
--   Keywords  every keyword we know about, grouped by the page we intend it to
--             land on. Research. Nothing here has been committed to.
--   Roadmap   the same tree, filtered to pages that have been briefed. Work.
--
-- So a page moves from one screen to the other by being briefed, and both
-- screens are views over one hierarchy rather than two parallel lists that can
-- disagree about what exists.
--
--   seo_topics    the grouping. "SBA loans", "Equipment financing"
--   seo_pages     one row per page we intend to build, pillar or sub
--   seo_keywords  one row per keyword, pointing at the page that should own it
--
-- WHY A SEPARATE HIERARCHY FROM posts/terms. A term is a taxonomy a reader
-- browses; a topic is a research grouping that mostly does not survive contact
-- with the site's navigation. More to the point, most rows here describe pages
-- that do not exist yet, and `posts` is a table of things that do. Modelling
-- intent inside the published-content tables would mean every public query
-- grows a filter to exclude the hypothetical.
--
-- WHAT IS DELIBERATELY NOT HERE. No SERP snapshots, no competitor tables, no
-- run log. Those belong to the agent work tracked in brain's
-- projects/seo-dashboard.md and would be speculative schema today. These three
-- tables hold what is already produced by hand.

-- ---------------------------------------------------------------------------
-- seo_topics
-- ---------------------------------------------------------------------------

create table public.seo_topics (
  id          uuid primary key default gen_random_uuid(),
  site_id     uuid not null references public.sites(id) on delete cascade,

  name        text not null,

  /*
   * Free text, not a foreign key to a broader "pillar" table.
   *
   * A third level exists in some keyword sets and not others, and the ones that
   * have it rename it constantly while the research is live. A nullable label
   * groups the topic list when it is set and disappears when it is not, which
   * is what a grouping that may not survive the month is worth.
   */
  pillar      text,

  -- Manual ordering on the Keywords screen. Ties break on name.
  position    integer not null default 0,

  notes       text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint seo_topics_name_present check (name <> '')
);

-- Case-insensitive, because "SBA loans" and "SBA Loans" are one topic and
-- finding out otherwise means two half-populated trees.
create unique index seo_topics_name_per_site_unique
  on public.seo_topics (site_id, lower(name));

create index seo_topics_site_idx on public.seo_topics (site_id, position, name);

create trigger seo_topics_touch_updated_at
  before update on public.seo_topics
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- seo_pages
-- ---------------------------------------------------------------------------

-- Pillar or sub, per the cluster model in brain's topic-cluster-templates.md.
-- Two values rather than a free-text label: the distinction drives layout on
-- both screens, and a third value would have to mean something to the renderer.
create type seo_page_role as enum ('pillar', 'sub');

/*
 * Where a page is in the pipeline.
 *
 * `researched` is the default and means the Roadmap does not show it yet. The
 * promotion moment is `briefed` — that is the point at which a keyword cluster
 * stops being research and becomes work someone has committed to.
 *
 * NOT enforced against the `brief` column by a check constraint. A brief
 * written in a doc, or agreed verbally and typed straight into a draft, is
 * still a brief; a constraint would make the status lie rather than make the
 * process better.
 */
create type seo_page_status as enum ('researched', 'briefed', 'drafted', 'published');

create table public.seo_pages (
  id              uuid primary key default gen_random_uuid(),
  site_id         uuid not null references public.sites(id) on delete cascade,

  /*
   * `on delete set null`, not cascade. Deleting a topic is a reorganisation of
   * the research, and it must not silently delete briefed pages — those are
   * work. An unparented page surfaces under "No topic" on both screens, which
   * is visible and fixable. A cascade is neither.
   */
  topic_id        uuid references public.seo_topics(id) on delete set null,

  role            seo_page_role not null default 'sub',
  status          seo_page_status not null default 'researched',

  -- The working title. Becomes the post's title when it is written, but stays
  -- editable here afterwards so the roadmap can be read without loading posts.
  title           text not null,

  /*
   * Denormalised from seo_keywords where is_primary, and nullable.
   *
   * The duplication is deliberate: the roadmap lists hundreds of rows and each
   * needs its head term, and resolving that through a join to a filtered
   * keyword row on every render is a lot of work to avoid one column. The
   * keyword row remains the place volume and difficulty live.
   */
  primary_keyword text,

  brief           text,
  outline         text,
  meta_title      text,
  meta_description text,

  /*
   * The post this page became, once it exists.
   *
   * `on delete set null` so unpublishing an article returns its roadmap row to
   * the queue rather than erasing the plan that produced it.
   */
  post_id         uuid references public.posts(id) on delete set null,

  -- Build order within the topic on the Roadmap screen.
  position        integer not null default 0,

  notes           text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint seo_pages_title_present check (title <> '')
);

/*
 * At most one pillar per topic.
 *
 * Partial unique index rather than a constraint, because nulls are distinct in
 * a unique index and a page with no topic must still be allowed to be a pillar.
 * This is the rule Semrush's own Keyword Strategy Builder gets wrong — it
 * labelled a 270-volume page the pillar of a 42,360-volume topic — so it is
 * worth having the database refuse the second one.
 */
create unique index seo_pages_one_pillar_per_topic
  on public.seo_pages (topic_id)
  where role = 'pillar' and topic_id is not null;

create index seo_pages_site_idx on public.seo_pages (site_id, position);
create index seo_pages_topic_idx on public.seo_pages (topic_id);
create index seo_pages_post_idx on public.seo_pages (post_id);
create index seo_pages_status_idx on public.seo_pages (site_id, status);

create trigger seo_pages_touch_updated_at
  before update on public.seo_pages
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- seo_keywords
-- ---------------------------------------------------------------------------

/*
 * One dominant intent, not an array.
 *
 * Third-party tools emit "Informational, Transactional" for a single term, and
 * Google's own quality rater guidelines describe Dominant / Common / Minor
 * interpretations rather than one label. Both are true, and neither changes
 * what this column is for: deciding which page a keyword belongs on, which is
 * a single decision. Where a term genuinely splits, that is two pages, and the
 * split should be visible as two rows rather than hidden in an array.
 */
create type seo_keyword_intent as enum (
  'informational', 'commercial', 'transactional', 'navigational'
);

create table public.seo_keywords (
  id            uuid primary key default gen_random_uuid(),
  site_id       uuid not null references public.sites(id) on delete cascade,

  /*
   * Nullable. A keyword with no page is research that has not been clustered
   * yet, and that is a real and common state — it is the pile the Keywords
   * screen exists to work through. Cascading to null on page delete keeps the
   * keywords when a planned page is abandoned, which is the whole value of
   * having done the research.
   */
  page_id       uuid references public.seo_pages(id) on delete set null,

  keyword       text not null,

  volume        integer,
  kd            integer,
  cpc           numeric(10, 2),
  intent        seo_keyword_intent,

  /*
   * The head term for its page. Enforced one-per-page by a partial unique index
   * below, and mirrored onto seo_pages.primary_keyword for list rendering.
   */
  is_primary    boolean not null default false,

  /*
   * Where the numbers came from. Kept because they are not comparable across
   * providers — difficulty in particular is a vendor score on a vendor scale,
   * not a measurement — and a column of mixed-provenance KD read as one series
   * is worse than no column.
   */
  source        text,
  metrics_updated_at timestamptz,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint seo_keywords_keyword_present check (keyword <> ''),
  constraint seo_keywords_volume_sane check (volume is null or volume >= 0),
  constraint seo_keywords_kd_range check (kd is null or (kd >= 0 and kd <= 100))
);

/*
 * A keyword belongs to at most one page, per site.
 *
 * This is the cannibalisation gate from brain's seo-keyword-map skill,
 * expressed as an index. Two pages targeting one term is the defect that gate
 * exists to catch, and catching it at insert is cheaper than catching it in
 * Search Console six weeks later.
 */
create unique index seo_keywords_unique_per_site
  on public.seo_keywords (site_id, lower(keyword));

create unique index seo_keywords_one_primary_per_page
  on public.seo_keywords (page_id)
  where is_primary and page_id is not null;

create index seo_keywords_page_idx on public.seo_keywords (page_id);
-- The Keywords screen's default sort, and the "what is worth doing next" read.
create index seo_keywords_site_volume_idx
  on public.seo_keywords (site_id, volume desc nulls last);

create trigger seo_keywords_touch_updated_at
  before update on public.seo_keywords
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Privileges and RLS
-- ---------------------------------------------------------------------------
-- 0002 revokes everything from anon and authenticated across the schema and
-- re-grants explicitly, so a new table with a good policy and no grant returns
-- a permission error rather than an empty set.
--
-- NOTHING here is granted to anon. Unlike posts or lead magnets, none of this
-- is rendered by the public site: it is an unpublished plan naming the terms a
-- site intends to compete for. The anon key is readable by anyone who views
-- source on the blog, and for client work this is confidential to that client.

alter table public.seo_topics   enable row level security;
alter table public.seo_pages    enable row level security;
alter table public.seo_keywords enable row level security;

grant select, insert, update, delete
  on public.seo_topics, public.seo_pages, public.seo_keywords to authenticated;

-- `editor`, matching lead_magnets: this is content planning, which is the same
-- job as writing the content. It is not site configuration, so not `admin`.
create policy seo_topics_editor_all on public.seo_topics
  for all to authenticated
  using (public.has_site_role(site_id, 'editor'))
  with check (public.has_site_role(site_id, 'editor'));

create policy seo_pages_editor_all on public.seo_pages
  for all to authenticated
  using (public.has_site_role(site_id, 'editor'))
  with check (public.has_site_role(site_id, 'editor'));

create policy seo_keywords_editor_all on public.seo_keywords
  for all to authenticated
  using (public.has_site_role(site_id, 'editor'))
  with check (public.has_site_role(site_id, 'editor'));
