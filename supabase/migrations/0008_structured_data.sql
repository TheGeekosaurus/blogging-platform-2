-- 0008_structured_data.sql — author-editable schema.org markup
--
-- An ordered list of JSON-LD nodes per post, per page, and per site. The site
-- list is emitted on every public route (Organization, WebSite); the post and
-- page lists are emitted on that record only, alongside the BlogPosting and
-- BreadcrumbList the blog still generates automatically.
--
-- Stored as jsonb rather than a child table, following `authors.social`
-- (0006_authors.sql:61-73): a shape whose contents change is a shape that
-- should not need a migration to change.
--
-- The child-table alternative was considered and is worse HERE specifically.
-- `posts` and `pages` are unrelated tables with no polymorphic parent anywhere
-- in this schema, so it would mean two tables, two sets of policies, two GRANT
-- blocks, two PostgREST embeds and two delete-then-insert writers — all to
-- store a list nothing ever queries BY. Nothing filters, sorts or joins on a
-- snippet: every read wants the whole list for one record, which is exactly
-- what a jsonb column hands back for free.
--
-- These columns therefore need no index, no trigger, and no grants of their
-- own: a column inherits the table-level grants and RLS policies 0002, 0004
-- and 0001 already gave these three tables.
--
-- The check constraint guards the CONTAINER only — that it is an array, so a
-- reader can iterate it without a type test. What is IN the array is validated
-- in TypeScript (parseSnippet, in packages/core/src/structured-data.ts), for
-- the same reason authors.social validates URLs in the server action rather
-- than in SQL: schema.org has hundreds of types and no fixed shape, and a
-- constraint that cannot express the rule is a constraint that fails real
-- content instead of bad content.
--
-- Default '[]' rather than null, so every reader gets an array and no caller
-- needs a null branch.

alter table public.posts
  add column structured_data jsonb not null default '[]'::jsonb;

alter table public.pages
  add column structured_data jsonb not null default '[]'::jsonb;

alter table public.sites
  add column structured_data jsonb not null default '[]'::jsonb;

alter table public.posts
  add constraint posts_structured_data_is_array
  check (jsonb_typeof(structured_data) = 'array');

alter table public.pages
  add constraint pages_structured_data_is_array
  check (jsonb_typeof(structured_data) = 'array');

alter table public.sites
  add constraint sites_structured_data_is_array
  check (jsonb_typeof(structured_data) = 'array');
