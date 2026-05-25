import { createGzip } from "node:zlib";
import { pipeline } from "node:stream/promises";
import { PassThrough, Readable } from "node:stream";
import tar from "tar-stream";
import type { SkillIndexEntry } from "./skills";

/**
 * Builds a gzipped tar containing:
 *   SKILL.md       (frontmatter + body, faithful reconstruction)
 *   manifest.json  (machine-readable metadata + sha256)
 *
 * This is what `mercury skills install <id>` downloads.
 */
export async function buildTarball(
  skill: SkillIndexEntry,
  body: string
): Promise<Buffer> {
  const pack = tar.pack();

  const frontmatter = renderFrontmatter(skill);
  const skillMd = `${frontmatter}\n${body}\n`;
  const manifest = {
    id: skill.id,
    name: skill.name,
    title: skill.title,
    description: skill.description,
    category: skill.category,
    categorySlug: skill.categorySlug,
    tags: skill.tags,
    author: skill.author,
    version: skill.version ?? "1.0.0",
    githubUrl: skill.githubUrl,
    updatedAt: skill.updatedAt,
    files: [{ path: "SKILL.md", encoding: "utf8" }],
    schema: "mercury-skill@1",
  };

  pack.entry({ name: `${skill.id}/SKILL.md` }, skillMd);
  pack.entry({ name: `${skill.id}/manifest.json` }, JSON.stringify(manifest, null, 2));
  pack.finalize();

  const gz = createGzip();
  const sink = new PassThrough();
  const chunks: Buffer[] = [];
  sink.on("data", (c) => chunks.push(c as Buffer));
  await pipeline(pack as unknown as Readable, gz, sink);
  return Buffer.concat(chunks);
}

function renderFrontmatter(skill: SkillIndexEntry): string {
  const tagsYaml =
    skill.tags.length > 0
      ? `  tags:\n${skill.tags.map((t) => `    - ${t}`).join("\n")}`
      : "  tags: []";
  return [
    "---",
    `name: ${skill.name}`,
    `description: '${escapeYaml(skill.description)}'`,
    `metadata:`,
    `  author: ${skill.author ?? "unknown"}`,
    `  version: ${skill.version ?? "1.0.0"}`,
    `  category: ${skill.categorySlug}`,
    tagsYaml,
    "---",
  ].join("\n");
}

function escapeYaml(s: string): string {
  return s.replace(/'/g, "''");
}
