/**
 * Plausible Analytics integration.
 *
 * Typed wrapper around `window.plausible(...)` that:
 *   - silently no-ops if the script hasn't loaded (SSR, ad-blockers, dev
 *     with no analytics configured)
 *   - documents every custom event we emit so the dashboard goals are
 *     discoverable from one file
 *   - keeps prop keys snake_case to match Plausible's recommended convention
 *
 * Dashboard goals to create (Settings -> Goals -> + New Goal -> Custom event):
 *
 *   1. Skill Viewed              props: skill_id, category, version
 *   2. Skill Liked               props: skill_id, category
 *   3. Skill Bookmarked          props: skill_id, category
 *   4. Skill Bookmark Removed    props: skill_id, category
 *   5. Skill Shared              props: skill_id, target  (target = twitter|linkedin|facebook|whatsapp|reddit|native)
 *   6. Skill Link Copied         props: skill_id
 *   7. Install Tab Switched      props: skill_id, agent   (agent = mercury|claude-code|codex|openclaw|hermes|other)
 *   8. Install Step Copied       props: skill_id, agent, step
 *   9. Search Performed          props: query, results_count
 *  10. Theme Toggled             props: to                (to = dark|light)
 *  11. Outbound Link Clicked     props: url, host, context
 *
 * Plausible also tracks page views automatically via the script - no goal
 * needed for those; they appear under "Top Pages" out of the box.
 */

type PlausibleProps = Record<string, string | number | boolean | undefined>;

type PlausibleFn = (
  event: string,
  options?: { props?: PlausibleProps; callback?: () => void },
) => void;

declare global {
  interface Window {
    plausible?: PlausibleFn & { q?: unknown[] };
  }
}

/**
 * Internal: fire-and-forget event sender. Strips undefined props (Plausible
 * rejects them) and swallows all errors so analytics can never crash the UI.
 */
function send(event: string, props?: PlausibleProps): void {
  if (typeof window === "undefined") return;
  try {
    const fn = window.plausible;
    if (typeof fn !== "function") return;
    const cleanProps = props
      ? Object.fromEntries(
          Object.entries(props).filter(([, v]) => v !== undefined && v !== ""),
        )
      : undefined;
    fn(event, cleanProps ? { props: cleanProps } : undefined);
  } catch {
    // never let analytics break the page
  }
}

// --- High-level event API ---------------------------------------------------

export const track = {
  skillViewed(skillId: string, category: string, version?: string) {
    send("Skill Viewed", { skill_id: skillId, category, version });
  },

  skillLiked(skillId: string, category: string) {
    send("Skill Liked", { skill_id: skillId, category });
  },

  skillBookmarked(skillId: string, category?: string) {
    send("Skill Bookmarked", { skill_id: skillId, category });
  },

  skillBookmarkRemoved(skillId: string, category?: string) {
    send("Skill Bookmark Removed", { skill_id: skillId, category });
  },

  skillShared(
    skillId: string,
    target:
      | "twitter"
      | "linkedin"
      | "facebook"
      | "whatsapp"
      | "reddit"
      | "native",
  ) {
    send("Skill Shared", { skill_id: skillId, target });
  },

  skillLinkCopied(skillId: string) {
    send("Skill Link Copied", { skill_id: skillId });
  },

  installTabSwitched(skillId: string, agent: string) {
    send("Install Tab Switched", { skill_id: skillId, agent });
  },

  installStepCopied(skillId: string, agent: string, step: number | string) {
    send("Install Step Copied", {
      skill_id: skillId,
      agent,
      step: String(step),
    });
  },

  searchPerformed(query: string, resultsCount: number) {
    // Truncate to protect Plausible's 2KB prop limit and avoid leaking PII.
    const q = query.trim().slice(0, 64);
    if (!q) return;
    send("Search Performed", { query: q, results_count: resultsCount });
  },

  themeToggled(to: "dark" | "light") {
    send("Theme Toggled", { to });
  },

  outboundLinkClicked(url: string, context?: string) {
    let host = "";
    try {
      host = new URL(url).host;
    } catch {
      // not a valid absolute URL - bail
      return;
    }
    send("Outbound Link Clicked", { url, host, context });
  },
};
