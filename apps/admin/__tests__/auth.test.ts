import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Sign-in is the only door into the admin, so its failure modes matter:
 * a config error should say what to fix, and a bad credential should say
 * nothing useful to someone probing for accounts.
 */

const signInWithPassword = vi.fn();
const redirect = vi.fn((_path: string): never => {
  // The real next/navigation redirect throws to halt the action.
  throw new Error('NEXT_REDIRECT');
});

vi.mock('next/navigation', () => ({ redirect: (path: string) => redirect(path) }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      signInWithPassword: (creds: { email: string; password: string }) =>
        signInWithPassword(creds),
      signOut: async () => ({ error: null }),
    },
  }),
}));

const { signIn } = await import('../app/actions/auth');

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

/** signIn() redirects on success, which throws; treat that as "signed in". */
async function attempt(fields: Record<string, string>) {
  try {
    return { state: await signIn({}, form(fields)), redirected: false };
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      return { state: {}, redirected: true };
    }
    throw error;
  }
}

beforeEach(() => {
  signInWithPassword.mockReset();
  redirect.mockClear();
  signInWithPassword.mockResolvedValue({ error: null });
});

describe('signIn — input handling', () => {
  it('rejects a missing password without calling Supabase', async () => {
    const { state } = await attempt({ email: 'a@b.test' });
    expect(state.error).toBeTruthy();
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it('rejects a missing email without calling Supabase', async () => {
    const { state } = await attempt({ password: 'hunter2' });
    expect(state.error).toBeTruthy();
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it('trims the email but never the password', async () => {
    // Whitespace can be a real part of a password; stripping it would reject a
    // correct one.
    await attempt({ email: '  a@b.test  ', password: '  spaced  ' });

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.test',
      password: '  spaced  ',
    });
  });

  it('passes the password through byte for byte', async () => {
    const password = 'Pä$$ word\\with"quotes\'and€';
    await attempt({ email: 'a@b.test', password });

    expect(signInWithPassword.mock.calls[0]?.[0].password).toBe(password);
  });
});

describe('signIn — outcomes', () => {
  it('redirects to the posts list on success', async () => {
    const { redirected } = await attempt({ email: 'a@b.test', password: 'ok' });

    expect(redirected).toBe(true);
    expect(redirect).toHaveBeenCalledWith('/posts');
  });

  it('does not redirect when the credentials are rejected', async () => {
    signInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    });

    const { state, redirected } = await attempt({ email: 'a@b.test', password: 'wrong' });

    expect(redirected).toBe(false);
    expect(state.error).toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('keeps a failed credential check vague, revealing nothing about the account', async () => {
    signInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    });

    const { state } = await attempt({ email: 'a@b.test', password: 'wrong' });

    // Must not hint at whether the address has an account.
    expect(state.error).not.toMatch(/no such|not found|unknown user|does not exist/i);
    expect(state.error).toBe('That email and password combination is not correct.');
  });

  it('turns the disabled-provider error into the exact toggle to fix', async () => {
    signInWithPassword.mockResolvedValue({
      error: { message: 'Email logins are disabled' },
    });

    const { state } = await attempt({ email: 'a@b.test', password: 'ok' });

    expect(state.error).toMatch(/Email provider/i);
    expect(state.error).toMatch(/Allow new users to sign up/i);
  });

  it('explains an unconfirmed account', async () => {
    signInWithPassword.mockResolvedValue({
      error: { message: 'Email not confirmed' },
    });

    const { state } = await attempt({ email: 'a@b.test', password: 'ok' });

    expect(state.error).toMatch(/not confirmed/i);
    expect(state.error).toMatch(/Authentication/i);
  });

  it('passes an unrecognised error through rather than swallowing it', async () => {
    signInWithPassword.mockResolvedValue({
      error: { message: 'Some unexpected upstream failure' },
    });

    const { state } = await attempt({ email: 'a@b.test', password: 'ok' });

    expect(state.error).toBe('Some unexpected upstream failure');
  });
});
