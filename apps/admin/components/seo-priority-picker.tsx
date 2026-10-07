'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';

import { SEO_PRIORITIES, SEO_PRIORITY_LABELS, type SeoPagePriority } from '@blog/core';

import { setPagePriority } from '@/app/actions/seo';

type SaveState = 'idle' | 'saving' | 'saved' | 'failed';

/**
 * How long a change sits before it is written. Not about load — about arrow
 * keys; see `handleChange`.
 */
const DEBOUNCE_MS = 350;

/** Long enough that a write which lands normally never flashes an indicator. */
const PENDING_AFTER_MS = 400;

/**
 * Rank a planned page, from its row on the Roadmap.
 *
 * It sits ON the bar rather than in the panel below it, and it autosaves. Both
 * reverse what this file used to say, and both have a cost paid explicitly:
 *
 *   - It is NOT in the <summary>. A summary toggles on a click from any
 *     descendant — and `stopPropagation` does not prevent that, because the
 *     activation target is resolved while the event path is built; only
 *     `preventDefault` would. It would also join the row's accessible name,
 *     since an embedded control contributes its value. So it is a sibling of
 *     the <details>, stacked over the bar by `.seo-row`.
 *   - There is no <form> and no Save, so this no longer works without
 *     JavaScript. That is the price of "no Save button" and it cannot be
 *     charged to anyone else: a change event is JavaScript.
 *   - A stray arrow key really can rewrite the queue now, which the old
 *     explicit submit existed to prevent. The debounce is what that objection
 *     turns into once autosave is the requirement.
 */
export function SeoPriorityPicker({
  pageId,
  pageTitle,
  priority,
}: {
  pageId: string;
  pageTitle: string;
  priority: SeoPagePriority | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // What the control shows, and the last value the server told us. The second
  // exists only so the first can tell "the server confirmed my change" apart
  // from "the server holds a different value than I thought".
  const [value, setValue] = useState<SeoPagePriority | ''>(priority ?? '');
  const [confirmed, setConfirmed] = useState(priority);
  const [save, setSave] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);

  const selectRef = useRef<HTMLSelectElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queued = useRef<SeoPagePriority | null>(null);
  // Monotonic, so an answer arriving after a later change is discarded.
  const seq = useRef(0);
  // A write has landed that the list has not been re-sorted for.
  const unsorted = useRef(false);
  const justResorted = useRef(false);

  /*
   * Adopt a value that arrives FROM the server, during render.
   *
   * React's documented "adjust state when a prop changes" pattern: cheaper than
   * an effect, and it never paints the stale value for a frame. It cannot
   * clobber an in-flight edit, because while our write is in the air the prop
   * still holds the old value and `confirmed` still equals it.
   */
  if (priority !== confirmed) {
    setConfirmed(priority);
    setValue(priority ?? '');
  }

  /*
   * Keep the row on screen after the queue reorders beneath it.
   *
   * `block: 'nearest'` is a no-op when the row is already fully visible, which
   * it usually is — this only acts when the reorder pushed it past an edge, and
   * an OPEN row moving takes six hundred pixels of panel with it.
   */
  useEffect(() => {
    if (!justResorted.current) return;
    justResorted.current = false;
    selectRef.current?.closest('.seo-node')?.scrollIntoView({ block: 'nearest' });
  }, [confirmed]);

  // Timers outlive the component if a row is unmounted mid-edit.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
    },
    [],
  );

  function commit(next: SeoPagePriority | null) {
    const mine = (seq.current += 1);

    // Only claim to be saving if it is taking long enough to be worth saying.
    if (pendingTimer.current) clearTimeout(pendingTimer.current);
    pendingTimer.current = setTimeout(() => {
      if (mine === seq.current) setSave('saving');
    }, PENDING_AFTER_MS);

    startTransition(async () => {
      const result = await setPagePriority(pageId, next);

      // Superseded: two writes can be answered in either order, and the later
      // one is the one that was meant.
      if (mine !== seq.current) return;
      if (pendingTimer.current) clearTimeout(pendingTimer.current);

      if (result.error) {
        /*
         * Put the control back to the last value the server confirmed.
         *
         * With no Save button the control IS the claim about what the priority
         * is, and priority is the Roadmap's first sort key — a value on screen
         * that is not in the database means the whole queue is being read in an
         * order nobody set.
         */
        setValue(confirmed ?? '');
        setError(result.error);
        setSave('failed');
        return;
      }

      setError(null);
      setSave('saved');
      unsorted.current = true;
    });
  }

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const raw = event.target.value as SeoPagePriority | '';
    setValue(raw);
    setSave('idle');

    /*
     * Debounced, and the reason is arrow keys, not load.
     *
     * A CLOSED <select> changes value on every Up/Down press, so walking from
     * "Not ranked" to "High" fires three change events — three writes and,
     * worse, three reorders. 350ms collapses that into the one that was meant,
     * and is under the 400ms the pending dot waits for, so a keyboard traversal
     * never flashes one either.
     */
    queued.current = raw === '' ? null : raw;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      commit(queued.current);
    }, DEBOUNCE_MS);
  }

  function handleBlur(event: React.FocusEvent<HTMLSelectElement>) {
    // Flush rather than drop: leaving the control is as clear a "that is what I
    // meant" as waiting out the debounce.
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
      commit(queued.current);
    }

    /*
     * If focus is on its way to ANOTHER row's priority control, leave the
     * reorder to that one's blur. Reordering now would move the list out from
     * under the control the user is reaching for.
     */
    if ((event.relatedTarget as Element | null)?.closest('.seo-row-control')) return;

    if (!unsorted.current) return;
    unsorted.current = false;
    justResorted.current = true;

    /*
     * THE REORDER HAPPENS HERE, not when the value was written.
     *
     * `comparePages` makes priority the first sort key inside a topic, so every
     * save moves this row — past its siblings, and past an open row it would
     * displace by the full height of a keyword table. React reorders with
     * insertBefore, which blurs whatever was focused, so a list that reorders
     * mid-choice also costs a keyboard user their place on every change. The
     * write and the reorder are therefore separated: the value commits
     * immediately, the queue reorders once you are finished with the control.
     *
     * `setPagePriority` leaves '/roadmap' un-revalidated for exactly this
     * reason — see the action.
     */
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="seo-row-control">
      {/*
        A visually hidden label carrying the PAGE TITLE.

        "Priority" alone would be twenty-nine identical entries in a screen
        reader's list of form controls, which is the same as no label at all.
        The title is the only thing that tells them apart.
      */}
      <label htmlFor={`priority-${pageId}`} className="sr-only">
        Priority — {pageTitle}
      </label>

      <select
        id={`priority-${pageId}`}
        ref={selectRef}
        /* Never `disabled` while saving: disabling a focused control blurs it,
           so a 150ms write would cost the user their place. The sequence guard
           in `commit` makes the last change win instead. */
        className="field field-sm field-bar"
        data-priority={value || 'none'}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
      >
        {/* First, and empty-valued, so clearing a rank is as easy as setting
            one. `parsePriority` turns this into a null write. */}
        <option value="">Not ranked</option>
        {SEO_PRIORITIES.map((option) => (
          <option key={option} value={option}>
            {SEO_PRIORITY_LABELS[option]}
          </option>
        ))}
      </select>

      {/* A fixed-width slot, so the select never shifts when a mark appears. */}
      <span className="seo-save" aria-hidden="true">
        {save === 'saving' ? <span className="seo-save-saving">·</span> : null}
        {save === 'saved' ? <span className="seo-save-saved">✓</span> : null}
        {save === 'failed' ? (
          <span className="seo-save-failed" title={error ?? 'Could not save'}>
            !
          </span>
        ) : null}
      </span>

      {/* Autosave is silent otherwise. Scoped to this row, and polite for
          success so a run down the column is not unbearable. */}
      <span role="status" className="sr-only">
        {save === 'saved' ? `Priority saved for ${pageTitle}` : ''}
      </span>
      <span role="alert" className="sr-only">
        {save === 'failed' ? `${error} Priority unchanged for ${pageTitle}.` : ''}
      </span>
    </div>
  );
}
