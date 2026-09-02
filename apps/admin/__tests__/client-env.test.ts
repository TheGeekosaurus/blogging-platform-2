import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * No client component may import a binding that reads a server-only env var.
 *
 * This exists because of a real bug. `featured-image-picker.tsx` was a
 * `'use client'` component that called `mediaPublicUrl()`, which calls
 * `supabaseUrl()` → `required('SUPABASE_URL')`. That name has no NEXT_PUBLIC_
 * prefix, so Next never inlines it into the browser bundle: `required()` threw
 * in the browser and React tore the page down — "Application error, reload or go
 * back", with no stack trace for the person using it.
 *
 * It typechecked. It built. It only failed on a specific click, because the call
 * sat behind a condition (an image being selected), so nothing evaluated it
 * until then. A comment in packages/core/src/env.ts claimed this naming makes an
 * accidental client import "fail loudly at build time" — it does not, and that
 * is precisely why a test has to.
 *
 * Server-side callers are unaffected: the fix is to build URLs where the
 * variable exists and pass them down as data.
 */
const ADMIN = join(__dirname, '..');
const SKIP = new Set(['node_modules', '.next', '__tests__', '.turbo']);

/** Anything in @blog/core that reaches process.env, directly or transitively. */
const SERVER_ONLY = [
  'supabaseUrl',
  'supabaseAnonKey',
  'supabaseServiceRoleKey',
  'siteSlug',
  'mediaPublicUrl',
  'supabaseHostname',
  'createPublicClient',
  'createServiceRoleClient',
];

function sourceFiles(dir: string): string[] {
  const out: string[] = [];

  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);

    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }

  return out;
}

const clientFiles = sourceFiles(ADMIN)
  .map((path) => ({ path, source: readFileSync(path, 'utf8') }))
  .filter(({ source }) => /^\s*['"]use client['"]/.test(source));

describe('client components and server-only environment', () => {
  it('finds client components to check', () => {
    // A rename or move that silently emptied this list would make every
    // assertion below vacuous.
    expect(clientFiles.length).toBeGreaterThan(5);
  });

  it.each(SERVER_ONLY)('no client component imports %s', (name) => {
    const offenders = clientFiles
      .filter(({ source }) => {
        const imports = source.match(/import[^;]*from\s*['"]@blog\/core['"]/g) ?? [];
        return imports.some((line) => new RegExp(`\\b${name}\\b`).test(line));
      })
      .map(({ path }) => path.replace(`${ADMIN}/`, ''));

    expect(offenders, `${name} would throw in the browser`).toEqual([]);
  });

  it('the image picker builds no URLs of its own', () => {
    const picker = readFileSync(
      join(ADMIN, 'components', 'editor', 'media-picker.tsx'),
      'utf8',
    );

    // Strip comments: the component's own docstring names @blog/core while
    // explaining why it must not import from it.
    const code = picker
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
      .replace(/\/\/.*$/gm, '');

    expect(code).not.toContain('@blog/core');
    // URLs arrive pre-built from listMediaOptions / uploadImage instead.
    expect(code).toContain('item.url');
  });
});
