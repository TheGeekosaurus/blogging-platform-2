-- 0014_seo_priority.sql — what to build next
--
-- 0013 gave the Roadmap a pipeline but no ordering within it, so a topic with
-- nineteen briefed pages read as a sitemap: everything that has been agreed to,
-- in the order it happened to be entered. This adds the one column that turns
-- that list into a queue.
--
-- WHY AN ENUM, NOT A SCORE. A numeric column invites a formula, and the inputs a
-- formula would want are not here yet: Search Console position and impressions
-- need a `seo_metrics` table that does not exist, and the internal-demand signal
-- (how many links already point at a page nobody has written) cannot be joined
-- to these rows at all — see the note at the bottom. A score computed from two
-- of the five things that matter looks authoritative and is not, which is worse
-- than three labels somebody chose on purpose. When there are real inputs, a
-- score belongs beside this column rather than inside it: the two answer
-- different questions, and an editor overriding a model is a feature.
--
-- Three values rather than five, for the same reason `seo_page_role` has two:
-- the distinction has to mean something to the person reading the screen, and a
-- five-point scale collapses to "high, and everything else" within a month.

-- Declaration order IS sort order in Postgres, so `order by priority` puts the
-- work first without a CASE. A value can be spliced in later with
-- `alter type ... add value 'urgent' before 'high'` if three stops being enough.
create type seo_page_priority as ('high', 'medium', 'low');

/*
 * Nullable, with NO default.
 *
 * `null` means nobody has said, and that is a different fact from "medium" —
 * defaulting would have stamped an opinion onto all 83 of Nanotom Capital's
 * existing rows that no one actually holds. It also makes the screen honest:
 * unprioritised pages sort to the bottom of their topic and show no chip, so
 * the queue is visibly the part someone has ranked. Same reasoning as
 * `seo_keywords.intent`, which is nullable because unknown is a real state.
 */
alter table public.seo_pages
  add column priority seo_page_priority;

comment on column public.seo_pages.priority is
  'Build order within a topic on the Roadmap. Null means unranked, which sorts last — it is not a synonym for low.';

-- ---------------------------------------------------------------------------
-- NO INDEX, DELIBERATELY
-- ---------------------------------------------------------------------------
-- The obvious move is `(site_id, status, priority)` and it would not be used.
-- `loadSeoTree` selects every row for one site and does the status filter and
-- the ordering in memory, because the roll-ups have to sum every keyword to be
-- true and so nothing can be filtered away in SQL. That read is a few hundred
-- rows behind an existing `site_id` index; sorting them is microseconds, and an
-- index nothing consults still costs every write.
--
-- 0013 declined to add SERP and competitor tables on the grounds that they would
-- be speculative schema, and an index for a query that has not been written yet
-- is the same bet. Add it with the query that needs it.
--
-- ---------------------------------------------------------------------------
-- WHY THIS IS NOT AUTO-POPULATED
-- ---------------------------------------------------------------------------
-- Internal demand is already derivable: `buildLinkGraph` (packages/core/links.ts)
-- resolves every internal href in every body and returns the ones that land on
-- nothing, so "fourteen published posts link at /sba-504-rates and it does not
-- exist" is a fact this codebase can state today, and it is the best single
-- argument for writing a page.
--
-- It cannot reach these rows. `seo_pages` records a title, a head term and a
-- post once written; it has no slug, path or intended URL, so there is no key to
-- join a broken link's path to the planned page meant to answer it. Matching on
-- title or primary_keyword would be a guess dressed as evidence.
--
-- Closing that gap means a target-path column on seo_pages and a decision about
-- what happens when the eventual post is published at a different path. That is
-- a change worth making and it is not this one, so priority is set by hand for
-- now and the screen makes it clear that nobody has set most of it.
