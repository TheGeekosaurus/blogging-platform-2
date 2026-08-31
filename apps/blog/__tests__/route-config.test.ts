import { readFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * A guard, not a unit test.
 *
 * `export const dynamicParams = false` on a route with dynamic params limits it
 * to the params generateStaticParams returned at BUILD time. Any post published
 * since the last deploy then 404s permanently, and flushing the cache does not
 * help — publishing appears to work while the post is unreachable.
 *
 * That shipped and had to be caught in production. It cannot be caught by a
 * normal test because it is framework configuration, not code that runs here —
 * so this asserts on the source text instead. Crude, but it would have caught it.
 */

const APP_DIR = path.join(import.meta.dirname, '..', 'app');

async function routeFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return routeFiles(full);
      return /\.(tsx?|ts)$/.test(entry.name) ? [full] : [];
    }),
  );
  return files.flat();
}

describe('public route segment config', () => {
  it('never sets dynamicParams = false on a route with dynamic params', async () => {
    const files = await routeFiles(APP_DIR);
    const offenders = files.filter((file) => {
      // Only [param] routes are affected; a paramless route has no params to gate.
      if (!/\[[^\]]+\]/.test(file)) return false;
      return /export\s+const\s+dynamicParams\s*=\s*false/.test(readFileSync(file, 'utf8'));
    });

    expect(
      offenders.map((f) => path.relative(APP_DIR, f)),
      'dynamicParams=false makes content published after the last deploy unreachable',
    ).toEqual([]);
  });

  it('keeps every dynamic-param route on the on-demand-capable default', async () => {
    const files = await routeFiles(APP_DIR);
    const paramRoutes = files.filter(
      (file) => /\[[^\]]+\]/.test(file) && /page\.tsx$|opengraph-image\.tsx$/.test(file),
    );

    // Sanity: if this finds nothing, the glob is wrong and the guard above is vacuous.
    expect(paramRoutes.length).toBeGreaterThan(0);

    for (const file of paramRoutes) {
      const source = readFileSync(file, 'utf8');
      expect(source, `${path.relative(APP_DIR, file)} must not pin dynamicParams`).not.toMatch(
        /export\s+const\s+dynamicParams/,
      );
    }
  });
});
