# blogging-platform-2

A fast, statically-rendered replacement for a WordPress blog. Content lives in
Postgres and is published from a browser; public pages are prerendered and served
from cache, so a visitor request never touches the database.

Several blogs are run from one codebase and one database, with **one Vercel
project per blog** plus a single shared admin deployment.

## Status

Phases 1–3 of 8 are complete: schema, public rendering, and the WordPress
importer. The admin dashboard (phase 4) is a placeholder — until it lands, content
is managed with `pnpm wp-import` or direct SQL.

Sitemap, RSS and structured data arrive in phase 6. **Do not cut a live site over
to this before then**, or you will lose sitemap and structured-data coverage.

## Layout

```
apps/blog        Public renderer. One Vercel project per blog, pinned to a
                 single site by SITE_SLUG. No auth, no editor code.
apps/admin       The one dashboard deployment. Placeholder for now.
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
supabase/migrations/0001_init.sql
supabase/migrations/0002_rls.sql
```

Seed a site with sample posts so there is something to render:

```bash
pnpm seed --site demo --base-url http://localhost:3000
```

Then:

```bash
pnpm dev          # blog on http://localhost:3000
pnpm dev:admin    # admin on http://localhost:3001
```

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
you re-upload them (the media library is phase 7).

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

One Vercel project per blog:

- Root Directory: `apps/blog`
- Env: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SITE_SLUG`
- Attach that blog's domain in the project's Domains settings

Plus one project for the admin, Root Directory `apps/admin`.

Each blog's `sites` row needs a `base_url` matching its real origin — canonical
URLs and, later, sitemap and RSS are built from it.

## Commands

```bash
pnpm dev          # run the blog locally
pnpm build        # production build of the blog
pnpm test         # unit tests
pnpm typecheck    # all workspace packages
pnpm seed         # seed sample content
pnpm wp-import    # WordPress import CLI (--help for options)
```

## Notes

- Permalinks are flat (`/post-name/`), matching the source site's `/%postname%/`.
  Adding dated permalinks later means converting `app/[slug]` to a catch-all —
  Next.js rejects two differently-named dynamic segments at the same level.
- `packages/core` ships TypeScript source and is consumed via `transpilePackages`,
  so there is no build step between editing shared code and seeing it apply.
- Redirects are read from the database at build time and emitted into Vercel's
  routing layer, so they cost no function invocation. Adding one needs a redeploy.
- A post page currently ships ~177 KB gzipped of JavaScript. Content itself needs
  none — bodies are in the prerendered HTML and read fine with JS disabled — but
  that is the Next.js App Router hydration baseline. Worth measuring Total
  Blocking Time on mobile before committing to it long-term.
