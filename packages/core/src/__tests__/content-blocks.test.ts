import { describe, expect, it } from 'vitest';

import { ctaMarker, ctaSlugsIn, splitBodyIntoBlocks } from '../content-blocks';
import { sanitizePostHtml } from '../sanitize';

describe('the CTA marker survives sanitisation', () => {
  /*
   * The single most important test in this file. The marker is written by the
   * editor and sanitised on save; if `sanitizePostHtml` strips it, the block
   * silently never appears and the author sees exactly what they would see if
   * they had never inserted it.
   */
  it('round-trips through sanitizePostHtml', () => {
    const body = `<p>Before</p>${ctaMarker('blended-rate-calculator')}<p>After</p>`;
    const clean = sanitizePostHtml(body);

    expect(clean).toContain('data-cta="blended-rate-calculator"');
    expect(splitBodyIntoBlocks(clean).map((s) => s.kind)).toEqual([
      'html',
      'cta',
      'html',
    ]);
  });

  it('does not let other data-* attributes through on the way', () => {
    // The allowance is one attribute on one tag, not `data-*` across posts —
    // a WordPress export is full of tracking and framework hooks.
    const clean = sanitizePostHtml(
      '<div data-cta="x" data-track="pixel" data-analytics="1"></div>',
    );
    expect(clean).toContain('data-cta');
    expect(clean).not.toContain('data-track');
    expect(clean).not.toContain('data-analytics');
  });
});

describe('splitBodyIntoBlocks', () => {
  it('returns one html segment when there are no markers', () => {
    expect(splitBodyIntoBlocks('<p>Just prose</p>')).toEqual([
      { kind: 'html', html: '<p>Just prose</p>' },
    ]);
  });

  it('handles a marker at the very start and the very end', () => {
    const segments = splitBodyIntoBlocks(
      `${ctaMarker('top')}<p>Body</p>${ctaMarker('bottom')}`,
    );
    expect(segments).toEqual([
      { kind: 'cta', slug: 'top' },
      { kind: 'html', html: '<p>Body</p>' },
      { kind: 'cta', slug: 'bottom' },
    ]);
  });

  it('drops the empty run between two adjacent markers', () => {
    // Otherwise this renders a div containing nothing, with a key to chase.
    const segments = splitBodyIntoBlocks(`${ctaMarker('a')}\n${ctaMarker('b')}`);
    expect(segments).toEqual([
      { kind: 'cta', slug: 'a' },
      { kind: 'cta', slug: 'b' },
    ]);
  });

  it('keeps several markers in document order', () => {
    const segments = splitBodyIntoBlocks(
      `<p>1</p>${ctaMarker('a')}<p>2</p>${ctaMarker('b')}<p>3</p>`,
    );
    expect(segments.map((s) => (s.kind === 'cta' ? s.slug : s.html))).toEqual([
      '<p>1</p>',
      'a',
      '<p>2</p>',
      'b',
      '<p>3</p>',
    ]);
  });

  it('ignores a div that is not a marker', () => {
    const html = '<div class="note">Not a CTA</div>';
    expect(splitBodyIntoBlocks(html)).toEqual([{ kind: 'html', html }]);
  });

  it('ignores a marker carrying a slug the database could never hold', () => {
    // `lead_magnets_slug_format` is ^[a-z0-9]+(-[a-z0-9]+)*$. Anything else is
    // not a block reference, so it stays in the prose rather than becoming a
    // lookup that cannot succeed.
    for (const bad of ['Has Space', 'UPPER', '--leading', 'trailing-', 'sl/ash']) {
      const html = `<div data-cta="${bad}"></div>`;
      expect(splitBodyIntoBlocks(html)).toEqual([{ kind: 'html', html }]);
    }
  });

  it('is not corrupted by being called twice', () => {
    // A module-level /g regex keeps `lastIndex` between calls unless it is used
    // with matchAll. The symptom would be the SECOND post on a page losing its
    // blocks, which is not a thing anyone would guess at.
    const html = `<p>a</p>${ctaMarker('x')}<p>b</p>`;
    expect(splitBodyIntoBlocks(html)).toEqual(splitBodyIntoBlocks(html));
  });

  it('returns nothing for an empty body', () => {
    expect(splitBodyIntoBlocks('')).toEqual([]);
  });
});

describe('ctaSlugsIn', () => {
  it('lists each slug once, in first-appearance order', () => {
    const html = `${ctaMarker('b')}<p>x</p>${ctaMarker('a')}<p>y</p>${ctaMarker('b')}`;
    expect(ctaSlugsIn(html)).toEqual(['b', 'a']);
  });

  it('is empty for a body with no blocks', () => {
    expect(ctaSlugsIn('<p>nothing</p>')).toEqual([]);
  });
});
