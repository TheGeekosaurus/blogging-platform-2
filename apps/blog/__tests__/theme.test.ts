import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { THEME_OPTIONS, THEME_SCRIPT, THEME_STORAGE_KEY } from '../lib/theme';

/**
 * The theme resolver has to run before the first paint.
 *
 * If it becomes external, deferred, or a module, it runs after paint instead and
 * every load shows a flash of the wrong theme. Nothing errors, no test fails,
 * no build warns — it just looks broken to the reader, which is why the shape of
 * the tag is asserted here.
 */
const LAYOUT = readFileSync(join(__dirname, '..', 'app', 'layout.tsx'), 'utf8');

const head = LAYOUT.slice(LAYOUT.indexOf('<head>'), LAYOUT.indexOf('</head>'));

describe('the resolver script', () => {
  it('is rendered inside <head>', () => {
    expect(head).toContain('THEME_SCRIPT');
  });

  it('is inline, not a fetched file', () => {
    const tag = LAYOUT.match(/<script[^>]*THEME_SCRIPT[^>]*\/>/)?.[0] ?? '';
    expect(tag).toContain('dangerouslySetInnerHTML');
    expect(tag).not.toMatch(/\bsrc=/);
  });

  it('is not deferred past first paint', () => {
    const tag = LAYOUT.match(/<script[^>]*THEME_SCRIPT[^>]*\/>/)?.[0] ?? '';
    expect(tag).not.toMatch(/\bdefer\b/);
    expect(tag).not.toMatch(/\basync\b/);
    expect(tag).not.toMatch(/type=["']module["']/);
  });
});

describe('the script body', () => {
  it('writes a concrete theme, never the word "system"', () => {
    // The CSS has a single [data-theme='dark'] block precisely because the
    // script resolves 'system' itself. Writing 'system' through would leave the
    // page on the light base with no dark path at all.
    expect(THEME_SCRIPT).toContain("'dark'");
    expect(THEME_SCRIPT).toContain("'light'");
    expect(THEME_SCRIPT).toContain('setAttribute');
    expect(THEME_SCRIPT).not.toMatch(/setAttribute\([^)]*system/);
  });

  it('consults the OS preference when nothing is stored', () => {
    expect(THEME_SCRIPT).toContain('prefers-color-scheme: dark');
  });

  it('survives localStorage throwing, which it does when cookies are blocked', () => {
    expect(THEME_SCRIPT).toContain('try');
    expect(THEME_SCRIPT).toContain('catch');
  });

  it('uses the same storage key the toggle writes', () => {
    expect(THEME_SCRIPT).toContain(THEME_STORAGE_KEY);
  });

  it('runs immediately rather than waiting for an event', () => {
    // A DOMContentLoaded or load listener would put it after first paint.
    expect(THEME_SCRIPT).not.toContain('addEventListener');
  });
});

describe('the offered options', () => {
  it('are exactly system, light and dark', () => {
    expect(THEME_OPTIONS.map((o) => o.value)).toEqual(['system', 'light', 'dark']);
  });

  it('default to system, so a reader who has stated an OS preference is obeyed', () => {
    expect(THEME_OPTIONS[0]?.value).toBe('system');
  });
});
