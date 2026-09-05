import Script from 'next/script';

import { SURVEY } from './brand';

/**
 * The HighLevel qualification survey, embedded as an iframe.
 *
 * WHY AN IFRAME. This survey is the homepage's entire purpose: ten questions with
 * conditional logic, two TCPA/SMS consent checkboxes, and CRM automations behind
 * it. Rebuilding it natively means reconstructing that logic and the consent
 * wording, where a mistake silently drops leads. Embedding keeps HighLevel as the
 * system of record, so nothing about lead capture changes when DNS moves.
 *
 * Our own `X-Frame-Options: SAMEORIGIN` (next.config.ts) governs who may frame
 * US and has no effect on outbound embeds, so no config change is needed.
 */
export function HighLevelForm({ eager = false }: { eager?: boolean }) {
  return (
    <>
      <iframe
        src={`${SURVEY.host}/widget/${SURVEY.kind}/${SURVEY.id}`}
        /*
         * NOT redundant, and not decorative. form_embed.js handles the survey's
         * resize message by looking its target up with
         * `getElementById(<iframeId from the message>)`, and the survey posts back
         * its own id. If this attribute is missing or differs, the lookup fails:
         * the survey still renders, but never resizes, so it stays clipped at
         * initialHeight with nothing logged anywhere.
         */
        id={SURVEY.id}
        title="Funding qualification survey"
        /* Read off the element's dataset by form_embed.js; carried over verbatim
           from the embed code HighLevel generated. */
        data-cookie-consent="true"
        data-cookie-consent-provider="auto"
        /* The resizer sizes the frame to its content, so an inner scrollbar would
           only ever appear mid-resize. */
        scrolling="no"
        /* The survey document is ~176 KB, so it defers by default: on the
           homepage it is the sixth section of ten and the resizer attaches on
           load, meaning lazy costs nothing beyond holding initialHeight until it
           scrolls into view. `eager` is for /get-funded, where the survey is the
           page and deferring the one thing the visitor came for is the wrong
           trade. */
        loading={eager ? 'eager' : 'lazy'}
        style={{ border: 'none', width: '100%', height: SURVEY.initialHeight }}
      />

      {/*
        next/script at afterInteractive rather than a bare <script src>: React 19
        hoists a plain script tag into <head>, where it can execute before this
        iframe exists. form_embed.js collects its targets with
        querySelectorAll('iframe') at init, so running early means never
        attaching and never resizing. afterInteractive runs post-hydration, when
        the iframe is guaranteed to be in the DOM.
      */}
      <Script src={`${SURVEY.host}/js/form_embed.js`} strategy="afterInteractive" />
    </>
  );
}
