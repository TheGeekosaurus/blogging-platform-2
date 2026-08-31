'use client';

import { useActionState } from 'react';

import { requestMagicLink, type AuthFormState } from '@/app/actions/auth';

const INITIAL: AuthFormState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(requestMagicLink, INITIAL);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Blog admin</h1>
      <p className="mt-2 text-sm text-slate-600">
        Sign in with a magic link. Access is invite-only.
      </p>

      {state.sent ? (
        <p className="mt-6 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          If that address has access, a sign-in link is on its way. Check your inbox.
        </p>
      ) : (
        <form action={formAction} className="mt-6 flex flex-col gap-3">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            autoFocus
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />

          {state.error ? (
            <p className="text-sm text-red-700" role="alert">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? 'Sending…' : 'Send magic link'}
          </button>
        </form>
      )}
    </main>
  );
}
