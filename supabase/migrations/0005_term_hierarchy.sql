-- 0005_term_hierarchy.sql — cycle protection for nested categories
--
-- `terms.parent_id` and the `terms_tag_flat` trigger have existed since
-- 0001_init.sql, so categories could always nest. What was missing is the check
-- that makes nesting safe.
--
-- 0001 only constrains DIRECT self-reference:
--
--   constraint terms_no_self_parent check (parent_id is null or parent_id <> id)
--
-- That leaves an indirect cycle insertable: make A the parent of B, then B the
-- parent of A, and neither statement violates the check. Nothing reads the tree
-- today, which is why it has gone unnoticed — but the admin's category picker and
-- the archive's "include posts from child categories" both walk ancestors, and a
-- cycle makes either loop forever.
--
-- `pages` already solved this in 0004_pages.sql. This applies the same treatment
-- to terms, minus the materialised path: category URLs stay flat
-- (/blog/category/<slug>), so there is no path to keep in sync, and re-parenting
-- a category never changes a URL.

/*
 * One function for all three parent checks, in a fixed order.
 *
 * They were briefly three triggers, which was a bug. Postgres fires same-timing
 * triggers in alphabetical order by NAME, so `terms_reject_cross_site_parent_before`
 * ran before `terms_reject_parent_cycle_before`. Given a parent_id that does not
 * exist, the cross-site check read a null site_id, and `null is distinct from
 * <uuid>` is true — so a dangling reference was reported as "belongs to a
 * different site" and the accurate "does not exist" check was never reached.
 *
 * `pages_set_path()` in 0004 avoids the same class of problem the same way:
 * order-dependent checks belong in one function, where the order is explicit
 * rather than a consequence of how the triggers happen to be named.
 */
create function public.terms_check_parent()
returns trigger
language plpgsql
as $$
declare
  parent_site uuid;
  parent_found boolean;
  cursor_id   uuid;
  depth       int := 0;
begin
  if new.parent_id is null then
    return new;
  end if;

  -- 1. Existence, first: every check below reads the parent row, and a missing
  --    one must not be reported as some other kind of failure.
  select true, site_id into parent_found, parent_site
  from public.terms where id = new.parent_id;

  if not coalesce(parent_found, false) then
    raise exception 'parent term % does not exist', new.parent_id;
  end if;

  -- 2. Same site. Not reachable through the admin, which only offers same-site
  --    parents, but the schema should not allow one site's category to be
  --    re-parented under another's — that would leak a term name across a
  --    tenant boundary into any rendered breadcrumb.
  if parent_site is distinct from new.site_id then
    raise exception 'parent term % belongs to a different site', new.parent_id;
  end if;

  -- 3. Cycles. 0001_init.sql only constrains DIRECT self-reference:
  --
  --      constraint terms_no_self_parent check (parent_id is null or parent_id <> id)
  --
  --    which leaves an indirect cycle insertable: make A the parent of B, then B
  --    the parent of A, and neither statement violates it. The admin's category
  --    picker and the archive's descendant resolution both walk this chain, and
  --    a cycle makes either loop forever.
  cursor_id := new.parent_id;
  while cursor_id is not null loop
    if cursor_id = new.id then
      raise exception 'category hierarchy cycle: % cannot be its own ancestor', new.id;
    end if;

    depth := depth + 1;
    -- A depth cap as well as the cycle check: the walk terminates on a cycle
    -- reachable from `new`, but a pre-existing cycle further up the chain would
    -- not contain new.id and would spin forever.
    if depth > 50 then
      raise exception 'category hierarchy deeper than 50 levels; likely a cycle';
    end if;

    select parent_id into cursor_id from public.terms where id = cursor_id;
  end loop;

  return new;
end;
$$;

/*
 * `before insert or update of parent_id, site_id` is safe here, unlike the
 * equivalent on pages.
 *
 * `UPDATE OF col` fires on the columns named in the statement's SET clause, not
 * on whether the value changed. On pages that was a trap: re-parenting sets
 * parent_id and lets the trigger recompute `path`, so a trigger watching `OF
 * path` never fired. Here there is no derived column — the only way to reach a
 * bad state is to write parent_id or site_id, which is exactly what this watches.
 */
create trigger terms_check_parent_before
  before insert or update of parent_id, site_id on public.terms
  for each row execute function public.terms_check_parent();

-- No index needed: 0001_init.sql already creates terms_parent_idx on
-- (parent_id), which serves both the admin's per-parent listing and the
-- archive's descendant resolution.
