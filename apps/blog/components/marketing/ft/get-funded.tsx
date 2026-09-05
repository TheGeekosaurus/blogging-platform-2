import { HighLevelForm } from '../highlevel-form';
import { GET_FUNDED } from './content';
import { Chip, CONTAINER } from './primitives';

/*
 * /get-funded — the destination of every "Get Funded" button on the site.
 *
 * Deliberately three strings and a form, matching the live GoHighLevel page.
 * This is the bottom of the funnel: the visitor arrived by clicking the thing we
 * wanted them to click, so the page's only job is to not get in the way of the
 * survey. Sections, proof blocks and secondary CTAs all belong on the pages that
 * link here, not on this one.
 *
 * The survey is the same embed as the homepage's qualifier — one HighLevel
 * survey, one CRM record, whichever route the visitor took. See
 * ../highlevel-form.tsx for why it is an iframe.
 */
export function GetFunded() {
  return (
    <div className="ft-surface">
      <section aria-labelledby="ft-get-funded" className={`${CONTAINER} py-16 lg:py-24`}>
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Chip>{GET_FUNDED.eyebrow}</Chip>

          <h1
            id="ft-get-funded"
            className="mt-6 font-[family-name:var(--font-headline)] text-[clamp(2.25rem,5vw,3.5rem)] font-medium leading-[1.08] text-[var(--ft-ink)]"
          >
            {GET_FUNDED.heading}
          </h1>

          <p className="mt-5 text-[1.125rem] leading-relaxed text-[var(--ft-muted)] sm:text-[1.25rem]">
            {GET_FUNDED.sub}
          </p>
        </div>

        {/*
          Same white panel as the homepage qualifier, for the same reason: the
          survey renders its own light surface, and on the dark ground its edges
          read as a rendering fault without one.
        */}
        <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-2xl bg-white">
          <HighLevelForm eager />
        </div>
      </section>
    </div>
  );
}
