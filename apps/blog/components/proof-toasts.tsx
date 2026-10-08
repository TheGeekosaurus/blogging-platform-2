'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';

import {
  pickMinutesAgo,
  resolveProofCampaign,
  type ProofCampaignPayload,
  type ProofContext,
  type ProofEventPayload,
  type ProofPayload,
} from '@blog/core/proof';
import { ProofToast } from '@blog/core/proof-toast';

/**
 * Social-proof toasts: which campaign this page gets, and when each toast
 * shows. Mounted once, in the root layout.
 *
 * Everything is decided here in the browser. Pages are static and the layout
 * cannot know which route it wraps, so the campaigns arrive from /api/proof
 * and are matched against the current path — plus, on a post, the post id and
 * its terms, which the post page leaves in a hidden `[data-proof-ctx]`
 * element. Imports come from `@blog/core/proof` and `/proof-toast`, never the
 * barrel, which would pull the Supabase client into the bundle.
 *
 * Reader state is sessionStorage only — which campaigns were closed, and which
 * have already run under "once per session". It is per-tab and disposable,
 * for the reason lib/lead-magnet.ts gives for keeping reader state out of
 * Postgres.
 */

const ENDPOINT = '/api/proof';
/** Must match the transition below, so the next toast waits for this one to leave. */
const EXIT_MS = 300;
const MOBILE_QUERY = '(max-width: 640px)';

const closedKey = (id: string) => `proof:closed:${id}`;
const seenKey = (id: string) => `proof:seen:${id}`;

function readFlag(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function writeFlag(key: string): void {
  try {
    sessionStorage.setItem(key, '1');
  } catch {
    // Storage blocked: the toast just comes back on the next page.
  }
}

function readContext(path: string): ProofContext {
  const context: ProofContext = { path };
  const el = document.querySelector<HTMLElement>('[data-proof-ctx]');
  if (!el?.dataset.proofCtx) return context;

  try {
    const parsed = JSON.parse(el.dataset.proofCtx) as { postId?: unknown; termIds?: unknown };
    if (typeof parsed.postId === 'string') context.postId = parsed.postId;
    if (Array.isArray(parsed.termIds)) {
      context.termIds = parsed.termIds.filter((id): id is string => typeof id === 'string');
    }
  } catch {
    // A malformed context is a page with no post rules, not a broken page.
  }
  return context;
}

interface Showing {
  campaign: ProofCampaignPayload;
  event: ProofEventPayload;
  minutesAgo: number | null;
}

function anchorStyle(campaign: ProofCampaignPayload, visible: boolean, reduced: boolean): CSSProperties {
  const [vertical, horizontal] = campaign.position.split('-') as ['top' | 'bottom', 'left' | 'right'];
  const offset = vertical === 'top' ? -16 : 16;

  return {
    position: 'fixed',
    [vertical]: 16,
    [horizontal]: 16,
    zIndex: 60,
    opacity: visible ? 1 : 0,
    transform: visible || reduced ? 'none' : `translateY(${offset}px)`,
    transition: `opacity ${EXIT_MS}ms ease, transform ${EXIT_MS}ms ease`,
    pointerEvents: visible ? 'auto' : 'none',
  };
}

export function ProofToasts() {
  const pathname = usePathname();
  const [payload, setPayload] = useState<ProofPayload | null>(null);
  const [showing, setShowing] = useState<Showing | null>(null);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);

  /*
   * The running schedule, in refs rather than state: hovering pauses the hide
   * timer and leaving restarts it, and neither should re-render or restart the
   * rotation.
   */
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideRef = useRef<(() => void) | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  // Fetch once, after the page has settled — never in the way of first paint.
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch(ENDPOINT)
        .then((res) => (res.ok ? (res.json() as Promise<ProofPayload>) : null))
        .then((data) => {
          if (!cancelled && data && Array.isArray(data.campaigns)) setPayload(data);
        })
        .catch(() => {});
    };

    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(load, { timeout: 4000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }
    const id = setTimeout(load, 1500);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, []);

  // Pick the campaign for this page and run it. Re-runs on client navigation.
  useEffect(() => {
    setVisible(false);
    setShowing(null);
    if (!payload) return;

    const campaign = resolveProofCampaign(payload.campaigns, readContext(pathname));
    if (!campaign) return;
    if (!campaign.showOnMobile && window.matchMedia(MOBILE_QUERY).matches) return;
    if (readFlag(closedKey(campaign.id))) return;
    if (campaign.frequency === 'once_per_session' && readFlag(seenKey(campaign.id))) return;

    let shown = 0;
    let index = 0;
    let stopped = false;

    const showNext = () => {
      if (stopped || shown >= campaign.maxPerView) return;
      if (index >= campaign.events.length) {
        if (!campaign.repeat) return;
        index = 0;
      }
      const event = campaign.events[index++];
      if (!event) return;

      shown += 1;
      if (campaign.frequency === 'once_per_session') writeFlag(seenKey(campaign.id));

      setShowing({
        campaign,
        event,
        minutesAgo: campaign.showTimeAgo ? pickMinutesAgo(event.minutesAgo) : null,
      });
      setVisible(true);
      scheduleHide();
    };

    const hide = () => {
      setVisible(false);
      timer.current = setTimeout(showNext, EXIT_MS + campaign.gapS * 1000);
    };

    const scheduleHide = () => {
      clear();
      timer.current = setTimeout(hide, campaign.displayS * 1000);
    };

    hideRef.current = scheduleHide;
    stopRef.current = () => {
      stopped = true;
      clear();
      setVisible(false);
      writeFlag(closedKey(campaign.id));
    };

    timer.current = setTimeout(showNext, campaign.initialDelayS * 1000);

    return () => {
      stopped = true;
      clear();
      hideRef.current = null;
      stopRef.current = null;
    };
  }, [payload, pathname]);

  const onClose = useCallback(() => stopRef.current?.(), []);

  if (!showing) return null;

  const { campaign, event, minutesAgo } = showing;

  return (
    <div
      role="status"
      aria-live="polite"
      style={anchorStyle(campaign, visible, reduced)}
      onMouseEnter={clear}
      onMouseLeave={() => {
        if (visible) hideRef.current?.();
      }}
      onFocus={clear}
    >
      <ProofToast
        template={campaign.template}
        imageMode={campaign.imageMode}
        presetIcon={campaign.presetIcon}
        accent={campaign.accent}
        event={event}
        minutesAgo={minutesAgo}
        onClose={onClose}
      />
    </div>
  );
}
