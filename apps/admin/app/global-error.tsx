'use client';

/**
 * The last resort: an error thrown by the ROOT layout itself, which is the one
 * place the dashboard boundary cannot reach — it is rendered inside that
 * layout.
 *
 * It replaces the whole document, so it has to carry its own <html> and
 * <body>, and it cannot use globals.css reliably (the failure may be in the
 * layout that imports it). Hence inline styles, which is the one place in this
 * app they are the right answer rather than a shortcut.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#f4f5fa',
          color: 'rgba(47, 43, 61, 0.9)',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          padding: '1.5rem',
        }}
      >
        <div style={{ maxWidth: '32rem' }}>
          <h1 style={{ fontSize: '1.125rem', margin: 0 }}>The admin failed to start.</h1>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', opacity: 0.75 }}>
            {error.message}
          </p>
          {error.digest ? (
            <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.6 }}>
              Reference {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1.15rem',
              borderRadius: '0.5rem',
              border: 0,
              background: '#6254ee',
              color: '#fff',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
