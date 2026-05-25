import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getSkillById, getSkillBody } from "@/lib/skills";
import { storage } from "@/lib/storage";
import { buildTarball } from "@/lib/tarball";

// Must be dynamic: GET ?action=install has a side-effect (incrementDownload),
// and stats reads must always reflect the latest Redis value. Static caching
// (revalidate / force-static) would freeze counters and skip the increment.
export const dynamic = "force-dynamic";

const ACTIONS = new Set(["like", "download", "install"]);

// Anything matching this is treated as a "real" install from a client that
// fetched the skill in order to install it locally (Mercury CLI, the web
// dashboard's install-from-registry handler, the Telegram bot, etc.).
// Casual browsers hitting the JSON detail route from the website use the
// default browser UA and are intentionally excluded.
const CLIENT_UA = /^mercury-cli\//i;

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
  req: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const { id, action } = parseSlug(slug);
  const skill = getSkillById(id);
  if (!skill) return NextResponse.json({ error: "not found", id }, { status: 404 });

  if (action === "install") {
    // Tarball endpoint - always counts as an install regardless of UA, since
    // the only reason to fetch the .tar.gz is to install.
    await storage().incrementDownload(id);
    const body = getSkillBody(id);
    const tar = await buildTarball(skill, body);
    return new Response(tar as BodyInit, {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="${id.replace(/\//g, "_")}.tar.gz"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // Default: detail JSON. The Mercury CLI (and other first-party clients)
  // use this endpoint to fetch SKILL.md content for local install - they
  // reconstruct the file from frontmatter + body, avoiding a tar parser.
  // Recognise those clients via user-agent and increment downloads here too.
  const body = getSkillBody(id);
  const ua = req.headers.get("user-agent") ?? "";
  const isInstallClient = CLIENT_UA.test(ua);
  const stats = isInstallClient
    ? { ...(await storage().get(id)), downloads: await storage().incrementDownload(id) }
    : await storage().get(id);
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
