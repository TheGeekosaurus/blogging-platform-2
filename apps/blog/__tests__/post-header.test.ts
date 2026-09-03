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

  it('is applied to the list that actually scrolls', () => {
    expect(read('components', 'blog', 'table-of-contents.tsx')).toContain(
      'toc-scroll min-h-0 flex-1 overflow-y-auto',
    );
  });
});

/*
 * The related-post cards were handed a map built from the CURRENT post's
 * category for every entry, so all three showed the same one whatever they
 * were filed under. It was invisible for two reasons worth recording: the
 * label was small print, and the fixture gave every post the same category, so
 * a browser check could not tell right from wrong.
 */
describe('related-post cards read their own data', () => {
  const source = stripComments(read('components', 'blog', 'similar-posts.tsx'));
  const page = stripComments(read('app', 'blog', '[slug]', 'page.tsx'));

  it('takes each card category from the card, not from a passed-in map', () => {
    expect(source).toContain('post.categories[0]');
    expect(source).not.toContain('categoryFor');
  });

  it('no longer builds that map on the page', () => {
    expect(page).not.toContain('primaryCategoryFor');
  });

  it('shows the last-edited date, matching the post header', () => {
    expect(source).toContain('post.updated_at');
    expect(source).not.toContain('post.published_at');
  });

  it('resolves the author through the shared resolver', () => {
    // So a card shows the record where one is attached and the text where not.
    expect(source).toContain('postAuthorName(post)');
  });
});

describe('the author box only appears with an author record', () => {
  const page = stripComments(read('app', 'blog', '[slug]', 'page.tsx'));
  const box = stripComments(read('components', 'blog', 'author-box.tsx'));

  it('is gated on the record, not on the byline text', () => {
    // A box with one name, an empty photo frame and no bio advertises missing
    // data rather than earning trust — which is what imported posts would get.
    expect(page).toContain('{post.byline ? <AuthorBox byline={post.byline} /> : null}');
  });

  it('filters social URLs again at render, not only on save', () => {
    // Last gate before a stored value becomes an href, and the admin is not
    // the only way a row can be written.
    expect(box).toContain('socialLinks(byline.social)');
  });

  it('opens social links safely', () => {
    expect(box).toContain('noopener noreferrer');
  });
});

/*
 * The dividers have to CONNECT — the design frames the section rather than
 * scattering rules in it. Every one of these guards a way the strokes drift
 * apart again, and each failure looks like "the lines have gaps", which is
 * exactly how it was reported the first time.
 */
describe('the Figma dividers', () => {
  const css = read('app', 'globals.css');
  const page = read('app', 'blog', '[slug]', 'page.tsx');

  it('rules the SECOND h2, closing the intro after Key Takeaways', () => {
    expect(css).toContain('.post-body > h2:nth-of-type(2)');
  });

  it('scopes that to direct children', () => {
    // Without `>`, an h2 inside a wrapper div — which WordPress imports
    // produce — restarts nth-of-type and draws several rules instead of one.
    expect(css).not.toMatch(/\.post-body h2:nth-of-type/);
  });

  it('puts the vertical rule on the sidebar', () => {
    expect(page).toContain('lg:border-l');
  });

  it('closes the frame at the bottom on the section itself', () => {
    // Not left to SimilarPosts: a post with no related posts renders none of
    // it, and the vertical rule would then end on nothing.
    expect(page).toContain('post-frame border-b border-[var(--color-accent)]');
  });

  it('does not let SimilarPosts draw that line a second time', () => {
    /*
     * Its own `border-t` used to be the post-foot rule. With the frame closing
     * itself the two sit 1px apart and read as one 2px stroke — the same
     * doubled-rule bug as the inset version before it, tight enough that only
     * a measurement caught it. The cards keep their internal border-t.
     */
    const similar = read('components', 'blog', 'similar-posts.tsx');
    expect(similar).toContain('<section aria-labelledby="similar-heading">');
    expect(stripComments(similar)).not.toMatch(
      /aria-labelledby="similar-heading"[\s\S]{0,120}border-t/,
    );
  });

  it('draws the four frame strokes in the accent colour', () => {
    // Denis's ask: gold on the dark ground, copper on the light one. Both come
    // from --color-accent, which the two palettes already re-point.
    expect(page).toContain('post-frame border-b border-[var(--color-accent)]');
    expect(page).toContain('border-y border-[var(--color-accent)]');
    expect(page).toContain('lg:border-l lg:border-[var(--color-accent)]');
    expect(css).toMatch(
      /\.post-frame \.post-body > h2:nth-of-type\(2\) \{\s*border-top-color: var\(--color-accent\)/,
    );
  });

  it('leaves the rest of the page on --color-line', () => {
    // A page where every border is gold reads as a wireframe. Cards, pills,
    // the author box and the contents rail are deliberately not part of it.
    expect(read('components', 'blog', 'author-box.tsx')).toContain(
      'border border-[var(--color-line)]',
    );
    expect(read('components', 'blog', 'similar-posts.tsx')).toContain(
      'border-t border-[var(--color-line)]',
    );
  });

  it('carries the vertical rule on a stretching wrapper, not the sticky box', () => {
    /*
     * The rule used to sit on the <aside>, which is sticky, `self-start` and
     * `max-h`-bounded — all three of which mean "as tall as my own content".
     * So it was as long as the contents list and no longer, whatever the
     * section's height. `self-start` in particular is an explicit opt-out of
     * stretching, so this cannot be fixed by border placement alone.
     */
    expect(page).not.toContain('lg:self-start');
    expect(page).toMatch(/lg:border-l[\s\S]{0,200}<aside/);
  });

  it('leaves no gap between the article column and the divider', () => {
    // A `gap` on the row holds every child of the article column short of the
    // rule. The gutter is the sidebar wrapper's padding instead.
    expect(page).not.toContain('lg:gap-12');
    expect(page).toContain('lg:pl-12');
  });

  it('pads the columns, not the row, so both span the full section height', () => {
    // Padding on the row stops the columns short of the header and the bottom
    // line — which no border placement can recover.
    expect(page).toContain('min-w-0 flex-1 py-12 lg:py-16');
  });

  it('runs the horizontal rules out to the left screen edge', () => {
    expect(page).toContain('post-rule mt-6 border-y');
    expect(css).toContain('.post-rule,');
    expect(css).toContain('margin-left: calc(-1 * var(--page-bleed))');
  });

  it('measures the container for that break-out, not the element', () => {
    /*
     * `calc(50% - 50vw)` — the usual full-bleed trick — assumes the element is
     * centred in the viewport. These rules live in the LEFT column of a
     * two-column row, so it would start them somewhere mid-page. The offset is
     * the page padding plus half the viewport's excess over the container.
     */
    expect(css).toContain('--page-bleed: calc(2rem + max(0px, (100vw - 80rem) / 2))');
    expect(css).not.toMatch(/\.post-rule[\s\S]{0,200}50% - 50vw/);
  });

  it('caps the reading measure on the prose children, not the container', () => {
    // `max-w-[68ch]` on .post-body capped the h2 too, and with it the rule
    // drawn above it — which is why that line was short.
    expect(page).not.toContain('post-body max-w-[68ch]');
    expect(css).toContain('.blog-surface .post-body > :is(p, ul, ol, blockquote, figure, h3, h4, dl)');
    expect(css).toContain('max-width: 68ch');
  });
});
