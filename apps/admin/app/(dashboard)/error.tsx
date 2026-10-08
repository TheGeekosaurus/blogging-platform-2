'use client';

import Link from 'next/link';
import { useEffect } from 'react';

/**
 * What a thrown query looks like.
 *
 * There was no error boundary anywhere in the admin, so a failed Supabase call
 * — a dropped connection, an RLS denial, a migration not yet applied — showed
 * Next's own error screen in development and a blank one in production. The
 * schema errors are the ones that matter here: `explainLeadMagnetSchemaError`
 * and `proofSchemaError` in lib/queries.ts both compose a message naming the
 * exact migration to apply, and until now nothing rendered it.
 *
 * MUST be a client component — that is the App Router's contract for an error
 * boundary, since it carries `reset` and has to re-render in place.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The server digest is all production gives you; log it so the browser
    // console and the Vercel log can be matched up.
    console.error('Dashboard error', error.digest ?? '', error);
  }, [error]);

  return (
    <div className="card max-w-2xl border-l-4 border-l-danger px-5 py-4">
      <h1 className="text-base font-semibold text-ink">That screen did not load.</h1>

      {/*
        The real message, not a generic apology. Several of the errors this
        catches are written FOR this moment — they name the migration to apply
        — and swallowing them would turn a two-minute fix into a debugging
        session.
      */}
      <p className="mt-2 whitespace-pre-line text-sm text-ink-muted">{error.message}</p>

      {error.digest ? (
        <p className="mt-2 text-xs text-ink-muted">
          Reference <code>{error.digest}</code>
        </p>
      ) : null}

      <div className="mt-4 flex items-center gap-2">
        <button type="button" onClick={reset} className="btn btn-primary btn-sm">
          Try again
        </button>
        <Link href="/posts" className="btn btn-ghost btn-sm">
          Back to Posts
        </Link>
      </div>
    </div>
  );
}
