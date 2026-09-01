# blogging-platform-2

A fast, statically-rendered website with a blog. Content lives in Postgres and is
published from a browser; pages are prerendered and served from cache, so a
visitor request never touches the database.

URL structure:

| | |
| --- | --- |
| `/` | A page you choose as the homepage, or a post list if none is set |
| `/about`, `/projects/solar` | Pages, nested to any depth via parent/child |
| `/blog` | Post index |
| `/blog/<slug>` | A post |
| `/blog/category/<slug>`, `/blog/tag/<slug>` | Archives |

Several blogs are run from one codebase and one database, with **one Vercel
project per blog** plus a single shared admin deployment.

## Status

Feature-complete for a single-author blog. Write and publish from the browser;
the live site updates within seconds with no redeploy.

Not built, because they were not needed: scheduled publishing, and any UI for
inviting additional writers. Roles (`owner`/`admin`/`editor`/`author`) and the
`scheduled` post status already exist in the schema, so either can be added later
without a migration.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) to set it up.

## Layout

```
apps/blog        Public renderer. One Vercel project per blog, pinned to a
                 single site by SITE_SLUG. No auth, no editor code.
apps/admin       The one dashboard deployment: auth, posts, editor, media.
packages/core    Shared: DB types, data access, sanitisation, URL helpers.
tools/wp-import  Local CLI for the WordPress migration, plus a seed script.
supabase/        SQL migrations.
```

`apps/blog` deliberately has no dependency on the editor, so editor code cannot
end up in a public bundle.

## Setup

Requires Node 22+ and pnpm 10+.

```bash
pnpm install
cp .env.example .env.local     # fill in your Supabase credentials
```

Apply the migrations to a fresh Supabase project, in order — paste each into the
SQL editor, or use `supabase db push`:

```
supabase/migrations/0001_init.sql      schema
supabase/migrations/0002_rls.sql       row level security and grants
supabase/migrations/0003_storage.sql   media bucket
```

Then, under Authentication → Sign In / Providers → Email, leave **Enable Email
provider ON** and switch **Allow new users to sign up OFF** — password sign-in
lives under that provider, so turning it off locks you out. Create your user
(Users → Add user → Create new user, with Auto Confirm ticked) and grant it
access. Full steps in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

Seed a site with sample posts so there is something to render:

```bash
pnpm seed --site demo --base-url http://localhost:3000
```

Then:

```bash
pnpm dev          # blog on http://localhost:3000
pnpm dev:admin    # admin on http://localhost:3001
```

Signing in needs a confirmed user **and** a `site_members` row — see step 3 of
the deployment runbook. Without the membership row you will sign in successfully
and then see nothing, because every RLS policy is keyed off it.

Sign-in is email + password. There is no sign-up page and no self-service
password reset, deliberately: both would put email delivery on the critical path
for account access, and Supabase's built-in sender is test-grade. Accounts and
password changes happen in the Supabase dashboard.

## Importing from WordPress

Export from WordPress admin via **Tools → Export → All content**, then:

```bash
pnpm wp-import --file export.xml --site demo --dry-run
```

Read the report — especially the dropped-shortcode list and any slug conflicts —
then re-run without `--dry-run`. The import is idempotent: running it twice
updates rather than duplicates.

Post slugs are preserved verbatim from `wp:post_name`. That is the whole point:
changing a slug breaks inbound links and search rankings.

Posts only. Comments are skipped, and images stay pointed at the old host until
you re-upload them through the admin's media library.

### What the importer does to your content

`content:encoded` in a WordPress export is raw editor content, not what a visitor
sees, so several WordPress render-time behaviours are reproduced:

- Gutenberg block comments are stripped.
- `[caption]` becomes `<figure>` / `<figcaption>`.
- Other shortcodes are removed and **reported** — there is no way to render a
  plugin's shortcode without the plugin, and leaving raw `[gallery ids="1,2"]`
  text on the page is worse than dropping it.
- Classic-editor posts with bare newlines get paragraph wrapping (wpautop).
- Internal links to the old domain become relative.

Raw source HTML is kept in `posts.original_html`, so content can be re-derived if
these transforms or the sanitiser allowlist change.

## The marketing site

One deployment additionally serves hand-coded marketing pages at the root: a
replica of the Nanotom Capital site that used to live in HighLevel. These are
routes in `apps/blog/components/marketing/`, not rows in `pages` — they carry
third-party embeds and a bespoke layout, which is code, not content.

`apps/blog` is deployed once **per blog** from one codebase, so all of it is
gated on `SITE_SLUG` via `apps/blog/lib/marketing.ts`. A site whose slug does not
match keeps the generic chrome and the database-driven homepage. Without that
gate a second blog would silently serve another company's navigation and footer.

Two things stay in HighLevel deliberately:

- **The qualification form** is embedded as an iframe. It has conditional logic,
  TCPA consent wording and CRM automations behind it; rebuilding that natively
  risks dropping leads for no user-visible gain. Set `NEXT_PUBLIC_HL_FORM_ID`.
- **Images** are hotlinked from HighLevel's CDN. Measured before deciding: they
  are already WebP, already Cloudflare edge-cached for six months, and 5–36 KB
  each, so re-hosting would add a build step and save nothing. They use plain
  `<img>` rather than `next/image` — routing an optimised WebP through the
  optimiser spends quota to re-encode it into the same thing.

The page ships no JavaScript of its own. The mobile menu is a `<details>`
element and the nav dropdown is CSS-only, so the whole header stays a server
component.

## Security model

Two consumers, two key types:

| | Key | Access |
| --- | --- | --- |
| `apps/blog` | anon | `SELECT` only, published posts only, enforced by RLS |
| `apps/admin` | the user's own JWT | writes gated on `site_members` role |
| `tools/wp-import` | service role | full access — **local use only** |

The service-role key bypasses row level security entirely. It must never be set on
a deployed project; a blog deployment has no legitimate use for it, and its
presence turns a read-only site into a full-access one.

Post HTML is sanitised **on write**, never on read, so the public renderer is a
plain string echo with no per-request cost. Widening the allowlist in
`packages/core/src/sanitize.ts` does not retroactively un-strip existing content —
re-derive from `original_html` after such a change.

## Deployment

Full runbook: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**. In outline:

| Project | Root Directory | Environment |
| --- | --- | --- |
| One per blog | `apps/blog` | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SITE_SLUG`, `REVALIDATE_SECRET` |
| The marketing site | `apps/blog` | the above, plus `NEXT_PUBLIC_HL_FORM_ID` and `NEXT_PUBLIC_GTM_ID` |
| Admin (one) | `apps/admin` | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |

Each blog's `sites` row needs a `base_url` matching its real origin — canonical
URLs, the sitemap, the feed, and cache refreshes are all built from it.

## Publishing

Posts are edited in the admin and stored as sanitised HTML. Saving a post writes
to Postgres, then calls `POST /api/revalidate` on that blog's deployment with a
shared secret; the blog decides which paths that affects and drops them from its
cache. The write is never rolled back if that call fails — the admin reports the
failure instead, and **Flush cache** in site settings retries it.

## Commands

```bash
pnpm dev          # run the blog locally
pnpm dev:admin    # run the admin locally
pnpm build        # production build of the blog
pnpm test         # unit tests
pnpm typecheck    # all workspace packages
pnpm seed         # seed sample content
pnpm wp-import    # WordPress import CLI (--help for options)
```

## Notes

- Post permalinks are `/blog/<slug>`; pages own the root. Static route segments
  outrank the pages catch-all in Next's matcher, so a page can never shadow the
  blog. `apps/blog/__tests__/route-config.test.ts` guards the related trap:
  `dynamicParams = false` on a `[param]` route makes content published after the
  last deploy permanently unreachable.
- The site's reading column lives in `apps/blog/app/blog/layout.tsx`, not the
  root layout, so marketing pages can be full-bleed. Routes outside `/blog` that
  want it supply it themselves. `apps/blog/__tests__/layout.test.ts` guards this:
  losing the container does not error, it just renders text edge-to-edge at
  1440px, which no other test would catch.
- Page nesting comes from `parent_id`; the full path is materialised into
  `pages.path` by trigger, so a lookup is one indexed query at any depth and
  re-parenting rewrites the whole subtree.
- Pages use a looser sanitiser than posts (`sanitizePageHtml`): `<style>`,
  classes and inline styles survive so a marketing layout renders as designed.
  Scripts and event handlers are still stripped. The trust model is WordPress's —
  an admin authoring a page is equivalent to shipping code — and it deliberately
  does not apply to post content, which can arrive from an untrusted import.
- `packages/core` ships TypeScript source and is consumed via `transpilePackages`,
  so there is no build step between editing shared code and seeing it apply.
- Redirects are read from the database at build time and emitted into Vercel's
  routing layer, so they cost no function invocation. Adding one needs a redeploy.
- A post page ships ~177 KB gzipped of JavaScript and the marketing homepage
  ~173 KB. Neither page contributes any of it: content is in the prerendered HTML
  and reads fine with JS disabled, and that figure is the Next.js App Router
  hydration baseline. Worth measuring Total Blocking Time on mobile before
  committing to it long-term.
- The editor's enabled extensions must stay aligned with the sanitiser allowlist
  in `packages/core/src/sanitize.ts`. Anything the editor can produce that the
  sanitiser strips is silently lost on save — which is why headings start at h2
  in both.
