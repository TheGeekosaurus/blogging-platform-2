import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from './database.types';
import { supabaseAnonKey, supabaseServiceRoleKey, supabaseUrl } from './env';

export type Client = SupabaseClient<Database>;

/**
 * Read-only client for the public blog.
 *
 * Uses the anon key, so every query is filtered by the RLS policies in
 * 0002_rls.sql — unpublished posts are unreachable even if a slug is guessed.
 * No session persistence: there is no user here, and writing to storage from a
 * build-time render would be meaningless.
 */
export function createPublicClient(): Client {
  return createClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Full-access client that BYPASSES row level security.
 *
 * Only for tools/wp-import, run locally. Never construct this in a deployed app.
 */
export function createServiceClient(): Client {
  return createClient<Database>(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
