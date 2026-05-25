"use client";

/**
 * Document-level outbound-link tracker.
 *
 * Listens once for click events on the whole page and fires an
 * "Outbound Link Clicked" event whenever the click resolves to an
 * `<a href>` whose host differs from the current host. This avoids having
 * to wrap every external link manually.
 *
 * Uses capture phase + `closest('a')` so it also catches clicks on nested
 * elements inside an anchor (icons, spans, etc.).
 */
import { useEffect } from "react";
import { track } from "@/lib/analytics";

export default function OutboundLinkTracker() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Element | null;
      if (!target) return;
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      // Ignore in-page anchors, mailto:, tel:, javascript:, relative paths.
      if (
        href.startsWith("#") ||
        href.startsWith("/") ||
        href.startsWith("?") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return;
      }

      let absolute: URL;
      try {
        absolute = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (absolute.host === window.location.host) return;

      // Best-effort context: the closest data-attribute, the anchor's title,
      // or its visible text. Truncated to keep prop sizes sane.
      const context =
        anchor.dataset.analyticsContext ||
        anchor.getAttribute("title") ||
        (anchor.textContent || "").trim().slice(0, 64) ||
        undefined;

      track.outboundLinkClicked(absolute.href, context);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
