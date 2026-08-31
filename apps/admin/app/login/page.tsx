'use client';

import { useActionState } from 'react';

import { signIn, type AuthFormState } from '@/app/actions/auth';

const INITIAL: AuthFormState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, INITIAL);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Blog admin</h1>
      <p className="mt-2 text-sm text-slate-600">
        Sign in to write and publish. Accounts are created by the site owner.
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            autoFocus
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        {state.error ? (
          <p role="alert" className="text-sm text-red-700">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-xs text-slate-500">
        Forgotten your password? There is no self-service reset — set a new one in
        the Supabase dashboard under Authentication → Users.
      </p>
    </main>
  );
}
