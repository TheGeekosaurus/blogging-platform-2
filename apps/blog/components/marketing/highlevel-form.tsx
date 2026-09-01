/**
 * The HighLevel qualification survey, embedded as an iframe.
 *
 * WHY AN IFRAME. This form is the homepage's entire purpose: ten questions with
 * conditional logic, two TCPA/SMS consent checkboxes, and CRM automations behind
 * it. Rebuilding it natively means reconstructing that logic and the consent
 * wording, where a mistake silently drops leads. Embedding keeps HighLevel as
 * the system of record, so nothing about lead capture changes when DNS moves.
 *
 * Our own `X-Frame-Options: SAMEORIGIN` (next.config.ts) governs who may frame
 * US and has no effect on outbound embeds, so no config change is needed.
 *
 * TO GO LIVE: set NEXT_PUBLIC_HL_FORM_ID to the form/survey id from
 * HighLevel -> Sites -> Forms (or Surveys) -> Integrate. The id is fetched by
 * HighLevel's client JS at runtime, so it cannot be read out of the live page
 * source. Until it is set, a labelled placeholder renders instead of a broken
 * iframe, and the surrounding page is unaffected.
 */
const FORM_ID = process.env.NEXT_PUBLIC_HL_FORM_ID;

/** 'form' and 'survey' are separate HighLevel widget types with the same embed shape. */
const FORM_KIND = process.env.NEXT_PUBLIC_HL_FORM_KIND === 'survey' ? 'survey' : 'form';

/** Reserved height. Keeps the iframe from shifting the page as it loads. */
const HEIGHT = 1100;

export function HighLevelForm() {
  if (!FORM_ID) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-black/15 bg-black/[0.02] px-6 text-center"
        style={{ minHeight: 320 }}
      >
        <p className="font-semibold">Qualification form not yet connected</p>
        <p className="max-w-md text-sm text-black/60">
          Set <code className="rounded bg-black/5 px-1">NEXT_PUBLIC_HL_FORM_ID</code> on this
          Vercel project to the id from HighLevel → Sites → Forms → Integrate, then redeploy.
        </p>
      </div>
    );
  }

  return (
    <>
      <iframe
        src={`https://api.leadconnectorhq.com/widget/${FORM_KIND}/${FORM_ID}`}
        title="Funding qualification form"
        loading="lazy"
        className="w-full rounded-lg border-0"
        style={{ height: HEIGHT }}
      />
      {/*
        HighLevel's resizer posts the real content height back to the parent, so
        the iframe can shrink to fit instead of always reserving HEIGHT. Plain
        <script src> rather than next/script: it must run inside the same
        document as the iframe and has no ordering requirements.
      */}
      <script src="https://link.msgsndr.com/js/form_embed.js" async />
    </>
  );
}
