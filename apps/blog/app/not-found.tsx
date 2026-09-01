import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-3 text-[var(--color-ink-muted)]">
        That URL doesn&apos;t match anything here.
      </p>
      <p className="mt-6">
        <Link href="/">Back to the homepage</Link>
      </p>
    </div>
  );
}
