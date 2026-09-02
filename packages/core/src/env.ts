/**
 * Environment access.
 *
 * Note the naming: the public blog reads Supabase with server-only variable
 * names (`SUPABASE_URL`, not `NEXT_PUBLIC_SUPABASE_URL`) because it never touches
 * the database from the browser. Keeping the `NEXT_PUBLIC_` prefix off them means
 * credentials are never inlined into a bundle.
 *
 * This comment used to also claim an accidental client-side import "fails loudly
 * at build time". That is false, and the admin's image picker proved it: it
 * imported `mediaPublicUrl` (which calls `supabaseUrl()` below) into a
 * `'use client'` component. It typechecked, it built, and it threw in the user's
 * browser the moment a condition made the call reachable — an unexplained
 * "Application error" screen mid-edit.
 *
 * The failure is real but it is a RUNTIME one, in the browser, on whatever click
 * happens to reach the call. `apps/admin/__tests__/client-env.test.ts` is what
 * actually catches it.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

export function supabaseUrl(): string {
  return required('SUPABASE_URL');
}

export function supabaseAnonKey(): string {
  return required('SUPABASE_ANON_KEY');
}

/**
 * Service-role key. Bypasses RLS entirely — only the local import CLI should
 * ever call this. It must never be set on a deployed blog project.
 */
export function supabaseServiceRoleKey(): string {
  return required('SUPABASE_SERVICE_ROLE_KEY');
}

/** Which site this blog deployment serves. Set per Vercel project. */
export function siteSlug(): string {
  return required('SITE_SLUG');
}
