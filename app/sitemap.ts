import type { MetadataRoute } from "next";
import { getAllSkills, getAllCategories } from "@/lib/skills";

const BASE = "https://skills.mercuryagent.sh";

export default function sitemap(): MetadataRoute.Sitemap {
  const skills = getAllSkills();
  const cats = getAllCategories();
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, priority: 1 },
    { url: `${BASE}/leaderboard`, lastModified: now, priority: 0.5 },
    ...cats.map((c) => ({
      url: `${BASE}/category/${c.slug}`,
      lastModified: now,
      priority: 0.6,
    })),
    ...skills.map((s) => ({
      url: `${BASE}/skills/${s.id}`,
      lastModified: new Date(s.updatedAt),
      priority: 0.8,
    })),
  ];
}
