import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import type { Database } from '@blog/core';

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 *
 * Acts as the SIGNED-IN USER, not as anon and not as service role, so every
 * read and write is filtered by the RLS policies in 0002_rls.sql. Authorization
 * is therefore enforced by the database rather than only by this app's routing.
 *
 * Deliberately not `packages/core`'s createPublicClient(), which is anon and
 * session-less by design for the public blog.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot set cookies. Harmless here: proxy.ts
            // refreshes the session on every request, so the write it could not
            // perform has already happened upstream.
          }
        },
      },
    },
  );
}

/**
 * The authenticated user, or null.
 *
 * Uses getUser(), never getSession(). getSession() reads the cookie without
 * verifying it against the auth server, so it must never gate access — a forged
 * cookie would satisfy it.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
