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

3. **Close signups — but leave the provider on.** Authentication → Sign In /
   Providers → Email. There are two separate switches here and they are easy to
   confuse:

   | Switch | Set to | Why |
   | --- | --- | --- |
   | **Enable Email provider** | **ON** | Password sign-in lives under this provider. Turning it off disables login entirely. |
   | **Allow new users to sign up** | **OFF** | This is what makes the system invite-only. |

   Turning off the provider instead of the signup toggle is the single most
   likely way to lock yourself out. The app has no sign-up path of its own, so
   the second switch is belt-and-braces.

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

Two steps. Do them in order and check each one, because both fail silently.

1. Authentication → Users → **Add user** → **Create new user**:
   - Email and a password you choose
   - ✅ **Auto Confirm User** — without this the account cannot sign in

   Use "Create new user", not "Invite user". An invite depends on an email
   arriving, and Supabase's built-in sender is test-grade.

   **Verify it exists before continuing** — this must return one row with a
   non-null confirmation time:

   ```sql
   select email, email_confirmed_at from auth.users;
   ```

   If it returns nothing, the user was not created and step 2 below will do
   nothing at all.

2. Grant that user access to the site:

   ```sql
   insert into site_members (site_id, user_id, role)
   select s.id, u.id, 'owner'
   from sites s, auth.users u
   where s.slug = 'myblog' and u.email = 'you@example.com';
   ```

   **This is a join, so a typo or a missing user inserts zero rows and still
   reports success.** Always confirm — it must return exactly one row:

   ```sql
   select s.name, u.email, m.role
   from site_members m
   join sites s on s.id = m.site_id
   join auth.users u on u.id = m.user_id;
   ```

   Without this row you will sign in successfully and see an empty dashboard,
   because every RLS policy is keyed off `site_members`.

   Repeat the insert for each additional site you create.

**Forgotten password?** There is no self-service reset — a reset flow would put
email back on the critical path. Set a new password in Supabase → Authentication
→ Users → edit the user.

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
| `SITE_APEX_URL` | *(optional)* `https://myblog.com` — only if retiring an old `blog.` subdomain |

`SITE_APEX_URL` turns on the subdomain redirect: requests arriving at
`blog.myblog.com/<slug>` are 301'd to `myblog.com/blog/<slug>`, so inbound links
and rankings survive the move. Attach that subdomain to this same Vercel project.
Vercel's own domain redirect cannot do it — it preserves the path, and the path
needs a `/blog` prefix. Leave the variable unset if you have no old subdomain.

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

That is all it needs. Sign-in is email + password, so there is no redirect URL to
register and no email configuration to get right.

Add the domain in Settings → Domains.

## 8. Confirm the whole loop

1. Sign in to the admin with the email and password from step 3.
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
