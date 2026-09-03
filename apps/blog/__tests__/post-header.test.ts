import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { postBreadcrumbs } from '@blog/core';

/**
 * The post header was rebuilt: the full-bleed hero is gone and the top matter —
 * breadcrumbs, title, byline, thumbnail — now sits in the reading column.
 *
 * Two things in it fail silently, which is what these are for.
 */
const read = (...parts: string[]) => readFileSync(join(__dirname, '..', ...parts), 'utf8');

/** Comments mention both field names; strip them before asserting on code. */
const stripComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

describe('the breadcrumb trail has one source', () => {
  /*
   * The visible nav and the schema.org BreadcrumbList used to be independent —
   * in fact only the second existed. Two hand-written lists agree the day they
   * are written and quietly diverge afterwards, and a trail Google can see
   * disagreeing with the one it is told about is worse than having neither.
   */
  it('is built by postBreadcrumbs in the JSON-LD, not written out again', () => {
    const source = read('components', 'json-ld.tsx');
    expect(source).toContain('postBreadcrumbs(site, post, category)');
    // The old hand-rolled positions must not come back.
    expect(stripComments(source)).not.toMatch(/position:\s*\d/);
  });

  it('is built by the same call on the page', () => {
    expect(read('app', 'blog', '[slug]', 'page.tsx')).toContain('postBreadcrumbs(site, post,');
  });

  it('runs Home, Blog, category, post — and the post is last', () => {
    const crumbs = postBreadcrumbs(
      { name: 'Nanotom Capital' },
      { slug: 'my-post', title: 'My Post' },
      { slug: 'funding', name: 'Funding' },
    );

    expect(crumbs.map((c) => c.name)).toEqual([
      'Nanotom Capital',
      'Blog',
      'Funding',
      'My Post',
    ]);
    expect(crumbs.map((c) => c.path)).toEqual([
      '/',
      '/blog',
      '/blog/category/funding',
      '/blog/my-post',
    ]);
  });

  it('drops the category rung when a post has none, rather than leaving a gap', () => {
    const crumbs = postBreadcrumbs(
      { name: 'Nanotom Capital' },
      { slug: 'my-post', title: 'My Post' },
      undefined,
    );
    expect(crumbs.map((c) => c.name)).toEqual(['Nanotom Capital', 'Blog', 'My Post']);
  });

  it('renders the last crumb as the current page, not a link', () => {
    // schema.org wants an item for every position, so the trail carries a path
    // for the post too — but linking the page you are on is a dead control.
    const source = read('components', 'blog', 'breadcrumbs.tsx');
    expect(source).toContain('aria-current="page"');
  });
});

describe('the byline shows the last-edited date', () => {
  const source = stripComments(read('components', 'blog', 'post-byline.tsx'));

  /*
   * Denis asked for the last-edited date specifically. `published_at` is the
   * obvious field to reach for and the two look identical on a post that has
   * never been revised, so this would regress without anyone noticing until an
   * old post was edited and still claimed its original date.
   */
  it('reads updated_at and not published_at', () => {
    expect(source).toContain('post.updated_at');
    expect(source).not.toContain('post.published_at');
  });

  it('labels it, so it is not mistaken for the publish date', () => {
    expect(source).toContain('Updated');
  });

  it('shows the reading time beside it', () => {
    expect(source).toContain('reading_minutes');
  });
});

describe('the hero is gone', () => {
  const source = read('app', 'blog', '[slug]', 'page.tsx');

  it('has no full-bleed image band above the article', () => {
    expect(source).not.toContain('min-h-[clamp(300px,32vw,560px)]');
    expect(source).not.toContain('linear-gradient(180deg,rgba(11,11,12');
  });

  it('needs no separate header for a post without a featured image', () => {
    // Removing the hero removed a conditional as well as a design: there used
    // to be two header variants, and now there is one plus an optional image.
    expect(source.match(/<h1/g) ?? []).toHaveLength(1);
  });
});

describe('the contents rail scrollbar stays out of the way', () => {
  const css = read('app', 'globals.css');

  it('is transparent until hovered or focused within', () => {
    expect(css).toContain('.toc-scroll');
    expect(css).toContain('scrollbar-color: transparent transparent');
    expect(css).toMatch(/\.toc-scroll:hover[\s\S]{0,400}color-mix/);
  });

  it('reserves the track so the list cannot shift when it appears', () => {
    // The usual cost of hiding a scrollbar, and more annoying than the bar.
    expect(css).toContain('scrollbar-gutter: stable');
  });

  it('covers Firefox and WebKit, which share no syntax here', () => {
    expect(css).toContain('scrollbar-width: thin');
    expect(css).toContain('.toc-scroll::-webkit-scrollbar-thumb');
  });

  it('is applied to the rail', () => {
    expect(read('components', 'blog', 'table-of-contents.tsx')).toContain('toc-scroll');
  });
});
