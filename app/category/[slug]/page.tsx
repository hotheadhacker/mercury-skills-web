import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategory, getSkillsByCategory, getAllCategories } from "@/lib/skills";
import { getStatsMap } from "@/lib/stats";
import SkillCard from "@/components/skill/SkillCard";

// Category pages render skill cards with live like/download badges, so they
// must read fresh stats on every request. `generateStaticParams` is retained
// for the metadata pipeline (sitemap, prefetch hints) but Next 16 still
// renders dynamically when `dynamic = "force-dynamic"` is set.
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return getAllCategories().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat) return {};
  return {
    title: `${cat.name} skills`,
    description: `Browse ${cat.count} ${cat.name.toLowerCase()} skills for the Mercury Agent.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat) notFound();
  const skills = getSkillsByCategory(slug);
  const stats = await getStatsMap();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <nav className="text-xs font-mono text-[color:var(--color-fg-subtle)] mb-6">
        <Link href="/" className="hover:text-[color:var(--color-fg-muted)]">
          /
        </Link>{" "}
        › <span className="text-[color:var(--color-fg-muted)]">{cat.name}</span>
      </nav>
      <header className="space-y-3 mb-10">
        <div className="text-xs uppercase tracking-wider font-mono text-[color:var(--color-fg-subtle)]">
          Category
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">{cat.name}</h1>
        <p className="text-sm text-[color:var(--color-fg-muted)]">
          {cat.count} skill{cat.count === 1 ? "" : "s"} in this category.
        </p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.map((s) => (
          <SkillCard key={s.id} skill={s} stats={stats[s.id]} />
        ))}
      </div>
    </div>
  );
}
