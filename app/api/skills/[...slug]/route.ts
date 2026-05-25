import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getSkillById, getSkillBody } from "@/lib/skills";
import { storage } from "@/lib/storage";
import { buildTarball } from "@/lib/tarball";

export const revalidate = 60;

const ACTIONS = new Set(["like", "download", "install"]);

function parseSlug(slug: string[]): { id: string; action: string | null } {
  if (slug.length >= 2 && ACTIONS.has(slug[slug.length - 1])) {
    return {
      id: slug.slice(0, -1).join("/"),
      action: slug[slug.length - 1],
    };
  }
  return { id: slug.join("/"), action: null };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const { id, action } = parseSlug(slug);
  const skill = getSkillById(id);
  if (!skill) return NextResponse.json({ error: "not found", id }, { status: 404 });

  if (action === "install") {
    // increment download count, return tarball
    await storage().incrementDownload(id);
    const body = getSkillBody(id);
    const tar = await buildTarball(skill, body);
    return new Response(tar as BodyInit, {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="${id.replace(/\//g, "_")}.tar.gz"`,
        "Cache-Control": "public, max-age=60",
      },
    });
  }

  // default: detail JSON
  const body = getSkillBody(id);
  const stats = await storage().get(id);
  const sha = createHash("sha256").update(body).digest("hex").slice(0, 16);

  return NextResponse.json({
    ...skill,
    body,
    sha,
    stats,
    installUrl: `/api/skills/${id}/install`,
  });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const { id, action } = parseSlug(slug);
  if (!action) return NextResponse.json({ error: "missing action" }, { status: 400 });
  const skill = getSkillById(id);
  if (!skill) return NextResponse.json({ error: "not found", id }, { status: 404 });

  const s = storage();
  if (action === "like") {
    const likes = await s.incrementLike(id);
    return NextResponse.json({ id, likes });
  }
  if (action === "download") {
    const downloads = await s.incrementDownload(id);
    return NextResponse.json({ id, downloads });
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
