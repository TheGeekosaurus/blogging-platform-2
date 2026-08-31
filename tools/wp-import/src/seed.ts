#!/usr/bin/env node
import { parseArgs } from 'node:util';

import {
  createServiceClient,
  excerptFor,
  readingMinutes,
  sanitizePostHtml,
} from '@blog/core';

import { loadEnv } from './env';

/**
 * Seed a site with a few posts, so the blog can be rendered before any real
 * content exists. Idempotent: re-running updates the same rows.
 */

interface SeedPost {
  slug: string;
  title: string;
  html: string;
  daysAgo: number;
  categories: string[];
  tags: string[];
}

const SEED_POSTS: SeedPost[] = [
  {
    slug: 'why-this-blog-is-fast',
    title: 'Why this blog is fast',
    daysAgo: 1,
    categories: ['Engineering'],
    tags: ['performance', 'nextjs'],
    html: `
      <p>Every page you are reading was rendered once, at build time, and is being
      served as a static file. There is no database query on this request, no
      template engine, and no plugin chain.</p>
      <h2>What that changes</h2>
      <p>A WordPress page load typically boots PHP, resolves a theme, runs every
      active plugin's hooks, and issues a series of MySQL queries — all before the
      first byte reaches you. Removing that work is most of the speed win.</p>
      <ul>
        <li>No client-side JavaScript is needed to display this text.</li>
        <li>Images reserve their space, so nothing jumps as the page loads.</li>
        <li>Fonts are the ones already on your device.</li>
      </ul>
      <blockquote><p>The fastest code is the code that never runs.</p></blockquote>
      <h2>The tradeoff</h2>
      <p>Static pages have to be rebuilt when content changes. That is a solved
      problem: publishing triggers a targeted cache invalidation for just the
      affected pages.</p>
    `,
  },
  {
    slug: 'migrating-from-wordpress',
    title: 'Migrating from WordPress without losing your URLs',
    daysAgo: 6,
    categories: ['Engineering'],
    tags: ['wordpress', 'seo'],
    html: `
      <p>The single most important rule when replacing a blog engine: do not change
      your URLs. Rankings and inbound links are attached to specific paths.</p>
      <h2>Preserving slugs</h2>
      <p>WordPress stores each post's slug in <code>wp:post_name</code> inside its
      export file. The importer copies that value verbatim rather than deriving a
      new one from the title.</p>
      <pre><code>&lt;wp:post_name&gt;migrating-from-wordpress&lt;/wp:post_name&gt;</code></pre>
      <h3>What still needs attention</h3>
      <table>
        <thead><tr><th>Concern</th><th>Handling</th></tr></thead>
        <tbody>
          <tr><td>Permalink shape</td><td>Kept flat, as before</td></tr>
          <tr><td>Changed paths</td><td>301 via the redirects table</td></tr>
          <tr><td>Images</td><td>Re-uploaded manually</td></tr>
        </tbody>
      </table>
      <p>See <a href="/why-this-blog-is-fast">the previous post</a> for the
      rendering side of this.</p>
    `,
  },
  {
    slug: 'writing-workflow',
    title: 'The writing workflow',
    daysAgo: 14,
    categories: ['Notes'],
    tags: ['writing'],
    html: `
      <p>Content lives in Postgres and is edited in the browser. Publishing does not
      involve a commit, a deploy, or a build you have to wait for.</p>
      <p>Drafts are invisible to the public — not merely unlinked, but unreachable:
      the database itself refuses to return them to an anonymous reader.</p>
    `,
  },
];

async function main(): Promise<number> {
  const { values } = parseArgs({
    options: {
      site: { type: 'string', short: 's' },
      'base-url': { type: 'string' },
      name: { type: 'string' },
    },
    allowPositionals: false,
  });

  loadEnv();

  const slug = values.site ?? process.env.SITE_SLUG ?? 'demo';
  const baseUrl = values['base-url'] ?? 'http://localhost:3000';
  const name = values.name ?? 'Demo Blog';

  const client = createServiceClient();

  // Site
  const { data: existingSite, error: siteReadError } = await client
    .from('sites')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (siteReadError) throw new Error(`Failed to read site: ${siteReadError.message}`);

  let siteId = existingSite?.id;

  if (!siteId) {
    const { data, error } = await client
      .from('sites')
      .insert({
        slug,
        name,
        description: 'A fast, static blog — seeded with sample content.',
        base_url: baseUrl.replace(/\/+$/, ''),
      })
      .select('id')
      .single();

    if (error) throw new Error(`Failed to create site: ${error.message}`);
    siteId = data.id;
    console.log(`Created site "${slug}" (${siteId})`);
  } else {
    console.log(`Using existing site "${slug}" (${siteId})`);
  }

  // Terms
  const termNames = new Map<string, { kind: 'category' | 'tag'; name: string }>();
  for (const post of SEED_POSTS) {
    for (const category of post.categories) {
      termNames.set(`category:${slugify(category)}`, { kind: 'category', name: category });
    }
    for (const tag of post.tags) {
      termNames.set(`tag:${slugify(tag)}`, { kind: 'tag', name: tag });
    }
  }

  const { data: termRows, error: termError } = await client
    .from('terms')
    .upsert(
      [...termNames.entries()].map(([key, value]) => ({
        site_id: siteId,
        kind: value.kind,
        slug: key.split(':')[1] as string,
        name: value.name,
      })),
      { onConflict: 'site_id,kind,slug' },
    )
    .select('id, kind, slug');

  if (termError) throw new Error(`Failed to upsert terms: ${termError.message}`);

  const termIds = new Map((termRows ?? []).map((row) => [`${row.kind}:${row.slug}`, row.id]));

  // Posts
  for (const post of SEED_POSTS) {
    const html = sanitizePostHtml(dedent(post.html));
    const publishedAt = new Date(Date.now() - post.daysAgo * 86_400_000).toISOString();

    const row = {
      site_id: siteId,
      slug: post.slug,
      title: post.title,
      excerpt: excerptFor({ excerpt: null, content_html: html }, 220),
      content_html: html,
      status: 'published' as const,
      published_at: publishedAt,
      author_name: 'Denis',
      reading_minutes: readingMinutes(html),
    };

    const { data: existing } = await client
      .from('posts')
      .select('id')
      .eq('site_id', siteId)
      .eq('slug', post.slug)
      .maybeSingle();

    let postId: string;

    if (existing) {
      const { error } = await client.from('posts').update(row).eq('id', existing.id);
      if (error) throw new Error(`Failed to update "${post.slug}": ${error.message}`);
      postId = existing.id;
    } else {
      const { data, error } = await client.from('posts').insert(row).select('id').single();
      if (error) throw new Error(`Failed to insert "${post.slug}": ${error.message}`);
      postId = data.id;
    }

    const pairs = [
      ...post.categories.map((c) => termIds.get(`category:${slugify(c)}`)),
      ...post.tags.map((t) => termIds.get(`tag:${slugify(t)}`)),
    ]
      .filter((id): id is string => Boolean(id))
      .map((termId) => ({ post_id: postId, term_id: termId }));

    await client.from('post_terms').delete().eq('post_id', postId);
    if (pairs.length > 0) {
      const { error } = await client.from('post_terms').insert(pairs);
      if (error) throw new Error(`Failed to link terms for "${post.slug}": ${error.message}`);
    }

    console.log(`  ${existing ? 'updated' : 'created'} ${post.slug}`);
  }

  console.log(`\nSeeded ${SEED_POSTS.length} posts. Run \`pnpm dev\` and open ${baseUrl}`);
  return 0;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Strip the leading indentation of a template literal block. */
function dedent(text: string): string {
  const lines = text.replace(/^\n/, '').replace(/\s+$/, '').split('\n');
  const indents = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => line.match(/^\s*/)?.[0].length ?? 0);
  const min = indents.length > 0 ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(min)).join('\n');
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    console.error(`\nSeed failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
