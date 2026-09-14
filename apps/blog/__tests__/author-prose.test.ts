import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { sanitizeAuthorHtml, type Byline, type PostDetail } from '@blog/core';

import { AuthorBox } from '@/components/blog/author-box';
import { PostByline } from '@/components/blog/post-byline';

/**
 * An author's title and bio carry inline links now, and both are rendered with
 * dangerouslySetInnerHTML. Two things have to hold, and they pull in opposite
 * directions:
 *
 *   - where they are DISPLAYED, the markup renders
 *   - where they are CONSUMED as text — a meta description, a JSON-LD value,
 *     an OG card — it must be stripped first, or tags end up in a search result
 *
 * The stored values here go through sanitizeAuthorHtml, exactly as the save
 * action does, so these render what the database would actually hold.
 */
const TITLE = sanitizeAuthorHtml(
  'Founder at <a href="https://nanotom.test">Nanotom Capital</a>',
);
const BIO = sanitizeAuthorHtml(
  '<p>Writes about funding. Reach him on <a href="https://example.test/x">the site</a>.</p>',
);

const byline: Byline = {
  id: 'au1',
  slug: 'denis-beaulieu',
  name: 'Denis Beaulieu',
  title: TITLE,
  bio: BIO,
  social: {},
  avatar: null,
};

const post = {
  slug: 'a-post',
  title: 'A post',
  updated_at: '2026-02-01T09:30:00.000Z',
  reading_minutes: 4,
  author_name: null,
  byline,
} as unknown as PostDetail;

describe('the big box — AuthorBox', () => {
  const html = renderToStaticMarkup(createElement(AuthorBox, { byline }));

  it('renders the link in the title rather than printing the tag', () => {
    expect(html).toContain('href="https://nanotom.test"');
    // The failure mode if dangerouslySetInnerHTML were dropped: React escapes
    // it and the reader sees the markup as words.
    expect(html).not.toContain('&lt;a href');
  });

  it('renders the link in the bio', () => {
    expect(html).toContain('href="https://example.test/x"');
  });

  it('marks both so the links are visible against a muted ground', () => {
    // Without .author-prose they inherit --color-ink-muted with no underline
    // and are indistinguishable from the text around them.
    expect(html.match(/author-prose/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('carries the rel the sanitiser applied to an external link', () => {
    expect(html).toContain('rel="noopener noreferrer"');
  });
});

describe('the small box — PostByline', () => {
  const html = renderToStaticMarkup(createElement(PostByline, { post, locale: 'en' }));

  it('renders the link in the role line', () => {
    expect(html).toContain('href="https://nanotom.test"');
    expect(html).toContain('author-prose');
  });

  it('still links the name to the archive', () => {
    // Both links coexist: the name goes to the archive, the role goes wherever
    // the author pointed it.
    expect(html).toContain('/blog/author/denis-beaulieu');
  });
});

describe('a plain-text title still works', () => {
  it('renders unchanged when there is no markup', () => {
    const plain: Byline = { ...byline, title: 'Founder, Nanotom Capital', bio: null };
    const html = renderToStaticMarkup(createElement(AuthorBox, { byline: plain }));

    expect(html).toContain('Founder, Nanotom Capital');
    expect(html).not.toContain('<a href="https://nanotom.test"');
  });

  it('renders nothing for the fields that are empty', () => {
    const bare: Byline = { ...byline, title: null, bio: null };
    const html = renderToStaticMarkup(createElement(AuthorBox, { byline: bare }));

    expect(html).toContain('Denis Beaulieu');
    expect(html).not.toContain('author-prose');
  });
});
