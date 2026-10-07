import Script from 'next/script';

import { SURVEY } from './brand';

/**
 * One embeddable HighLevel widget: where it lives and how much room to hold
 * for it before it reports its real size.
 *
 * A type rather than a direct `typeof SURVEY`, because there are two of these
 * now — Capital's funding qualifier and Nanotom Labs' get-started survey — and
 * each brand keeps its own constant beside the rest of its destinations.
 */
export type SurveyEmbed = {
  host: string;
  kind: string;
  id: string;
  /**
   * Height reserved before the widget reports its own, so what sits below it
   * does not jump. form_embed.js overwrites it via inline style, which beats
   * the `height` attribute — so this is a floor for the first paint, not a cap.
   */
  initialHeight: number;
};

/**
 * The HighLevel qualification survey, embedded as an iframe.
 *
 * WHY AN IFRAME. A survey is the whole purpose of the page it sits on: questions
 * with conditional logic, consent wording, and CRM automations behind it.
 * Rebuilding one natively means reconstructing that logic and that wording, where
 * a mistake silently drops leads. Embedding keeps HighLevel as the system of
 * record, so nothing about lead capture changes when DNS moves.
 *
 * SHARED BY BOTH BRANDS. Capital's funding qualifier is the default; Nanotom Labs
 * passes its own `survey` for /get-started. Everything below is identical for the
 * two, which is why there is one component rather than a copy per site.
 *
 * Our own `X-Frame-Options: SAMEORIGIN` (next.config.ts) governs who may frame
 * US and has no effect on outbound embeds, so no config change is needed.
 */
export function HighLevelForm({
  eager = false,
  survey = SURVEY,
  title = 'Funding qualification survey',
}: {
  eager?: boolean;
  /** Defaults to Capital's funding qualifier — Labs passes its own. */
  survey?: SurveyEmbed;
  /** The frame's accessible name, which is the only thing a screen reader has
      to go on before the widget loads. Says which survey this is, not "survey". */
  title?: string;
}) {
  return (
    <>
      <iframe
        src={`${survey.host}/widget/${survey.kind}/${survey.id}`}
        /*
         * NOT redundant, and not decorative. form_embed.js handles the survey's
         * resize message by looking its target up with
         * `getElementById(<iframeId from the message>)`, and the survey posts back
         * its own id. If this attribute is missing or differs, the lookup fails:
         * the survey still renders, but never resizes, so it stays clipped at
         * initialHeight with nothing logged anywhere.
         */
        id={survey.id}
        title={title}
        /* Read off the element's dataset by form_embed.js; carried over verbatim
           from the embed code HighLevel generated. */
        data-cookie-consent="true"
        data-cookie-consent-provider="auto"
        /* The resizer sizes the frame to its content, so an inner scrollbar would
           only ever appear mid-resize. */
        scrolling="no"
        /* The survey document is ~176 KB, so it defers by default: on a homepage
           it is one section of ten and the resizer attaches on load, meaning lazy
           costs nothing beyond holding initialHeight until it scrolls into view.
           `eager` is for the pages the survey IS — /get-funded and Labs'
           /get-started — where deferring the one thing the visitor came for is
           the wrong trade. */
        loading={eager ? 'eager' : 'lazy'}
        /*
         * `colorScheme: 'light'` IS WHAT KEEPS THE FRAME TRANSPARENT, and the
         * reason is worth writing down because the symptom points at the wrong
         * file entirely.
         *
         * Both surveys render LIGHT documents. Both marketing sites declare
         * `color-scheme: dark` on <body>, which an iframe inherits. When the two
         * disagree, Chrome paints the frame an opaque WHITE base background so
         * the light content is not composited over a dark page — so the widget
         * arrives as a white slab, whatever the embedded document's own
         * background is. Nothing in the survey's CSS explains it and nothing is
         * logged; changing the wrapper's colour does nothing, because the white
         * is the frame's own canvas sitting on top of it.
         *
         * Declaring the frame's scheme to match its content removes the
         * mismatch and the backdrop with it, and Nanotom Labs' survey — which
         * paints only its own 650px card over a transparent page — then floats
         * on whatever is behind it. Measured in a browser both ways. Capital's
         * survey is unchanged by this: it ships a flat #141414 background image
         * that covers the canvas, so nothing underneath it was ever visible.
         *
         * It does NOT force light CONTROLS on anyone: it describes a document
         * this file does not own, rather than choosing a theme for the visitor.
         */
        style={{
          border: 'none',
          width: '100%',
          height: survey.initialHeight,
          colorScheme: 'light',
        }}
      />

      {/*
        next/script at afterInteractive rather than a bare <script src>: React 19
        hoists a plain script tag into <head>, where it can execute before this
        iframe exists. form_embed.js collects its targets with
        querySelectorAll('iframe') at init, so running early means never
        attaching and never resizing. afterInteractive runs post-hydration, when
        the iframe is guaranteed to be in the DOM.
      */}
      <Script src={`${survey.host}/js/form_embed.js`} strategy="afterInteractive" />
    </>
  );
}
