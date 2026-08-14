import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

/**
 * Load environment variables from the repo root.
 *
 * `.env.local` wins over `.env`, matching Next.js's precedence so there is one
 * place to put credentials for both the apps and this CLI.
 */
export function loadEnv(): void {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(here, '../../..');

  for (const name of ['.env.local', '.env']) {
    const file = path.join(repoRoot, name);
    if (existsSync(file)) {
      dotenv.config({ path: file, quiet: true });
    }
  }
}
