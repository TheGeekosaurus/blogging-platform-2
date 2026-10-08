import { TableSkeleton } from '@/components/ui/skeleton';

/**
 * Shown while any dashboard route's query runs.
 *
 * ONE file for every screen rather than one per route. The App Router walks up
 * for the nearest `loading.tsx`, so this covers all twenty-three; a per-route
 * version would only be worth it where the shape is very different from a
 * list, and the two that are — the editor and Settings — are reached by a
 * deliberate click on a row you are already looking at, where a brief hold is
 * read as "it is opening" rather than as nothing happening.
 */
export default function DashboardLoading() {
  return <TableSkeleton />;
}
