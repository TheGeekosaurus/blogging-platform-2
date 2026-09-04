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
        // See the blog project below for why this is `oxc` and not `esbuild`.
        oxc: { jsx: 'automatic' },
        test: {
          name: 'admin',
          include: ['apps/admin/__tests__/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        resolve: { alias: { '@': path.resolve(import.meta.dirname, 'apps/blog') } },
        /*
         * Needed to import any .tsx component at all, not just to write JSX in
         * a test: Next sets `jsx: "preserve"` in tsconfig, so without this the
         * JSON-LD test cannot even load the component it renders.
         *
         * `oxc`, not `esbuild` — Vite 8 transforms with oxc, and the esbuild
         * key is silently ignored here rather than erroring.
         */
        oxc: { jsx: 'automatic' },
        test: {
          name: 'blog',
          include: ['apps/blog/__tests__/**/*.test.ts'],
          environment: 'node',
        },
      },
    ],
  },
});
