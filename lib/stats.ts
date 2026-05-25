import { cache } from "react";
import { storage } from "./storage";
import { getAllSkills } from "./skills";

/**
 * Combines static popularity (a deterministic placeholder so the leaderboard
 * isn't empty before any user interactions) with live stats from KV.
 *
 * The static seed is derived from the skill id hash so ordering is stable.
 */
function seedScore(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 50; // 0..49 baseline
}

export const getStatsMap = cache(async () => {
  const skills = getAllSkills();
  const ids = skills.map((s) => s.id);
  const live = await storage().getMany(ids);
  const map: Record<string, { likes: number; downloads: number; popularity: number }> = {};
  for (const s of skills) {
    const seed = seedScore(s.id);
    const l = live[s.id]?.likes ?? 0;
    const d = live[s.id]?.downloads ?? 0;
    map[s.id] = {
      likes: l,
      downloads: d,
      // weighted: downloads count more than likes; seed keeps deterministic baseline.
      popularity: l + d * 2 + seed,
    };
  }
  return map;
});

export async function getTopSkills(limit = 10) {
  const skills = getAllSkills();
  const map = await getStatsMap();
  return [...skills]
    .map((s) => ({ ...s, ...map[s.id] }))
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}
