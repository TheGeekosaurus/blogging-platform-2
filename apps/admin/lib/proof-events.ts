import type { ProofEventInput } from '@/app/actions/proof-notifications';

/**
 * The social-proof form's event list, outside the component so it can be
 * tested without a DOM. Client-safe: nothing here touches env or the server.
 */

/** An event row while it is being edited. `key` is for React only. */
export interface ProofEventDraft extends ProofEventInput {
  key: string;
  /** The stored map, and the place it was drawn for — a changed city voids it. */
  mapUrl: string | null;
  mapPlace: string | null;
}

let keySeed = 0;
const newKey = () => `new-${Date.now()}-${keySeed++}`;

export function blankEvent(): ProofEventDraft {
  return {
    key: newKey(),
    name: '',
    city: '',
    region: '',
    country: '',
    action: '',
    minutesMin: 2,
    minutesMax: 60,
    link: '',
    imageId: null,
    mapUrl: null,
    mapPlace: null,
  };
}

/**
 * Pasted rows into events: `name, city, region, country, action`, one per line.
 *
 * Tabs win over commas when present, because a range copied out of Google
 * Sheets or Excel arrives tab-separated — which is how Provenly's own workflow
 * is fed. With commas the action takes everything after the fourth, since
 * actions are sentences and sentences have commas. A first row that looks like
 * a header is skipped.
 */
export function parsePastedEvents(text: string): ProofEventDraft[] {
  const out: ProofEventDraft[] = [];

  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    const cells = line.includes('\t') ? line.split('\t') : line.split(',');
    const [name = '', city = '', region = '', country = '', ...rest] = cells.map((c) => c.trim());
    const action = rest.join(line.includes('\t') ? ' ' : ', ').trim();

    if (index === 0 && name.toLowerCase() === 'name') continue;
    if (!name && !city && !action) continue;

    out.push({ ...blankEvent(), name, city, region, country, action });
  }

  return out;
}

