import Script from 'next/script';

import { readGtmContainerId } from '@blog/core';

/**
 * Google Tag Manager, for whichever site this deployment is serving.
 *
 * ONE CONTAINER PER SITE, read from that site's row. The id used to come from
 * NEXT_PUBLIC_GTM_ID and the root layout only mounted this component when the
 * deployment's slug was `nntm-capital` — so Nanotom Labs and every
 * database-driven blog had no tracking, and setting the variable on those
 * projects did nothing at all, because the component behind the gate never
 * rendered. That failure looked like a broken container rather than a feature
 * that was never wired up.
 *
 * Reading the site row instead of the environment also means the id is set
 * where the rest of a site's settings are set, by whoever runs the site rather
 * than whoever has Vercel access, and that changing it takes effect through the
 * ordinary revalidation the admin already fires on save — a settings write
 * purges the whole route tree, and this sits in the root layout — rather than
 * needing a redeploy the way an inlined NEXT_PUBLIC_ variable would.
 *
 * ONLY GTM IS HARDCODED. The Facebook pixel the HighLevel site injected
 * directly is deliberately not here, and neither is GA4: both belong as tags
 * inside the container. Two independent copies of one pixel double-count
 * conversions, and one of them is invisible to whoever maintains the tag setup.
 *
 * `afterInteractive` keeps it off the critical rendering path.
 */
export function Analytics({ containerId }: { containerId: string | null }) {
  /*
   * Validated here even though the admin validates on save and the database
   * has a check constraint. The id is interpolated into an inline script, so
   * the cost of being wrong is script injection on every page of the site —
   * and this renderer is the last point before that happens, reached by rows
   * this deployment did not write and cannot vouch for. A bad value renders
   * nothing rather than throwing: no tracking is a missing report, a throw in
   * the root layout is the whole site.
   */
  const id = readGtmContainerId(containerId);
  if (!id) return null;

  return (
    <>
      <Script id="gtm" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${id}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}
