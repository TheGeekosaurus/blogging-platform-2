import type { CSSProperties } from 'react';

import type { ProofImageMode, ProofTemplate } from './database.types';
import {
  formatMinutesAgo,
  proofHeadline,
  type ProofEventPayload,
  type ProofPresetIcon,
} from './proof';

/**
 * One social-proof toast, as markup. No state, no effects, no positioning.
 *
 * Shared by the blog (apps/blog/components/proof-toasts.tsx moves it on and off
 * screen) and the admin's live preview, so what an editor sees while choosing
 * a template is the same markup a reader gets. That is also why the styling is
 * inline rather than in either app's stylesheet: a toast sits on every kind of
 * page this platform serves — Capital's dark marketing site, Labs' palette, a
 * plain blog — and has to look the same on all of them without picking up any
 * of their rules. It inherits only the font.
 */

export interface ProofToastProps {
  template: ProofTemplate;
  imageMode: ProofImageMode;
  presetIcon: ProofPresetIcon;
  accent: string | null;
  event: ProofEventPayload;
  /** Null hides the time line. */
  minutesAgo: number | null;
  /** Renders the close button when given. */
  onClose?: () => void;
}

/** Emoji rather than drawn icons: colourful, zero bytes, and what Provenly uses. */
const PRESET_GLYPH: Record<ProofPresetIcon, string> = {
  fire: '🔥',
  check: '✅',
  cart: '🛒',
  star: '⭐',
  bell: '🔔',
  gift: '🎁',
  download: '📥',
  user: '👤',
};

const DEFAULT_ACCENT = '#2563eb';
const INK = '#111827';
const MUTED = '#4b5563';
const FAINT = '#6b7280';

export function ProofToast({
  template,
  imageMode,
  presetIcon,
  accent,
  event,
  minutesAgo,
  onClose,
}: ProofToastProps) {
  const pill = template === 'pill';
  const color = accent ?? DEFAULT_ACCENT;
  const thumb = pill ? 56 : 64;

  const shell: CSSProperties = {
    position: 'relative',
    boxSizing: 'border-box',
    width: 'min(360px, calc(100vw - 32px))',
    background: '#ffffff',
    color: INK,
    fontFamily: 'inherit',
    lineHeight: 1.35,
    textAlign: 'left',
    borderRadius: pill ? 999 : 10,
    border: '1px solid rgba(17, 24, 39, 0.06)',
    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.16), 0 2px 6px rgba(15, 23, 42, 0.06)',
  };

  const body: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: pill ? 14 : 12,
    padding: pill ? '10px 34px 10px 10px' : '10px 30px 10px 10px',
    color: 'inherit',
    textDecoration: 'none',
    borderRadius: 'inherit',
  };

  const media: CSSProperties = {
    flex: 'none',
    width: thumb,
    height: thumb,
    borderRadius: pill ? '50%' : 6,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f3f4f6',
    fontSize: thumb * 0.5,
    lineHeight: 1,
  };

  const showsMap = imageMode !== 'none' && event.isMap && event.image !== null;

  let picture = null;
  if (imageMode !== 'none') {
    picture = event.image ? (
      // A plain img, not next/image: shared by two apps with different image configs.
      <img
        src={event.image.url}
        alt={event.image.alt ?? ''}
        width={thumb}
        height={thumb}
        loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    ) : (
      <span aria-hidden="true">{PRESET_GLYPH[presetIcon]}</span>
    );
  }

  const content = (
    <>
      {picture ? <span style={media}>{picture}</span> : null}
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: pill ? INK : color,
            // Wraps rather than truncating: the place is half the point.
            overflowWrap: 'anywhere',
          }}
        >
          {proofHeadline(event)}
        </span>
        <span style={{ fontSize: 13, color: MUTED }}>{event.action}</span>
        {minutesAgo !== null || showsMap ? (
          <span style={{ fontSize: 12, color: FAINT, display: 'flex', alignItems: 'center', gap: 6 }}>
            {minutesAgo !== null ? (
              <>
                <span
                  aria-hidden="true"
                  style={{ width: 6, height: 6, borderRadius: '50%', background: color, flex: 'none' }}
                />
                {formatMinutesAgo(minutesAgo)}
              </>
            ) : null}
            {/* Required by the OpenStreetMap licence wherever its map is shown. */}
            {showsMap ? (
              <span style={{ fontSize: 10, opacity: 0.8, marginLeft: minutesAgo !== null ? 'auto' : 0 }}>
                © OpenStreetMap
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
    </>
  );

  return (
    <div style={shell} data-proof-template={template}>
      {event.link ? (
        <a href={event.link} style={body}>
          {content}
        </a>
      ) : (
        <div style={body}>{content}</div>
      )}
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          style={{
            position: 'absolute',
            top: pill ? '50%' : 6,
            right: pill ? 12 : 6,
            transform: pill ? 'translateY(-50%)' : undefined,
            width: 22,
            height: 22,
            padding: 0,
            border: 0,
            borderRadius: '50%',
            background: 'transparent',
            color: FAINT,
            fontSize: 16,
            lineHeight: '22px',
            cursor: 'pointer',
          }}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
