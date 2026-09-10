-- 0011_lead_magnet_image.sql — an optional image on the lead capture card
--
-- The offer is a product: a toolkit, a checklist, a spreadsheet. A card that
-- describes one in words is asking the reader to imagine it, and a mockup of
-- the thing does more to sell it than the headline does. This is the one part
-- of the WordPress popup plugin 0010 replaced that had no equivalent here.
--
-- WHY media(id) AND NOT A URL, when `asset_url` right beside it is a plain URL.
-- They are different kinds of thing. `asset_url` points at a PDF or a
-- spreadsheet, which the renderer never looks inside and often does not host —
-- a media row for it would be a row with no width, no height and no
-- placeholder, which is most of what that table is for. An image is exactly
-- what `media` exists to describe: the dimensions are what let the card reserve
-- the right space before the image loads, and the admin's uploader already
-- records them.
--
-- THE SINGLE-FK RULE. 0006_authors.sql explains why `posts` may have only one
-- foreign key to `media`: the public query embeds it as `featured_image:media(…)`,
-- and PostgREST cannot resolve that embed when two keys could satisfy it. The
-- same applies here, and this table stays inside it — `image_id` is the only FK
-- from `lead_magnets` to `media`, because `asset_url` is text. If a second
-- image is ever wanted (a logo, say), the embed in packages/core has to name
-- its constraint explicitly or it breaks every card at once.

alter table public.lead_magnets
  add column image_id uuid references public.media(id) on delete set null;

-- `on delete set null`, not cascade. Deleting an image from the library must
-- not delete the offer that used it, along with its copy, its targeting and the
-- link between it and every lead it has collected. The card simply renders
-- without a picture until someone picks a new one.

-- No index. Unlike `posts_byline_idx`, nothing asks "which offers use this
-- image" — the lookup only ever runs the other way, through the embed on a
-- primary key. A site has a handful of offers, so an index here would be read
-- by nothing and maintained on every write.
