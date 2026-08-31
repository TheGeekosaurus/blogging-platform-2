'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export interface AuthFormState {
  error?: string;
  sent?: boolean;
}

/**
 * Request a magic link.
 *
 * Signups are disabled in the Supabase dashboard, so this only succeeds for an
 * address that has already been invited. `shouldCreateUser: false` makes that
 * explicit in code as well, rather than relying solely on project config.
 */
export async function requestMagicLink(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get('email') ?? '').trim();

  if (!email) {
    return { error: 'Enter your email address.' };
  }

  const origin = process.env.ADMIN_URL ?? 'http://localhost:3001';
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${origin.replace(/\/+$/, '')}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Deliberately does not distinguish "sent" from "no such user": saying which
  // would let anyone probe for valid addresses.
  return { sent: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
