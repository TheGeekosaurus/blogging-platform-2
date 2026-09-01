import Script from 'next/script';

/**
 * Google Tag Manager.
 *
 * The live HighLevel site loads container GTM-W5D5NV8X plus a Facebook pixel
 * injected directly. GTM is ported because dropping it would silently break ad
 * attribution the moment DNS moves — conversions would keep happening and stop
 * being reported, which is worse than the script's cost.
 *
 * The Facebook pixel is deliberately NOT hardcoded here. It should be added as a
 * tag inside this GTM container instead: two independent copies of the same pixel
 * double-count conversions, and one of them would be invisible to whoever
 * maintains the tag setup.
 *
 * `afterInteractive` keeps it off the critical rendering path. Set
 * NEXT_PUBLIC_GTM_ID to enable; unset, nothing is emitted, so previews and local
 * development do not pollute the production container.
 */
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export function Analytics() {
  if (!GTM_ID) return null;

  return (
    <>
      <Script id="gtm" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}
