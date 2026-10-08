/**
 * The shape of a screen while its query runs.
 *
 * Every admin route is `force-dynamic`, so every navigation waits on Postgres
 * before it renders anything. Until now that wait showed the PREVIOUS screen,
 * unchanged, with no indication that a click had registered — the App Router
 * holds the old route on screen until the new one is ready, and without a
 * `loading.tsx` there is nothing to swap in. On a fast local database that
 * reads as instant. Against Supabase over the network it reads as broken.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className ?? ''}`} />;
}

/**
 * A list screen's shape: the header row, then a card of rows.
 *
 * It mimics the real layout rather than showing a spinner, so the content
 * lands in the place the eye is already looking instead of appearing somewhere
 * a spinner never suggested.
 */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    /*
     * One live region for the whole screen, announcing once. Without it a
     * screen reader is told nothing at all while the page is blank; with a
     * label on each bar it would be told thirty times.
     */
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading…</span>

      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="border-b border-line px-4 py-3.5">
          <Skeleton className="h-3 w-24" />
        </div>
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-line-soft px-4 py-3.5 last:border-b-0"
          >
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
