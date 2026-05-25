import { NextResponse } from "next/server";
import { getAllSkills } from "@/lib/skills";
import { getStatsMap } from "@/lib/stats";

export const revalidate = 60;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.toLowerCase().trim();
  const category = url.searchParams.get("category");
  const tag = url.searchParams.get("tag");
  const sort = url.searchParams.get("sort") ?? "popular";
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10) || 100, 500);

  let skills = getAllSkills();
  const stats = await getStatsMap();
  let enriched = skills.map((s) => ({ ...s, ...stats[s.id] }));

  if (category) enriched = enriched.filter((s) => s.categorySlug === category);
  if (tag) enriched = enriched.filter((s) => s.tags.includes(tag));
  if (q) {
    enriched = enriched.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (sort === "newest") enriched.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  else if (sort === "name") enriched.sort((a, b) => a.name.localeCompare(b.name));
  else enriched.sort((a, b) => b.popularity - a.popularity);

  enriched = enriched.slice(0, limit);

  return NextResponse.json({
    count: enriched.length,
    skills: enriched.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      title: s.title,
      category: s.category,
      categorySlug: s.categorySlug,
      description: s.description,
      tags: s.tags,
      author: s.author,
      version: s.version,
      readingTime: s.readingTime,
      githubUrl: s.githubUrl,
      updatedAt: s.updatedAt,
      stats: { likes: s.likes, downloads: s.downloads },
      installUrl: `/api/skills/${s.id}/install`,
      detailUrl: `/api/skills/${s.id}`,
      pageUrl: `/skills/${s.id}`,
    })),
  });
}
