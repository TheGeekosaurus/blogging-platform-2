import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { ProofEventPayload } from '@blog/core/proof';
import { ProofToast, type ProofToastProps } from '@blog/core/proof-toast';

/**
 * The social-proof toast as a reader is served it: both templates, each image
 * mode, the optional link and the map credit. createElement and .ts for the
 * reason lead-magnet-card.test.ts gives.
 */

const EVENT: ProofEventPayload = {
  name: 'James',
  place: 'San Diego, CA',
  action: 'recently got the Equipment Financing Guide',
  minutesAgo: [5, 9],
  link: null,
  image: null,
  isMap: false,
};

const render = (props: Partial<ProofToastProps> = {}, event: Partial<ProofEventPayload> = {}) =>
  renderToStaticMarkup(
    createElement(ProofToast, {
      template: 'pill',
      imageMode: 'preset',
      presetIcon: 'fire',
      accent: null,
      minutesAgo: 7,
      ...props,
      event: { ...EVENT, ...event },
    }),
  );

describe('ProofToast', () => {
  it('writes the headline, the action and the time', () => {
    const html = render();
    expect(html).toContain('James from San Diego, CA');
    expect(html).toContain('recently got the Equipment Financing Guide');
    expect(html).toContain('7 min ago');
  });

  it('draws the pill fully rounded and the card with small corners', () => {
    expect(render({ template: 'pill' })).toMatch(/border-radius:999px/);
    expect(render({ template: 'card' })).toMatch(/border-radius:10px/);
  });

  it('falls back to the preset icon, and shows nothing in none mode', () => {
    expect(render({ presetIcon: 'cart' })).toContain('🛒');
    const none = render({ imageMode: 'none' }, { image: { url: 'https://x/y.png', alt: null } });
    expect(none).not.toContain('<img');
    expect(none).not.toContain('🔥');
  });

  it('shows an image when the event has one, with credit only for maps', () => {
    const custom = render({ imageMode: 'custom' }, { image: { url: 'https://x/y.png', alt: 'Guide' } });
    expect(custom).toContain('src="https://x/y.png"');
    expect(custom).not.toContain('OpenStreetMap');

    const map = render({ imageMode: 'map' }, { image: { url: 'https://x/map.webp', alt: null }, isMap: true });
    expect(map).toContain('src="https://x/map.webp"');
    expect(map).toContain('© OpenStreetMap');
  });

  it('is a link only when the event has one, and the close button is outside it', () => {
    expect(render()).not.toContain('<a ');
    const html = render({ onClose: () => {} }, { link: '/funding-solutions' });
    expect(html).toContain('href="/funding-solutions"');
    expect(html.indexOf('</a>')).toBeLessThan(html.indexOf('<button'));
  });

  it('says "Someone" for a blank name, and hides the time when asked', () => {
    const html = render({ minutesAgo: null }, { name: null });
    expect(html).toContain('Someone from San Diego, CA');
    expect(html).not.toContain('ago');
  });
});
