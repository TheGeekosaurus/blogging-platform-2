-- 0016_cta_blocks.sql — in-content CTAs
--
-- WHAT THIS TABLE IS NOW. `lead_magnets` holds every call-to-action block on
-- the site, of which an email capture card is one KIND. A block can instead
-- point at a page, a calculator or any URL, and it can be dropped into the body
-- of a post rather than only appearing in the aside.
--
-- WHY THE TABLE IS NOT RENAMED. `cta_blocks` would read better, and the cost of
-- getting there is not cosmetic: `capture_lead` is a security-definer function
-- — the only write the anon key can perform anywhere in this schema — and it
-- takes `p_magnet_slug` and reads this table by name. `leads.magnet_slug` is
-- deliberately the key that OUTLIVES a deleted magnet, so renaming it rewrites
-- historical rows whose whole purpose is to still make sense after the thing
-- they point at is gone. Renaming for readability would put churn through
-- security code and an audit trail. The name is wrong; this comment is the fix.
--
-- Nothing here changes how an EXISTING row behaves: `kind` defaults to 'email'
-- and `layout` to 'banner', so every magnet already in the table keeps being an
-- email capture card and renders as it did.

-- ---------------------------------------------------------------------------
-- What a block DOES
-- ---------------------------------------------------------------------------

/*
 * Two kinds, not four.
 *
 * "Link to a page", "link to a calculator" and "link to an external site" are
 * the same row with a different href — the distinction lives in the URL, not in
 * the schema, and encoding it here would mean a renderer that has to care. A
 * third kind only earns its place when it changes what the block DOES, which is
 * why 'email' is separate: it owns a form, a success state and a `leads` write.
 */
create type cta_kind as enum ('email', 'link');

/*
 * The four shapes, from the references Denis supplied. Deliberately a closed
 * set: the point of presets is that a block cannot come out off-brand, and a
 * fifth layout is a design decision rather than a configuration one.
 *
 *   banner     a card, heading and copy left, button right, fine print beneath
 *   split      two columns, the right one a dark panel for an image or a stat
 *   billboard  a tinted band, centred, the button as the whole point
 *   strip      a dark compact bar, heading left, button right
 */
create type cta_layout as enum ('banner', 'split', 'billboard', 'strip');

/*
 * Background treatment, named by ROLE rather than by colour.
 *
 * 'tint' and 'dark' rather than 'mint' and 'green', because this platform runs
 * several sites and the blog already flips its whole palette under
 * html[data-theme] through `.blog-surface`. A block that stored #7FD4B4 would
 * be that colour on a site whose brand is navy, and in dark mode.
 */
create type cta_theme as enum ('surface', 'tint', 'dark', 'pattern');

alter table public.lead_magnets
  add column kind cta_kind not null default 'email',
  add column layout cta_layout not null default 'banner',
  add column theme cta_theme not null default 'surface',
  -- The gradient edge in the references. A boolean and not a colour: it is
  -- drawn from the site's own accent.
  add column accent_border boolean not null default false,
  -- The small label above the heading. Null means none.
  add column eyebrow text,
  -- Where a 'link' block goes. See the constraints below.
  add column href text;

/*
 * The two constraints that make `kind` mean something.
 *
 * Without the first, a link block with no destination is a button that does
 * nothing — and it would render, because nothing else in the stack has a reason
 * to check. Without the second, an email block could carry a stale href from
 * when it was a link block, which is the kind of leftover that eventually gets
 * read by something.
 */
alter table public.lead_magnets
  add constraint lead_magnets_link_has_href
    check (kind <> 'link' or href is not null),
  add constraint lead_magnets_email_has_no_href
    check (kind <> 'email' or href is null);

/*
 * A site-relative path or an absolute http(s) URL, matching `normaliseLinkHref`
 * in packages/core/src/sanitize.ts — which the admin validates with, so a
 * destination this would reject is refused while it is being typed rather than
 * at save. Same bargain as `lead_magnets_asset_url_http` above it.
 */
alter table public.lead_magnets
  add constraint lead_magnets_href_shape
    check (href is null or href ~ '^/' or href ~* '^https?://');

comment on column public.lead_magnets.kind is
  'What the block does: capture an email, or link somewhere. Email is the original lead magnet.';
comment on column public.lead_magnets.href is
  'Destination for kind=''link''. A site-relative path or an http(s) URL.';

-- ---------------------------------------------------------------------------
-- NO new index, and no RLS change
-- ---------------------------------------------------------------------------
-- Blocks are fetched by slug, and `lead_magnets_slug_per_site_unique` already
-- indexes (site_id, slug) — which is exactly the lookup a post's markers make.
-- The policies and grants from 0010 cover these columns: they are on the same
-- table, and RLS is per row, not per column.
