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
    /*
     * The builder moved to packages/core/src/structured-data.ts so the admin
     * could describe what it emits and a test could parse it. The guard
     * follows the code: what matters is that ONE call feeds the
     * BreadcrumbList, wherever that call lives.
     */
    const source = readFileSync(
      join(__dirname, '..', '..', '..', 'packages', 'core', 'src', 'structured-data.ts'),
      'utf8',
    );

    /*
     * Scoped to the builder, not the whole file. SCHEMA_TEMPLATES further down
     * contains a hand-written BreadcrumbList with literal positions on
     * purpose — it is a starting point an author edits, for a page whose trail
     * this code cannot know. Only GENERATED output has to come from the shared
     * call.
     */
    const builder = source.slice(
      source.indexOf('export function buildPostSchemas'),
      source.indexOf('export const AUTO_POST_SCHEMAS'),
    );
    expect(builder.length).toBeGreaterThan(200);

    expect(builder).toContain('postBreadcrumbs(site, post, category)');
    // The old hand-rolled positions must not come back.
    expect(stripComments(builder)).not.toMatch(/position:\s*\d/);
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

  it('draws no vertical rule, now that the sidebar is a bordered panel', () => {
    /*
     * The frame used to close on the left with a full-height column rule. The
     * sidebar carries its own outline since it became one panel, and a panel
     * border a gutter away from a divider reads as a mistake rather than as a
     * frame — so the rule went and the bottom stroke closes it instead.
     *
     * Asserted as an absence because the failure mode is re-introduction:
     * "put the divider back" is a one-word change, and the doubled line it
     * produces is the kind of thing only a screenshot catches.
     */
    expect(page).not.toContain('lg:border-l');
    expect(page).not.toContain('lg:border-r');

    // The panel's own outline, which is what replaced it.
    expect(read('components', 'blog', 'post-aside.tsx')).toContain(
      'border border-[var(--color-line)]',
    );
  });

  it('closes the frame at the bottom on the section itself', () => {
    // Not left to SimilarPosts: a post with no related posts renders none of
    // it, and the vertical rule would then end on nothing.
    expect(page).toContain('post-frame border-b border-[var(--color-line)]');
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

  it('draws the four frame strokes in --color-line, not the accent', () => {
    /*
     * These were gold on dark and copper on light for exactly one revision.
     * Denis's call to revert: picking the frame out in a bright hue turned a
     * set of dividers into a drawn box — "highlight makes it too boxy".
     *
     * Asserted as an ABSENCE as well as a presence, because the failure mode
     * is a re-introduction. Someone reaching for "make the frame stand out"
     * lands on --color-accent again, and nothing else on the page would
     * complain.
     */
    expect(page).toContain('post-frame border-b border-[var(--color-line)]');
    expect(page).toContain('border-y border-[var(--color-line)]');
    // Static borders only. `hover:border-[var(--color-accent)]` on the tag
    // pills stays: a border that turns gold under the cursor is feedback, and
    // it is the resting state that was making the page look boxy.
    expect(stripComments(page)).not.toMatch(/(?<!hover:)border-\[var\(--color-accent\)\]/);

    // The intro rule inherits --color-line from the base .post-body rule. The
    // override that re-pointed it is gone rather than restated, so there is
    // one declaration of that colour and not two.
    expect(css).toMatch(/\.post-body > h2:nth-of-type\(2\) \{\s*border-top: 1px solid var\(--color-line\)/);
    expect(css).not.toMatch(/border-top-color: var\(--color-accent\)/);
  });

  it('keeps the accent for things that should draw the eye', () => {
    // Reverting the frame is not a ban on the colour. Links, list markers and
    // a card's category label still earn it — that is where a highlight reads
    // as emphasis rather than as a box.
    expect(css).toMatch(/\.post-body a[\s\S]{0,200}color: var\(--color-accent\)/);
    expect(read('components', 'blog', 'similar-posts.tsx')).toContain(
      '!text-[var(--color-accent)]',
    );
  });

  it('leaves the rest of the page on --color-line', () => {
    // Cards, pills, the author box and the contents rail were never part of
    // the frame, and are now the same colour as it.
    expect(read('components', 'blog', 'author-box.tsx')).toContain(
      'border border-[var(--color-line)]',
    );
    expect(read('components', 'blog', 'similar-posts.tsx')).toContain(
      'border-t border-[var(--color-line)]',
    );
  });

  it('calls the related row Articles, not News', () => {
    const similar = read('components', 'blog', 'similar-posts.tsx');

    expect(similar).toContain('Similar Articles');
    expect(similar).toContain('View All Articles');
    expect(similar).not.toContain('News');
  });

  it('puts the sidebar on the left without moving it up the markup', () => {
    /*
     * Visual order only. The article stays FIRST in the DOM, which is what
     * decides the stacked order below `lg`, the reading order for a screen
     * reader, and what a crawler sees first — none of which should be spent on
     * moving a contents list and two buttons 350px to the left.
     */
    expect(page).toContain('lg:flex-row-reverse');
    expect(page).toMatch(/<div className="min-w-0 flex-1[\s\S]*?<PostAside/);
  });

  it('separates the columns with one gutter, on the article', () => {
    /*
     * One rather than two. The old arrangement paid --frame-gutter twice — the
     * article's right padding and the rail's left padding, with the column rule
     * between them. With no rule to hold clear of, the sidebar sits flush in
     * its column and only the article pads itself.
     *
     * A `gap` on the row would do the same job here, and is still not used:
     * the horizontal rules below bleed back out over this padding, which a gap
     * holds them away from.
     */
    expect(page).not.toContain('lg:gap-12');
    expect(page).toContain('lg:pl-[var(--frame-gutter)]');
    expect(page).not.toContain('lg:pr-[var(--frame-gutter)]');
    expect(css).toContain('margin-right: calc(-1 * var(--rule-bleed-end))');
  });

  it('stops the rules at the article column rather than under the panel', () => {
    /*
     * The two ends stopped agreeing when the sidebar changed sides. The right
     * still runs to the screen edge; the left has to stop dead at the column,
     * or a byline rule runs 350px across the panel beside it.
     *
     * Two variables rather than one is the point: a single --page-bleed on both
     * ends would have made that a silent stroke across the panel instead of a
     * declaration someone has to change.
     */
    expect(css).toContain('--frame-gutter: 3rem');
    expect(css).toContain('--rule-bleed-start: var(--page-bleed)');
    expect(css).toContain('--rule-bleed-start: 0px');
    expect(css).toContain('--rule-bleed-end: var(--page-bleed)');
    // A literal would be a second source of truth for the same distance.
    expect(page).not.toContain('lg:pl-12');
  });

  it('pads the columns, not the row, so both span the full section height', () => {
    // Padding on the row stops the columns short of the header and the bottom
    // line — which no border placement can recover.
    expect(page).toContain('min-w-0 flex-1 py-12 lg:py-16');
  });

  it('runs the horizontal rules out to the screen edge', () => {
    expect(page).toContain('post-rule mt-6 border-y');
    expect(css).toContain('.post-rule,');
    expect(css).toContain('margin-left: calc(-1 * var(--rule-bleed-start))');
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
