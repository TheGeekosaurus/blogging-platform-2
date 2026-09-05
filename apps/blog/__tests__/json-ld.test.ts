import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { PostDetail, SchemaNode, SiteRow } from '@blog/core';

import { JsonLd, PostJsonLd } from '@/components/json-ld';

/**
 * The dangerouslySetInnerHTML boundary for structured data.
 *
 * @blog/core tests the escaping in isolation; these render the components and
 * parse what actually lands in the HTML. That is a different question: a
 * perfectly escaped serializer helps nobody if the component stops calling it,
 * or if React re-escapes on top of it, or if a node arrives with no @context.
 *
 * createElement rather than JSX, and .ts rather than .tsx, on purpose. The
 * blog's vitest project has no JSX transform configured — Next sets
 * `jsx: "preserve"` — and giving it one means picking an option name out of a
 * pre-release rolldown/vite toolchain that this repo otherwise does not depend
 * on. Two extra characters per element is a better trade than a build pipeline
 * nothing else needs.
 */

const site = {
  name: 'Nanotom Capital',
  base_url: 'https://nanotom.test',
  locale: 'en',
  logo_url: null,
  structured_data: [],
} as unknown as SiteRow;

function makePost(structured: SchemaNode[]): PostDetail {
  return {
    slug: 'a-post',
    title: 'A post',
    seo_title: null,
    published_at: '2026-01-05T12:00:00.000Z',
    updated_at: '2026-02-01T09:30:00.000Z',
    reading_minutes: 4,
    author_name: 'Denis Beaulieu',
    byline: null,
    categories: [],
    tags: [],
    structured_data: structured,
  } as unknown as PostDetail;
}

const renderJsonLd = (nodes: SchemaNode[]) =>
  renderToStaticMarkup(createElement(JsonLd, { nodes }));

const renderPost = (props: {
  post: PostDetail;
  description: string;
  imageUrl?: string | null;
}) => renderToStaticMarkup(createElement(PostJsonLd, { site, ...props }));

/** Every ld+json script on the page, parsed. */
function parseScripts(html: string): SchemaNode[] {
  const matches = [
    ...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
  ];

  return matches.map(([, body]) => JSON.parse(body!) as SchemaNode);
}

const typesIn = (html: string) => parseScripts(html).map((node) => node['@type']);

describe('JsonLd', () => {
  it('renders nothing at all for an empty list', () => {
    // Not an empty <script>: a page with no structured data should carry no
    // evidence that the feature exists.
    expect(renderJsonLd([])).toBe('');
  });

  it('gives every node its own script and its own context', () => {
    /*
     * One script per node rather than a single @graph, so a malformed snippet
     * costs exactly itself. A consumer that chokes on the FAQ an author just
     * pasted still reads the BlogPosting.
     */
    const html = renderJsonLd([
      { '@type': 'Person', name: 'D' },
      { '@type': 'Organization', name: 'N' },
    ]);

    const parsed = parseScripts(html);
    expect(parsed).toHaveLength(2);
    expect(parsed.map((node) => node['@type'])).toEqual(['Person', 'Organization']);
    for (const node of parsed) expect(node['@context']).toBe('https://schema.org');
  });

  it('cannot be broken out of by a closing script tag in the data', () => {
    const headline = 'Break </script><img src=x onerror=alert(1)>';
    const html = renderJsonLd([{ '@type': 'Article', headline }]);

    // Exactly one closing tag — ours. The payload did not create a second.
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    expect(html).not.toContain('<img');

    // And the value survives intact once parsed.
    expect(parseScripts(html)[0]!.headline).toBe(headline);
  });

  it('does not double-escape through React', () => {
    /*
     * dangerouslySetInnerHTML means our escaping is the only escaping, and it
     * has to be exactly one layer. If React escaped on top of it, or if the
     * serializer escaped an already-escaped sequence, this would still parse —
     * it would just come back as the wrong string.
     */
    const html = renderJsonLd([{ '@type': 'Article', headline: 'a < b & c > d' }]);

    expect(parseScripts(html)[0]!.headline).toBe('a < b & c > d');
  });
});

describe('PostJsonLd', () => {
  it('emits the generated pair even with no snippets', () => {
    const html = renderPost({ post: makePost([]), description: 'A description.' });

    expect(typesIn(html)).toEqual(['BlogPosting', 'BreadcrumbList']);
  });

  it("appends the author's snippets after the generated ones", () => {
    const html = renderPost({
      post: makePost([{ '@type': 'FAQPage', mainEntity: [] }]),
      description: 'A description.',
    });

    expect(typesIn(html)).toEqual(['BlogPosting', 'BreadcrumbList', 'FAQPage']);
  });

  it('never lets a snippet replace the generated nodes', () => {
    /*
     * The editor panel tells authors the BlogPosting and breadcrumbs are
     * handled, and they act on that by not adding them. A snippet that could
     * suppress either would make that advice actively wrong.
     */
    const html = renderPost({
      post: makePost([{ '@type': 'BlogPosting', headline: 'Mine' }]),
      description: 'A description.',
    });

    const types = typesIn(html);
    expect(types).toContain('BreadcrumbList');
    expect(types.filter((type) => type === 'BlogPosting')).toHaveLength(2);
  });

  it('drops stored junk rather than rendering it', () => {
    const html = renderPost({
      // A hand-edited row: the column only guarantees an array.
      post: makePost(['not a node', null, 7, { '@type': 'Person' }] as unknown as SchemaNode[]),
      description: 'A description.',
    });

    expect(typesIn(html)).toEqual(['BlogPosting', 'BreadcrumbList', 'Person']);
  });

  it('carries the image it is handed', () => {
    const html = renderPost({
      post: makePost([]),
      description: 'A description.',
      imageUrl: 'https://cdn.test/hero.jpg',
    });

    expect(parseScripts(html)[0]!.image).toBe('https://cdn.test/hero.jpg');
  });

  it('omits the image when the post has none', () => {
    const html = renderPost({ post: makePost([]), description: 'A description.' });

    expect(parseScripts(html)[0]).not.toHaveProperty('image');
  });
});
