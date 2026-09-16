-- 0012_gtm_container.sql — one GTM container per site, set from the admin
--
-- Replaces `analytics_id` with a column the public site actually reads.
--
-- WHAT WAS BROKEN. Tracking existed in exactly one place: a GTM snippet in
-- apps/blog/components/marketing/analytics.tsx, fed by NEXT_PUBLIC_GTM_ID and
-- mounted by the root layout only when the deployment's slug was
-- `nntm-capital`. So Nanotom Labs and every database-driven blog had no
-- tracking at all, and — worse — setting NEXT_PUBLIC_GTM_ID on those projects
-- did nothing, because the component behind the gate was never rendered. The
-- variable was read and discarded, which is the kind of failure that looks like
-- a broken container rather than a missing feature.
--
-- Meanwhile `analytics_id` had existed since 0001, was offered in the admin's
-- Settings form, was saved on every submit, and was read by nothing anywhere in
-- the codebase. Filling it in produced no tracking and no error. That is the
-- same "stored column with no consumer" mistake 0009 removed from `media`, and
-- it is removed here for the same reason: to the next person it reads as a
-- broken feature rather than an absent one.
--
-- WHY A NEW COLUMN RATHER THAN REUSING THE OLD ONE. `analytics_id` did not say
-- what kind of id it held — GA4 measurement id, UA property, GTM container,
-- Plausible domain — so nothing could validate it and nobody could tell what to
-- type. The whole decision here is that there is one tracking mechanism and it
-- is GTM; a column named for that is self-documenting, and the check constraint
-- below is only expressible once the format is known.
--
-- NO DATA MIGRATION. Nothing ever read `analytics_id`, so whatever it holds was
-- never tracking anything and cannot be trusted to be a container id. Copying it
-- across would silently activate an unvalidated string on a live site. Both
-- container ids are set by hand after this runs — see docs/DEPLOYMENT.md.
--
-- PUBLIC BY NATURE. Every column on `sites` is readable by anonymous visitors
-- (0002_rls.sql), which is correct here: a GTM container id ships in the HTML of
-- every page that loads it. It is an identifier, not a credential.

alter table public.sites drop column analytics_id;

alter table public.sites add column gtm_container_id text;

-- The format check is a security control, not tidiness.
--
-- This value is interpolated into an inline <script> on the public site, so a
-- string containing a quote or a brace would break out of the snippet and
-- execute as page JavaScript — on every route, on a site whose whole job is to
-- take enquiries. The admin validates before writing and the renderer validates
-- before emitting, but neither helps a value written straight through SQL or
-- from a future importer, and this is the one place all three paths meet.
--
-- Deliberately narrow: GTM ids are `GTM-` plus uppercase alphanumerics, and the
-- character set that leaves is one no escaping question can arise from.
alter table public.sites
  add constraint sites_gtm_container_format
  check (gtm_container_id ~ '^GTM-[A-Z0-9]+$');

comment on column public.sites.gtm_container_id is
  'Google Tag Manager container, e.g. GTM-XXXXXXX. Null means no tracking on this site. Set in the admin under Settings; add every other tag (GA4, the Facebook pixel, conversion tags) INSIDE this container rather than as more hardcoded scripts.';
