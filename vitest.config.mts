import path from 'node:path';

import { defineConfig } from 'vitest/config';

/**
 * Per-app projects rather than one flat include list.
 *
 * Both Next apps use `@/` to mean their own root, so a single shared alias would
 * have to pick one of them and would silently resolve the other app's imports to
 * the wrong directory. Scoping the alias per project keeps them honest.
 */
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'core',
          include: ['packages/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'wp-import',
          include: ['tools/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        resolve: { alias: { '@': path.resolve(import.meta.dirname, 'apps/admin') } },
        test: {
          name: 'admin',
          include: ['apps/admin/__tests__/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        resolve: { alias: { '@': path.resolve(import.meta.dirname, 'apps/blog') } },
        test: {
          name: 'blog',
          include: ['apps/blog/__tests__/**/*.test.ts'],
          environment: 'node',
        },
      },
    ],
  },
});
