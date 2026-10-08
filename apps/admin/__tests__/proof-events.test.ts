import { describe, expect, it } from 'vitest';

import { parsePastedEvents } from '@/lib/proof-events';

describe('parsePastedEvents', () => {
  it('reads comma lines, keeping commas inside the action', () => {
    const [event] = parsePastedEvents('James, San Diego, CA, US, got the guide, and the checklist');
    expect(event).toMatchObject({
      name: 'James',
      city: 'San Diego',
      region: 'CA',
      country: 'US',
      action: 'got the guide, and the checklist',
    });
  });

  it('reads rows copied out of a spreadsheet, and skips a header row', () => {
    const rows = parsePastedEvents(
      'Name\tCity\tState\tCountry\tAction\nMaria\tAustin\tTX\tUS\tbooked a call\n\n',
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: 'Maria', city: 'Austin', action: 'booked a call' });
  });

  it('gives each row its own key and the default time range', () => {
    const rows = parsePastedEvents('A, X, , , did a\nB, Y, , , did b');
    expect(new Set(rows.map((r) => r.key)).size).toBe(2);
    expect(rows[0]).toMatchObject({ minutesMin: 2, minutesMax: 60, link: '', imageId: null });
  });
});
