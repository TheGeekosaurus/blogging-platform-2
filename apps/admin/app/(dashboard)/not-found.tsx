import Link from 'next/link';

/**
 * A row that is not there — an id that was deleted, or a URL typed by hand.
 *
 * Every detail route already calls `notFound()` when its query comes back
 * empty; without this file that landed on the app-wide 404, outside the shell,
 * with no rail and no way back except the browser button.
 */
export default function DashboardNotFound() {
  return (
    <div className="card max-w-2xl px-5 py-4">
      <h1 className="text-base font-semibold text-ink">Not found.</h1>
      <p className="mt-2 text-sm text-ink-muted">
        That item has been deleted, or the address is wrong. It may also belong to a
        different site — check which one you are editing, at the foot of the rail.
      </p>
      <Link href="/posts" className="btn btn-ghost btn-sm mt-4">
        Back to Posts
      </Link>
    </div>
  );
}
