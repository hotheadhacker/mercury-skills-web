/**
 * Plausible Analytics script injector.
 *
 * Uses your self-hosted, obfuscated script path. The site-wide page-view
 * tracking happens automatically once this script loads; custom events are
 * fired via `window.plausible(...)` from lib/analytics.ts.
 *
 * `next/script` with `strategy="afterInteractive"` defers loading until the
 * page has hydrated so analytics never blocks first paint.
 *
 * The inline shim mirrors what your snippet does: it stubs `window.plausible`
 * with a queue so events fired before the main script finishes downloading
 * still get captured and flushed once it does.
 */
import Script from "next/script";
import OutboundLinkTracker from "./OutboundLinkTracker";

const SRC =
  "https://analytics.cosmicstack.org/js/pa-l298qt9k594b2dhe4649G.js";

export default function PlausibleAnalytics() {
  return (
    <>
      <Script
        id="plausible-script"
        src={SRC}
        strategy="afterInteractive"
        defer
      />
      <Script id="plausible-init" strategy="afterInteractive">
        {`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)};plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init();`}
      </Script>
      <OutboundLinkTracker />
    </>
  );
}
