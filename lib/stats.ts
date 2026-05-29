import { cache } from "react";
import { storage } from "./storage";
import { getAllSkills } from "./skills";

/**
 * Live stats from KV (Upstash), merged with a tiny deterministic tiebreaker
 * so skills with identical engagement (e.g. both at 0) still get a stable
 * order rather than thrashing between renders.
 *
 * `popularity` is a real ranking score: downloads dominate (the explicit
 * signal we capture on every page-load and CLI install), likes are weighted,
 * and the seed only breaks ties at the bottom of the distribution. As soon
 * as a skill earns even one download it leapfrogs every zero-engagement
 * skill in the trending grid.
 */
function seedScore(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  // Range 0..0.999 - large enough to break ties deterministically, small
  // enough that one real interaction (likes or downloads) outranks it.
  return (h % 1000) / 1000;
}

export const getStatsMap = cache(async () => {
  const skills = getAllSkills();
  const ids = skills.map((s) => s.id);
  const live = await storage().getMany(ids);
  const map: Record<string, { likes: number; downloads: number; popularity: number }> = {};
  for (const s of skills) {
    const l = live[s.id]?.likes ?? 0;
    const d = live[s.id]?.downloads ?? 0;
    map[s.id] = {
      likes: l,
      downloads: d,
      // Downloads weight 2x likes; seed (<1) is just a tiebreaker.
      popularity: d * 2 + l + seedScore(s.id),
    };
  }
  return map;
});

export async function getTopSkills(limit = 10) {
  const skills = getAllSkills();
  const map = await getStatsMap();
  return [...skills]
    .map((s) => ({ ...s, ...map[s.id] }))
    .sort((a, b) => {
      // Primary: downloads (the explicit consumption signal the user
      // sees on every card). Secondary: likes. Tertiary: seed tiebreaker
      // via popularity so a tie at 0/0 is stable instead of random.
      if (b.downloads !== a.downloads) return b.downloads - a.downloads;
      if (b.likes !== a.likes) return b.likes - a.likes;
      return b.popularity - a.popularity;
    })
    .slice(0, limit);
}
