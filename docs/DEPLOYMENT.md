# Deployment runbook

Setting this up end to end. Roughly 30 minutes for the first blog, a few minutes
for each additional one.

The architecture: **one Vercel project per blog**, plus **one admin project**,
all sharing **one Supabase project**.

```
Supabase (one project)
  ├── apps/blog   → Vercel project "myblog"      SITE_SLUG=myblog     → myblog.com
  ├── apps/blog   → Vercel project "otherblog"   SITE_SLUG=otherblog  → otherblog.com
  └── apps/admin  → Vercel project "blog-admin"                       → admin.yourdomain.com
```

---

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com). Pick a region near
   your readers — the blog only queries it at build time, but the admin queries
   it on every page load.

2. Apply the migrations **in order**, pasting each into the SQL editor:

   ```
   supabase/migrations/0001_init.sql      schema
   supabase/migrations/0002_rls.sql       row level security and grants
   supabase/migrations/0003_storage.sql   media bucket
   ```

3. **Disable signups.** Authentication → Sign In / Providers → Email, turn off
   "Allow new users to sign up". This is what makes the system closed. The app
   also passes `shouldCreateUser: false`, but the project setting is the one that
   cannot be bypassed by a code change.

4. Collect from Project Settings → Data API:
   - Project URL → `SUPABASE_URL`
   - `anon` `public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**local use only**)

## 2. Create your first site

In the SQL editor:

```sql
insert into sites (slug, name, description, base_url)
values ('myblog', 'My Blog', 'What it is about', 'https://myblog.com');
```

`base_url` must be an origin with no trailing path or slash. Canonical URLs, the
sitemap, the feed, and cache refreshes are all derived from it.

A `site_secrets` row is created automatically by trigger. Read it — you need it
for the blog project's environment:

```sql
select revalidate_secret from site_secrets
  where site_id = (select id from sites where slug = 'myblog');
```

## 3. Create your user — and grant it access

Two steps, and **skipping the second is the most common way to get stuck**: you
will sign in successfully and then see an empty dashboard, because every RLS
policy is keyed off `site_members`.

1. Authentication → Users → **Invite user**, with your email address.

2. Then, in the SQL editor:

   ```sql
   insert into site_members (site_id, user_id, role)
   select s.id, u.id, 'owner'
   from sites s, auth.users u
   where s.slug = 'myblog' and u.email = 'you@example.com';
   ```

   Repeat the insert for each additional site you create.

## 4. Local check before deploying

```bash
cp .env.example .env.local     # fill in the values from step 1
pnpm install
pnpm seed --site myblog --base-url http://localhost:3000   # optional sample posts
pnpm dev        # blog  → http://localhost:3000
pnpm dev:admin  # admin → http://localhost:3001
```

Sign in at `/login`. If the dashboard says the account is not a member of any
site, revisit step 3.

## 5. Import from WordPress

Export from WordPress admin: **Tools → Export → All content**.

```bash
pnpm wp-import --file export.xml --site myblog --dry-run
```

Read the report — particularly the dropped-shortcode list and any slug
conflicts — then run it again without `--dry-run`. It is idempotent, so a second
run updates rather than duplicates.

## 6. Vercel — the blog

Create a project from this repository, then:

| Setting | Value |
| --- | --- |
| Root Directory | `apps/blog` |
| Framework Preset | Next.js |
| Build Command | default |

Environment variables:

| Name | Value |
| --- | --- |
| `SUPABASE_URL` | from step 1 |
| `SUPABASE_ANON_KEY` | from step 1 |
| `SITE_SLUG` | `myblog` — must match the `sites.slug` row |
| `REVALIDATE_SECRET` | the `revalidate_secret` from step 2 |

**Do not set `SUPABASE_SERVICE_ROLE_KEY` here.** The blog only reads, and only
published content; giving it a key that bypasses RLS turns a read-only site into
a full-access one.

Then Settings → Domains → add `myblog.com` and follow the DNS instructions.

Repeat this whole section for each additional blog, changing `SITE_SLUG`, the
secret, and the domain.

## 7. Vercel — the admin

One project, once.

| Setting | Value |
| --- | --- |
| Root Directory | `apps/admin` |

| Name | Value |
| --- | --- |
| `SUPABASE_URL` | from step 1 |
| `SUPABASE_ANON_KEY` | from step 1 |
| `ADMIN_URL` | `https://admin.yourdomain.com` |

`ADMIN_URL` is where magic-link emails point. If it is wrong, sign-in links land
on the wrong host and will not work.

Add the domain, then in Supabase set Authentication → URL Configuration → Site
URL to the same value, and add `https://admin.yourdomain.com/auth/callback` to
the redirect allow list.

## 8. Confirm the whole loop

1. Sign in to the admin.
2. Publish a post.
3. It should appear on the live blog within seconds, with no redeploy.

If the admin warns that the live site was not refreshed, the cause is almost
always one of:

- `REVALIDATE_SECRET` on the blog does not match `site_secrets.revalidate_secret`
- `sites.base_url` does not match the blog's real domain
- the blog deployment is password-protected in Vercel, so the webhook gets a 401

Fix it, then use **Flush cache** in the admin's site settings to catch up.

---

## Optional: skip unnecessary rebuilds

With several blogs in one repository, a push rebuilds every project. To limit a
blog project to changes that actually affect it, set its Ignored Build Step to:

```bash
git diff --quiet HEAD^ HEAD -- apps/blog packages/core
```

## Adding another blog later

1. `insert into sites (...)` with the new slug and domain.
2. `insert into site_members (...)` granting yourself owner on it.
3. Read its `revalidate_secret`.
4. New Vercel project, Root Directory `apps/blog`, new `SITE_SLUG` and secret.
5. Attach the domain.

No code changes, no migration.
