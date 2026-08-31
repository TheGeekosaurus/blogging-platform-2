/**
 * Environment access.
 *
 * Note the naming: the public blog reads Supabase with server-only variable
 * names (`SUPABASE_URL`, not `NEXT_PUBLIC_SUPABASE_URL`) because it never touches
 * the database from the browser. Keeping the `NEXT_PUBLIC_` prefix off them means
 * an accidental client-side import fails loudly at build time instead of quietly
 * inlining credentials into a bundle.
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
