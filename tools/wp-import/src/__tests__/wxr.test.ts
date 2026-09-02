import { describe, expect, it } from 'vitest';

import { parseWpDate, parseWxr, slugifyTitle } from '../wxr';

/** Build a minimal but structurally faithful WXR document. */
function wxr(items: string, channelExtras = ''): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:wp="http://wordpress.org/export/1.2/"
  xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/">
<channel>
  <title>Old Blog</title>
  <link>https://old.test</link>
  <wp:base_blog_url>https://old.test</wp:base_blog_url>
  ${channelExtras}
  ${items}
</channel>
</rss>`;
}

function item(overrides: Partial<Record<string, string>> = {}): string {
  // `__categories` is raw XML appended after the scalar fields, not an element.
  const { __categories: categories, ...fieldOverrides } = overrides;

  const fields: Record<string, string | undefined> = {
    title: 'Hello World',
    link: 'https://old.test/hello-world/',
    'dc:creator': 'denis',
    'content:encoded': '<![CDATA[<p>Body text</p>]]>',
    'excerpt:encoded': '<![CDATA[]]>',
    'wp:post_id': '42',
    'wp:post_date': '2024-03-05 10:30:00',
    'wp:post_date_gmt': '2024-03-05 10:30:00',
    'wp:post_name': 'hello-world',
    'wp:status': 'publish',
    'wp:post_type': 'post',
    ...fieldOverrides,
  };

  const body = Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `<${key}>${value}</${key}>`)
    .join('\n    ');

  return `<item>\n    ${body}\n    ${categories ?? ''}\n  </item>`;
}

describe('parseWpDate', () => {
  it('treats a space-separated GMT date as UTC', () => {
    expect(parseWpDate('2024-03-05 10:30:00')).toBe('2024-03-05T10:30:00.000Z');
  });

  it('returns null for the WordPress zero date', () => {
    expect(parseWpDate('0000-00-00 00:00:00')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(parseWpDate('')).toBeNull();
  });

  it('returns null for unparseable input', () => {
    expect(parseWpDate('not a date')).toBeNull();
  });
});

describe('slugifyTitle', () => {
  it('lowercases and hyphenates', () => {
    expect(slugifyTitle('Hello There World')).toBe('hello-there-world');
  });

  it('strips accents', () => {
    expect(slugifyTitle('Café Life')).toBe('cafe-life');
  });

  it('falls back to "untitled" when nothing usable remains', () => {
    expect(slugifyTitle('!!!')).toBe('untitled');
  });
});

describe('parseWxr — structure', () => {
  it('rejects a document that is not a WordPress export', () => {
    expect(() => parseWxr('<html><body>nope</body></html>')).toThrow(/not a wordpress export/i);
  });

  it('reads the old blog URL from wp:base_blog_url', () => {
    const result = parseWxr(wxr(item()));
    expect(result.baseBlogUrl).toBe('https://old.test');
  });

  it('parses a single item into an array', () => {
    const result = parseWxr(wxr(item()));
    expect(result.posts).toHaveLength(1);
  });

  it('parses several items', () => {
    const result = parseWxr(
      wxr(
        [
          item({ 'wp:post_id': '1', 'wp:post_name': 'a', title: 'A' }),
          item({ 'wp:post_id': '2', 'wp:post_name': 'b', title: 'B' }),
        ].join('\n'),
      ),
    );
    expect(result.posts.map((p) => p.slug)).toEqual(['a', 'b']);
  });
});

describe('parseWxr — field mapping', () => {
  it('maps the core fields', () => {
    const [post] = parseWxr(wxr(item())).posts;

    expect(post).toBeDefined();
    expect(post?.wpPostId).toBe(42);
    expect(post?.title).toBe('Hello World');
    expect(post?.slug).toBe('hello-world');
    expect(post?.contentHtml).toBe('<p>Body text</p>');
    expect(post?.status).toBe('published');
    expect(post?.publishedAt).toBe('2024-03-05T10:30:00.000Z');
    expect(post?.authorName).toBe('denis');
    expect(post?.link).toBe('https://old.test/hello-world/');
  });

  it('preserves the slug verbatim rather than deriving it from the title', () => {
    // The SEO-critical guarantee: a slug that disagrees with the title wins.
    const [post] = parseWxr(
      wxr(item({ title: 'A Completely Different Title', 'wp:post_name': 'legacy-slug-2011' })),
    ).posts;

    expect(post?.slug).toBe('legacy-slug-2011');
  });

  it('decodes percent-encoded international slugs', () => {
    const [post] = parseWxr(
      wxr(item({ 'wp:post_name': '%d0%bf%d1%80%d0%b8%d0%b2%d0%b5%d1%82' })),
    ).posts;

    expect(post?.slug).toBe('привет');
  });

  it('falls back to a title-derived slug when wp:post_name is empty', () => {
    const [post] = parseWxr(wxr(item({ 'wp:post_name': '', title: 'No Slug Here' }))).posts;
    expect(post?.slug).toBe('no-slug-here');
  });

  it('keeps a numeric-looking post id as a number without losing precision', () => {
    const [post] = parseWxr(wxr(item({ 'wp:post_id': '10945' }))).posts;
    expect(post?.wpPostId).toBe(10945);
  });

  it('falls back to wp:post_date when the GMT date is the zero date', () => {
    const [post] = parseWxr(
      wxr(
        item({
          'wp:post_date_gmt': '0000-00-00 00:00:00',
          'wp:post_date': '2019-07-01 08:00:00',
        }),
      ),
    ).posts;

    expect(post?.publishedAt).toBe('2019-07-01T08:00:00.000Z');
  });

  it('reads an explicit excerpt', () => {
    const [post] = parseWxr(
      wxr(item({ 'excerpt:encoded': '<![CDATA[A hand-written summary.]]>' })),
    ).posts;

    expect(post?.excerptHtml).toBe('A hand-written summary.');
  });
});

describe('parseWxr — status mapping', () => {
  const cases: Array<[string, string]> = [
    ['publish', 'published'],
    ['draft', 'draft'],
    ['pending', 'draft'],
    ['private', 'draft'],
    ['future', 'scheduled'],
  ];

  for (const [wpStatus, expected] of cases) {
    it(`maps ${wpStatus} to ${expected}`, () => {
      const [post] = parseWxr(wxr(item({ 'wp:status': wpStatus }))).posts;
      expect(post?.status).toBe(expected);
    });
  }

  it('skips trashed posts and counts them', () => {
    const result = parseWxr(wxr(item({ 'wp:status': 'trash' })));
    expect(result.posts).toHaveLength(0);
    expect(result.skipped['post:trash']).toBe(1);
  });

  it('skips auto-drafts', () => {
    const result = parseWxr(wxr(item({ 'wp:status': 'auto-draft' })));
    expect(result.posts).toHaveLength(0);
  });

  it('treats an unknown status as a draft rather than publishing it', () => {
    const [post] = parseWxr(wxr(item({ 'wp:status': 'something-new' }))).posts;
    expect(post?.status).toBe('draft');
  });
});

describe('parseWxr — post type filtering', () => {
  it('skips pages, attachments and nav menu items, and counts each type', () => {
    const result = parseWxr(
      wxr(
        [
          item({ 'wp:post_id': '1', 'wp:post_name': 'real-post' }),
          item({ 'wp:post_id': '2', 'wp:post_name': 'about', 'wp:post_type': 'page' }),
          item({ 'wp:post_id': '3', 'wp:post_name': 'img', 'wp:post_type': 'attachment' }),
          item({ 'wp:post_id': '4', 'wp:post_name': 'm', 'wp:post_type': 'nav_menu_item' }),
        ].join('\n'),
      ),
    );

    expect(result.posts.map((p) => p.slug)).toEqual(['real-post']);
    expect(result.skipped.page).toBe(1);
    expect(result.skipped.attachment).toBe(1);
    expect(result.skipped.nav_menu_item).toBe(1);
  });
});

describe('parseWxr — taxonomy', () => {
  it('separates categories from tags by their domain attribute', () => {
    const categories =
      '<category domain="category" nicename="engineering"><![CDATA[Engineering]]></category>' +
      '<category domain="post_tag" nicename="nextjs"><![CDATA[Next.js]]></category>';

    const [post] = parseWxr(wxr(item({ __categories: categories }))).posts;

    expect(post?.terms).toEqual([
      { kind: 'category', slug: 'engineering', name: 'Engineering' },
      { kind: 'tag', slug: 'nextjs', name: 'Next.js' },
    ]);
  });

  it('drops the default Uncategorized category', () => {
    const categories =
      '<category domain="category" nicename="uncategorized"><![CDATA[Uncategorized]]></category>';
    const [post] = parseWxr(wxr(item({ __categories: categories }))).posts;

    expect(post?.terms).toHaveLength(0);
  });

  it('deduplicates repeated terms', () => {
    const categories =
      '<category domain="post_tag" nicename="seo"><![CDATA[SEO]]></category>' +
      '<category domain="post_tag" nicename="seo"><![CDATA[SEO]]></category>';
    const [post] = parseWxr(wxr(item({ __categories: categories }))).posts;

    expect(post?.terms).toHaveLength(1);
  });

  it('ignores taxonomies other than category and post_tag', () => {
    const categories =
      '<category domain="post_format" nicename="gallery"><![CDATA[Gallery]]></category>';
    const [post] = parseWxr(wxr(item({ __categories: categories }))).posts;

    expect(post?.terms).toHaveLength(0);
  });

  it('derives a term slug from its name when nicename is absent', () => {
    const categories = '<category domain="category"><![CDATA[Big Ideas]]></category>';
    const [post] = parseWxr(wxr(item({ __categories: categories }))).posts;

    expect(post?.terms[0]).toEqual({
      kind: 'category',
      slug: 'big-ideas',
      name: 'Big Ideas',
    });
  });
});

/*
 * Category hierarchy.
 *
 * The `<category>` elements on each `<item>` say only which terms a post
 * carries — they have no parent information. The tree is declared once at the
 * channel level, referenced by NICENAME rather than id. Reading only the item
 * elements, as the importer originally did, flattens the whole tree silently.
 */
describe('parseWxr — category hierarchy', () => {
  const XML = `<?xml version="1.0"?>
<rss version="2.0" xmlns:wp="http://wordpress.org/export/1.2"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <wp:base_blog_url>https://old.test</wp:base_blog_url>

    <wp:category>
      <wp:category_nicename>panels</wp:category_nicename>
      <wp:cat_name>Panels</wp:cat_name>
      <wp:category_parent>solar</wp:category_parent>
    </wp:category>
    <wp:category>
      <wp:category_nicename>energy</wp:category_nicename>
      <wp:cat_name>Energy</wp:cat_name>
      <wp:category_parent></wp:category_parent>
    </wp:category>
    <wp:category>
      <wp:category_nicename>solar</wp:category_nicename>
      <wp:cat_name>Solar</wp:cat_name>
      <wp:category_parent>energy</wp:category_parent>
    </wp:category>
    <wp:category>
      <wp:category_nicename>uncategorized</wp:category_nicename>
      <wp:cat_name>Uncategorized</wp:cat_name>
      <wp:category_parent></wp:category_parent>
    </wp:category>
    <wp:category>
      <wp:category_nicename>orphan</wp:category_nicename>
      <wp:cat_name>Orphan</wp:cat_name>
      <wp:category_parent>uncategorized</wp:category_parent>
    </wp:category>

    <item>
      <title>A post</title>
      <wp:post_id>1</wp:post_id>
      <wp:post_type>post</wp:post_type>
      <wp:status>publish</wp:status>
      <wp:post_name>a-post</wp:post_name>
      <wp:post_date_gmt>2026-01-01 10:00:00</wp:post_date_gmt>
      <content:encoded>Body</content:encoded>
      <category domain="category" nicename="panels">Panels</category>
    </item>
  </channel>
</rss>`;

  it('reads the channel-level declarations with their parents', () => {
    const { categories } = parseWxr(XML);
    const bySlug = new Map(categories.map((c) => [c.slug, c]));

    expect(bySlug.get('energy')?.parentSlug).toBeNull();
    expect(bySlug.get('solar')?.parentSlug).toBe('energy');
    expect(bySlug.get('panels')?.parentSlug).toBe('solar');
  });

  it('keeps a category declared before its parent appears', () => {
    // "panels" is listed first in the XML, above "solar" and "energy". WXR
    // guarantees no ordering, which is why the importer links parents in a
    // second pass rather than during the upsert.
    const { categories } = parseWxr(XML);
    expect(categories[0]?.slug).toBe('panels');
    expect(categories[0]?.parentSlug).toBe('solar');
  });

  it('drops Uncategorized, as the per-post term parsing already does', () => {
    const { categories } = parseWxr(XML);
    expect(categories.map((c) => c.slug)).not.toContain('uncategorized');
  });

  it('treats a child of Uncategorized as top level, not a dangling parent', () => {
    // Uncategorized is dropped, so pointing at it would leave a reference to a
    // category with no row — which the database now rejects outright.
    const { categories } = parseWxr(XML);
    expect(categories.find((c) => c.slug === 'orphan')?.parentSlug).toBeNull();
  });

  it('carries the display name, not just the slug', () => {
    const { categories } = parseWxr(XML);
    expect(categories.find((c) => c.slug === 'solar')?.name).toBe('Solar');
  });

  it('returns an empty list when the export declares no categories', () => {
    const bare = `<?xml version="1.0"?>
<rss version="2.0" xmlns:wp="http://wordpress.org/export/1.2">
  <channel><wp:base_blog_url>https://old.test</wp:base_blog_url></channel>
</rss>`;
    expect(parseWxr(bare).categories).toEqual([]);
  });

  it('handles a single declaration, which fast-xml-parser would not array', () => {
    const one = `<?xml version="1.0"?>
<rss version="2.0" xmlns:wp="http://wordpress.org/export/1.2">
  <channel>
    <wp:category>
      <wp:category_nicename>solo</wp:category_nicename>
      <wp:cat_name>Solo</wp:cat_name>
    </wp:category>
  </channel>
</rss>`;
    expect(parseWxr(one).categories).toEqual([
      { slug: 'solo', name: 'Solo', parentSlug: null },
    ]);
  });
});
