import { describe, expect, it } from 'vitest';

import { GTM_CONTAINER_PATTERN, readGtmContainerId } from '../analytics';

/**
 * The container id is interpolated into an inline <script> on every page of
 * whichever site carries it, so this function is a security boundary and not
 * just input tidying. The renderer calls it; so does the admin's save action;
 * the database repeats the rule as a check constraint. These pin the shape all
 * three agree on.
 */

describe('readGtmContainerId', () => {
  it('accepts a real container id', () => {
    // The container the HighLevel site used, carried over to Nanotom Capital.
    expect(readGtmContainerId('GTM-W5D5NV8X')).toBe('GTM-W5D5NV8X');
  });

  it('treats an absent value as no tracking rather than an error', () => {
    // The common case on a site that is not live yet, and on every blog that
    // has never been given a container.
    expect(readGtmContainerId(null)).toBeNull();
    expect(readGtmContainerId(undefined)).toBeNull();
    expect(readGtmContainerId('')).toBeNull();
  });

  it('forgives whitespace and case, which a copy-paste introduces', () => {
    expect(readGtmContainerId('  GTM-W5D5NV8X  ')).toBe('GTM-W5D5NV8X');
    expect(readGtmContainerId('gtm-w5d5nv8x')).toBe('GTM-W5D5NV8X');
  });

  it('rejects an id that is merely wrong', () => {
    // A GA4 measurement id is the likeliest thing to be pasted in by mistake,
    // and it is not a container. Neither is the prefix on its own.
    for (const value of ['G-ABC123', 'UA-12345-1', 'GTM-', 'GTM', 'W5D5NV8X', 'GTM_ABC']) {
      expect(readGtmContainerId(value), value).toBeNull();
    }
  });

  /*
   * The reason this function exists rather than the value being used raw.
   *
   * Every string here ends the quoted argument in the GTM snippet and starts
   * writing page JavaScript. None of them can reach the renderer through the
   * admin or through the database constraint — this asserts they do not reach
   * it through here either, which is the last line and the only one a row
   * written by a future importer or a hand-run SQL statement passes.
   */
  it('rejects anything that could break out of the inline script', () => {
    const attacks = [
      "GTM-ABC123');alert(1);//",
      "GTM-ABC123'+alert(1)+'",
      'GTM-ABC123</script><script>alert(1)</script>',
      'GTM-ABC123"',
      'GTM-ABC123\n});alert(1);({',
      'GTM-ABC123 GTM-DEF456',
    ];

    for (const attack of attacks) {
      expect(readGtmContainerId(attack), attack).toBeNull();
    }
  });

  it('anchors the pattern at both ends', () => {
    // An unanchored version would pass every attack string above by matching
    // the GTM- prefix somewhere inside it.
    expect(GTM_CONTAINER_PATTERN.source.startsWith('^')).toBe(true);
    expect(GTM_CONTAINER_PATTERN.source.endsWith('$')).toBe(true);
  });
});
