import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getAllSkills, getSkillBody } from "@/lib/skills";

export const revalidate = 300;

export async function GET() {
  const skills = getAllSkills();
  const entries = skills.map((s) => {
    const body = getSkillBody(s.id);
    const sha = createHash("sha256").update(body).digest("hex");
    return {
      id: s.id,
      name: s.name,
      title: s.title,
      description: s.description,
      category: s.category,
      categorySlug: s.categorySlug,
      tags: s.tags,
      author: s.author,
      version: s.version ?? "1.0.0",
      sha,
      size: Buffer.byteLength(body, "utf8"),
      updatedAt: s.updatedAt,
      installUrl: `/api/skills/${s.id}/install`,
      detailUrl: `/api/skills/${s.id}`,
      pageUrl: `https://skills.mercuryagent.sh/skills/${s.id}`,
    };
  });

  return NextResponse.json({
    schema: "mercury-skills-registry@1",
    generatedAt: new Date().toISOString(),
    count: entries.length,
    skills: entries,
  });
}
