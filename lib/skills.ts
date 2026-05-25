import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export interface SkillIndexEntry {
  id: string;
  slug: string;
  category: string;
  categorySlug: string;
  name: string;
  title: string;
  description: string;
  tags: string[];
  author?: string;
  version?: string;
  icon?: string;
  readingTime: number;
  headings: { depth: number; text: string; slug: string }[];
  excerpt: string;
  githubUrl: string;
  updatedAt: string;
}

export interface CategorySummary {
  slug: string;
  name: string;
  count: number;
}

interface SkillIndexFile {
  skills: SkillIndexEntry[];
  categories: CategorySummary[];
  generatedAt: string;
}

const CONTENT_DIR = join(process.cwd(), "content");
const INDEX_PATH = join(CONTENT_DIR, "skills.json");
const SKILLS_DIR = join(CONTENT_DIR, "skills");

let cached: SkillIndexFile | null = null;

function loadIndex(): SkillIndexFile {
  if (cached) return cached;
  if (!existsSync(INDEX_PATH)) {
    cached = { skills: [], categories: [], generatedAt: new Date().toISOString() };
    return cached;
  }
  cached = JSON.parse(readFileSync(INDEX_PATH, "utf8")) as SkillIndexFile;
  return cached;
}

export function getAllSkills(): SkillIndexEntry[] {
  return loadIndex().skills;
}

export function getAllCategories(): CategorySummary[] {
  return loadIndex().categories;
}

export function getSkillById(id: string): SkillIndexEntry | undefined {
  return loadIndex().skills.find((s) => s.id === id);
}

export function getSkillsByCategory(categorySlug: string): SkillIndexEntry[] {
  return loadIndex().skills.filter((s) => s.categorySlug === categorySlug);
}

export function getCategory(slug: string): CategorySummary | undefined {
  return loadIndex().categories.find((c) => c.slug === slug);
}

export function getSkillBody(id: string): string {
  const fname = `${id.replace(/\//g, "__")}.mdx`;
  const fpath = join(SKILLS_DIR, fname);
  if (!existsSync(fpath)) return "";
  return readFileSync(fpath, "utf8");
}

export function listSkillIds(): string[] {
  if (!existsSync(SKILLS_DIR)) return [];
  return readdirSync(SKILLS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, "").replace(/__/g, "/"));
}

export function getRelatedSkills(id: string, limit = 4): SkillIndexEntry[] {
  const skill = getSkillById(id);
  if (!skill) return [];
  const others = getAllSkills().filter((s) => s.id !== id);
  const scored = others.map((s) => {
    let score = 0;
    if (s.categorySlug === skill.categorySlug) score += 5;
    const overlap = s.tags.filter((t) => skill.tags.includes(t)).length;
    score += overlap * 2;
    return { s, score };
  });
  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.s);
}
