import { describe, expect, it } from 'vitest';

import {
  buildLinkGraph,
  classifyLink,
  extractLinks,
  normalisePath,
  type LinkSource,
} from '../links';
import { NNTM_CAPITAL_SLUG } from '../coded-routes';

const SITE = { slug: 'demo', base_url: 'https://example.com' };

const source = (over: Partial<LinkSource> & Pick<LinkSource, 'id'>): LinkSource => ({
  kind: 'post',
  title: `Post ${over.id}`,
  path: `/blog/${over.id}`,
  status: 'published',
  published_at: '2024-01-01T00:00:00Z',
  content_html: '',
  ...over,
});

describe('extractLinks', () => {
  it('reads href, anchor text and rel', () => {
    const links = extractLinks(
      '<p>See <a href="/blog/other" rel="nofollow">the <em>other</em> post</a>.</p>',
    );

    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({
      href: '/blog/other',
      // From the text content, not the inner HTML — the <em> must not survive.
      text: 'the other post',
      rel: 'nofollow',
      nofollow: true,
    });
  });

  it('ignores an anchor with no href', () => {
    // <a name="x"> is a jump TARGET. WordPress content is full of them and they
    // have no destination to report.
    expect(extractLinks('<a name="section-two"></a><h2>Two</h2>')).toEqual([]);
  });

  it('decodes entities in the href', () => {
    // A two-parameter query string is serialised with &amp;, and an href
    // compared without decoding it would never match the URL a browser asks for.
    const [link] = extractLinks('<a href="/search?a=1&amp;b=2">x</a>');
    expect(link?.href).toBe('/search?a=1&b=2');
  });

  it('keeps an image-only link, with empty text', () => {
    const [link] = extractLinks('<a href="/blog/one"><img src="/a.png" alt=""></a>');
    expect(link).toMatchObject({ href: '/blog/one', text: '' });
  });

  it('finds every anchor, in document order', () => {
    const links = extractLinks(
      '<a href="/a">A</a><p>text</p><a href="/b">B</a><a href="/a">A again</a>',
    );
    expect(links.map((link) => link.href)).toEqual(['/a', '/b', '/a']);
  });

  it('does not treat rel="noopener" as nofollow', () => {
    const [link] = extractLinks('<a href="https://x.test" rel="noopener noreferrer">x</a>');
    expect(link?.nofollow).toBe(false);
  });

  it('reads a single-quoted attribute', () => {
    const [link] = extractLinks("<a href='/blog/one'>one</a>");
    expect(link?.href).toBe('/blog/one');
  });
});

describe('normalisePath', () => {
  it('drops the trailing slash the blog serves', () => {
    // trailingSlash: true means /about and /about/ are one page. Two entries
    // would split one destination into two and invent an orphan.
    expect(normalisePath('/about/')).toBe('/about');
    expect(normalisePath('/about')).toBe('/about');
  });

  it('keeps the root as a single slash', () => {
    expect(normalisePath('/')).toBe('/');
    expect(normalisePath('')).toBe('/');
  });

  it('decodes escapes so one path is one destination', () => {
    expect(normalisePath('/blog/caf%C3%A9')).toBe('/blog/café');
  });

  it('survives a malformed escape rather than losing the link', () => {
    expect(normalisePath('/blog/%E0%A4%A')).toBe('/blog/%E0%A4%A');
  });

  it('preserves case, because Next routing does', () => {
    expect(normalisePath('/Blog/One')).toBe('/Blog/One');
  });
});

describe('classifyLink', () => {
  it('reads a root-relative link as internal', () => {
    expect(classifyLink('/about/', SITE)).toMatchObject({
      kind: 'internal',
      path: '/about',
    });
  });

  it('reads an absolute link to this host as internal', () => {
    expect(classifyLink('https://example.com/blog/one', SITE)).toMatchObject({
      kind: 'internal',
      path: '/blog/one',
    });
  });

  it('treats www as the same site', () => {
    // Content migrated off WordPress mixes both spellings of one domain.
    expect(classifyLink('https://www.example.com/blog/one', SITE)).toMatchObject({
      kind: 'internal',
      path: '/blog/one',
    });
  });

  it('reads another host as external and reports it', () => {
    expect(classifyLink('https://pwc.com/report.pdf', SITE)).toMatchObject({
      kind: 'external',
      hostname: 'pwc.com',
      path: null,
    });
  });

  it('reads a protocol-relative link as external when the host differs', () => {
    expect(classifyLink('//other.test/x', SITE)).toMatchObject({
      kind: 'external',
      hostname: 'other.test',
    });
  });

  it('drops the query and fragment from an internal path', () => {
    expect(classifyLink('/blog/one?utm=x#section', SITE)).toMatchObject({
      kind: 'internal',
      path: '/blog/one',
      fragment: 'section',
    });
  });

  it('separates a same-page jump from a link', () => {
    expect(classifyLink('#pricing', SITE)).toMatchObject({
      kind: 'anchor',
      fragment: 'pricing',
      path: null,
    });
  });

  it('names email and phone links rather than calling them broken', () => {
    expect(classifyLink('mailto:hi@example.com', SITE).kind).toBe('email');
    expect(classifyLink('tel:+15551234', SITE).kind).toBe('phone');
  });

  it('files an unsupported scheme under other', () => {
    expect(classifyLink('ftp://files.test/x', SITE).kind).toBe('other');
  });

  it('does not call anything internal when base_url is unparseable', () => {
    // A misconfigured site row must not silently mark every external link as
    // its own — the safe read is external.
    expect(classifyLink('https://example.com/a', { base_url: 'not a url' })).toMatchObject({
      kind: 'external',
    });
  });
});

describe('buildLinkGraph — internal resolution', () => {
  const graph = buildLinkGraph({
    site: SITE,
    terms: [
      { kind: 'category', slug: 'funding', name: 'Funding' },
      { kind: 'tag', slug: 'sba', name: 'SBA' },
    ],
    redirects: [{ from_path: '/old-post', to_path: '/blog/one' }],
    sources: [
      source({
        id: 'one',
        content_html: [
          '<a href="/blog/two">a published post</a>',
          '<a href="/blog/draft">a draft</a>',
          '<a href="/blog/gone">nothing here</a>',
          '<a href="/old-post">through a redirect</a>',
          '<a href="/blog/category/funding">an archive</a>',
          '<a href="/blog/tag/sba">a tag</a>',
          '<a href="/blog">the index</a>',
          '<a href="/blog/page/3">page three</a>',
          '<a href="/feed.xml">the feed</a>',
          '<a href="/">home</a>',
          '<a href="https://pwc.com/x">off-site</a>',
          '<a href="mailto:hi@example.com">email</a>',
        ].join(''),
      }),
      source({ id: 'two' }),
      source({ id: 'draft', status: 'draft', published_at: null }),
    ],
  });

  const statusOf = (href: string) =>
    graph.links.find((link) => link.href === href)?.status;
  const targetOf = (href: string) =>
    graph.links.find((link) => link.href === href)?.target?.kind;

  it('resolves a link to a live post', () => {
    expect(targetOf('/blog/two')).toBe('content');
    expect(statusOf('/blog/two')).toBe('ok');
  });

  it('flags a link to content that is not served', () => {
    // The row exists, so this is not "broken" — but a visitor following it gets
    // a 404, and nothing else on the screen would say so.
    expect(targetOf('/blog/draft')).toBe('content');
    expect(statusOf('/blog/draft')).toBe('unpublished');
  });

  it('flags a link that resolves to nothing', () => {
    expect(statusOf('/blog/gone')).toBe('missing');
  });

  it('flags a link that takes a redirect hop', () => {
    expect(statusOf('/old-post')).toBe('redirect');
    expect(
      graph.links.find((link) => link.href === '/old-post')?.target,
    ).toMatchObject({ kind: 'redirect', to: '/blog/one' });
  });

  it.each([
    ['/blog/category/funding', 'archive'],
    ['/blog/tag/sba', 'archive'],
    ['/blog', 'archive'],
    ['/blog/page/3', 'archive'],
    ['/feed.xml', 'file'],
    ['/', 'archive'],
  ])('does not report %s as broken', (href, kind) => {
    expect(targetOf(href)).toBe(kind);
    expect(statusOf(href)).toBe('ok');
  });

  it('leaves an external link unchecked rather than guessing', () => {
    expect(statusOf('https://pwc.com/x')).toBe('unchecked');
    expect(graph.links.find((link) => link.href === 'https://pwc.com/x')?.target).toBeNull();
  });

  it('leaves a contact link unchecked, not broken', () => {
    expect(statusOf('mailto:hi@example.com')).toBe('unchecked');
  });

  it('counts each kind once in the totals', () => {
    expect(graph.totals.broken).toBe(1);
    expect(graph.totals.unpublished).toBe(1);
    expect(graph.totals.redirects).toBe(1);
    expect(graph.totals.external).toBe(1);
    expect(graph.totals.contentItems).toBe(3);
  });
});

describe('buildLinkGraph — a redirect shadowing real content', () => {
  it('reports the hop, because that is what a request does', () => {
    /*
     * next.config.ts emits redirects into the routing layer, which runs ahead
     * of the filesystem routes. So a link to a path that is BOTH a redirect
     * source and a real page still costs a hop, and calling it fine would hide
     * the one thing worth fixing.
     */
    const graph = buildLinkGraph({
      site: SITE,
      redirects: [{ from_path: '/blog/two', to_path: '/blog/one' }],
      sources: [
        source({ id: 'one', content_html: '<a href="/blog/two">two</a>' }),
        source({ id: 'two' }),
      ],
    });

    expect(graph.links[0]?.status).toBe('redirect');
    // And so it is NOT an incoming link to post two.
    expect(graph.nodes.find((node) => node.node.id === 'two')?.incoming).toBe(0);
  });
});

describe('buildLinkGraph — the imported-WordPress case', () => {
  /*
   * The failure this screen was worth building for. WordPress serves posts at
   * the root; this site serves them under /blog. The importer's
   * rewriteInternalUrls turns old absolute URLs into root-relative ones but
   * cannot know about the prefix, so an imported corpus arrives with every
   * internal link one directory too high — and nothing anywhere says so.
   */
  const graph = buildLinkGraph({
    site: SITE,
    sources: [
      source({
        id: 'guide',
        path: '/blog/sba-loan-guide',
        content_html: '<a href="/equipment-financing/">see the equipment guide</a>',
      }),
      source({ id: 'equipment', path: '/blog/equipment-financing' }),
    ],
  });

  it('reports the link as broken, because it is', () => {
    expect(graph.links[0]?.status).toBe('missing');
  });

  it('names the path that was meant', () => {
    expect(graph.links[0]?.target).toMatchObject({
      kind: 'missing',
      suggestion: '/blog/equipment-financing',
    });
  });

  it('does not credit the target with an incoming link it is not getting', () => {
    expect(graph.nodes.find((node) => node.node.id === 'equipment')?.orphan).toBe(true);
  });

  it('suggests a match on the slug alone when the prefix is not the problem', () => {
    const moved = buildLinkGraph({
      site: SITE,
      sources: [
        source({ id: 'one', content_html: '<a href="/news/quarterly-update">update</a>' }),
        source({ id: 'two', kind: 'page', path: '/updates/quarterly-update' }),
      ],
    });

    expect(moved.links[0]?.target).toMatchObject({
      suggestion: '/updates/quarterly-update',
    });
  });

  it('offers nothing rather than guessing between two candidates', () => {
    const ambiguous = buildLinkGraph({
      site: SITE,
      sources: [
        source({ id: 'one', content_html: '<a href="/archive/overview">overview</a>' }),
        source({ id: 'two', kind: 'page', path: '/a/overview' }),
        source({ id: 'three', kind: 'page', path: '/b/overview' }),
      ],
    });

    expect(ambiguous.links[0]?.target).toMatchObject({ suggestion: null });
  });
});

describe('buildLinkGraph — coded routes', () => {
  it('does not report a coded marketing page as broken', () => {
    // /get-funded is a React component in apps/blog, not a `pages` row. Without
    // the registry it resolves to nothing and reads as a 404 that is not one.
    const graph = buildLinkGraph({
      site: { slug: NNTM_CAPITAL_SLUG, base_url: 'https://example.com' },
      sources: [source({ id: 'one', content_html: '<a href="/get-funded/">apply</a>' })],
    });

    expect(graph.links[0]?.status).toBe('ok');
    expect(graph.links[0]?.target).toMatchObject({ kind: 'coded', label: 'Get Funded' });
  });

  it('still reports a coded path on a site that does not have it', () => {
    const graph = buildLinkGraph({
      site: SITE,
      sources: [source({ id: 'one', content_html: '<a href="/get-funded/">apply</a>' })],
    });

    expect(graph.links[0]?.status).toBe('missing');
  });
});

describe('buildLinkGraph — same-page anchors', () => {
  const html = [
    '<a href="#the-real-cost">jump</a>',
    '<a href="#nowhere">jump</a>',
    '<a href="#explicit">jump</a>',
    '<h2>The real cost</h2>',
    '<div id="explicit"></div>',
  ].join('');

  const graph = buildLinkGraph({
    site: SITE,
    sources: [source({ id: 'one', content_html: html })],
  });

  const statusOf = (href: string) =>
    graph.links.find((link) => link.href === href)?.status;

  it('accepts a jump to a heading, whose id only exists after render', () => {
    // headings.ts adds ids at render time, so #the-real-cost points at an id
    // that is nowhere in the stored HTML. Checking only stored attributes would
    // report every table-of-contents link as broken.
    expect(statusOf('#the-real-cost')).toBe('ok');
  });

  it('accepts a jump to an explicit id', () => {
    expect(statusOf('#explicit')).toBe('ok');
  });

  it('reports a jump to nothing', () => {
    expect(statusOf('#nowhere')).toBe('missing');
  });
});

describe('buildLinkGraph — counts', () => {
  const graph = buildLinkGraph({
    site: SITE,
    sources: [
      source({
        id: 'hub',
        content_html: [
          '<a href="/blog/spoke">once</a>',
          '<a href="/blog/spoke">twice</a>',
          '<a href="/blog/hub">a self link</a>',
          '<a href="https://a.test">a</a>',
          '<a href="https://b.test">b</a>',
        ].join(''),
        path: '/blog/hub',
      }),
      source({
        id: 'draft-hub',
        status: 'draft',
        published_at: null,
        path: '/blog/draft-hub',
        content_html: '<a href="/blog/spoke">from a draft</a>',
      }),
      source({ id: 'spoke', path: '/blog/spoke' }),
      source({ id: 'lonely', path: '/blog/lonely' }),
    ],
  });

  const stats = (id: string) => graph.nodes.find((node) => node.node.id === id);

  it('sums anchors for outbound counts', () => {
    // "How many links does this post carry" is a question about anchors, so the
    // repeated /blog/spoke counts twice — plus the self link.
    expect(stats('hub')?.internalOut).toBe(3);
    expect(stats('hub')?.externalOut).toBe(2);
  });

  it('collapses a repeated href into one row with a count', () => {
    const rows = graph.links.filter(
      (link) => link.source.id === 'hub' && link.href === '/blog/spoke',
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.occurrences).toBe(2);
  });

  it('counts distinct sources for incoming, not anchors', () => {
    // Five links from one post is one page vouching for this one. Counting
    // anchors is how an orphan hides behind a big number.
    expect(stats('spoke')?.incoming).toBe(2);
  });

  it('separates incoming links a crawler can actually follow', () => {
    expect(stats('spoke')?.incomingLive).toBe(1);
  });

  it('does not let a self link cover for an orphan', () => {
    expect(stats('hub')?.incoming).toBe(0);
    expect(stats('hub')?.orphan).toBe(true);
  });

  it('marks content nothing links to', () => {
    expect(stats('lonely')?.orphan).toBe(true);
    expect(graph.totals.orphans).toBe(3);
  });

  it('does not mark content with an inbound link', () => {
    expect(stats('spoke')?.orphan).toBe(false);
  });
});

describe('buildLinkGraph — pages and posts together', () => {
  it('resolves links in both directions between them', () => {
    const graph = buildLinkGraph({
      site: SITE,
      sources: [
        source({
          id: 'about',
          kind: 'page',
          path: '/about',
          content_html: '<a href="/blog/one">a post</a>',
        }),
        source({
          id: 'one',
          path: '/blog/one',
          content_html: '<a href="https://example.com/about/">the about page</a>',
        }),
      ],
    });

    expect(graph.links.every((link) => link.status === 'ok')).toBe(true);
    expect(graph.totals.orphans).toBe(0);
    expect(graph.nodes.map((node) => node.node.id)).toEqual(['about', 'one']);
  });
});

describe('buildLinkGraph — an empty site', () => {
  it('produces zeroes rather than throwing', () => {
    const graph = buildLinkGraph({ site: SITE, sources: [] });
    expect(graph.links).toEqual([]);
    expect(graph.totals).toMatchObject({ links: 0, orphans: 0, contentItems: 0 });
  });

  it('tolerates a body that is empty or missing links', () => {
    const graph = buildLinkGraph({
      site: SITE,
      sources: [source({ id: 'one', content_html: '' }), source({ id: 'two' })],
    });
    expect(graph.totals.links).toBe(0);
    expect(graph.nodes).toHaveLength(2);
  });
});
