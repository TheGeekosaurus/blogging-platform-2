"use client";

import { useActionState } from "react";

import { signIn, type AuthFormState } from "@/app/actions/auth";

const INITIAL: AuthFormState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, INITIAL);

  return (
    /*
      A card on the canvas, not bare text on white. The dashboard behind this
      is all cards on a tinted ground now, and a sign-in screen that looks like
      an unstyled form is the first thing anyone sees of it.
    */
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="card px-7 py-8">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-base font-bold text-white shadow-brand"
          >
            B
          </span>
          <h1 className="text-xl font-semibold tracking-tight">Blog admin</h1>
        </div>
        <p className="mt-3 text-sm text-ink-muted">
          Sign in to write and publish. Accounts are created by the site owner.
        </p>

        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              autoFocus
              className="field"
            />
          </div>

          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="field"
            />
          </div>

          {state.error ? (
            <p role="alert" className="text-sm text-danger-ink">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary w-full"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-xs text-ink-muted">
          Forgotten your password? There is no self-service reset — set a new
          one in the Supabase dashboard under Authentication → Users.
        </p>
      </div>
    </main>
  );
}
