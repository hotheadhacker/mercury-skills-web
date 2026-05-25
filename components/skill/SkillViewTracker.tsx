"use client";

/**
 * Fires a single "Skill Viewed" custom event when the skill page mounts.
 * Plausible's automatic page-view tracking already captures the URL, but
 * this enriches the data with skill-specific dimensions (category, version)
 * so the dashboard can rank skills by views regardless of URL changes /
 * canonicalization.
 *
 * Strict-Mode safe: a ref guards against the dev-mode double-mount.
 */
import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

export default function SkillViewTracker({
  skillId,
  category,
  version,
}: {
  skillId: string;
  category: string;
  version?: string;
}) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track.skillViewed(skillId, category, version);
  }, [skillId, category, version]);
  return null;
}
