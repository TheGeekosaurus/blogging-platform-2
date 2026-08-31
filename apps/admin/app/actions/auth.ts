'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export interface AuthFormState {
  error?: string;
}

/**
 * Sign in with email and password.
 *
 * Deliberately NOT a magic link. A magic link makes the only route into the
 * admin depend on an email arriving, and Supabase's built-in sender is
 * explicitly test-grade — rate-limited, no delivery guarantee. One dropped
 * message would lock the owner out with no fallback.
 *
 * There is no sign-up path anywhere in this app. Accounts are created in the
 * Supabase dashboard (Authentication → Users → Add user) or by SQL. Note that
 * password auth still requires the Email PROVIDER to be enabled in Supabase;
 * it is "Allow new users to sign up" that must be off.
 */
export async function signIn(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get('email') ?? '').trim();
  // Not trimmed: leading or trailing whitespace is a legitimate part of a
  // password, and silently stripping it would reject a correct one.
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Enter your email and password.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: describeAuthError(error.message) };
  }

  redirect('/posts');
}

/**
 * Supabase's auth errors are either a configuration problem the operator can
 * fix, or a failed credential check that must stay vague.
 */
function describeAuthError(message: string): string {
  // Hit during setup: turning off "signups" in Supabase is easy to confuse with
  // turning off the Email provider, which disables password login too.
  if (/email logins are disabled/i.test(message)) {
    return (
      'Email logins are turned off in Supabase. Enable the Email provider under ' +
      'Authentication → Sign In / Providers → Email, and leave ' +
      '"Allow new users to sign up" switched off.'
    );
  }

  if (/email not confirmed/i.test(message)) {
    return (
      'That account exists but is not confirmed. In Supabase → Authentication → ' +
      'Users, edit the user and confirm their email.'
    );
  }

  // Covers both a wrong password and an address with no account. Kept
  // indistinguishable on purpose: a more specific message would let anyone
  // test whether a given address has an account here.
  if (/invalid login credentials/i.test(message)) {
    return 'That email and password combination is not correct.';
  }

  return message;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
