import Link from "next/link";
import { getAllSkills } from "@/lib/skills";
import { getStatsMap } from "@/lib/stats";
import { formatNumber } from "@/lib/utils";
import { Trophy, Heart, Download } from "lucide-react";

// Leaderboard must reflect the latest counts on every visit; static caching
// would freeze rankings between revalidations and defeat the page's purpose.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Leaderboard",
  description: "The most-liked and most-downloaded Mercury skills.",
};

export default async function LeaderboardPage() {
  const skills = getAllSkills();
  const stats = await getStatsMap();
  const enriched = skills.map((s) => ({ ...s, ...stats[s.id] }));

  const topLikes = [...enriched].sort((a, b) => b.likes - a.likes).slice(0, 20);
  const topDownloads = [...enriched].sort((a, b) => b.downloads - a.downloads).slice(0, 20);
  const topOverall = [...enriched].sort((a, b) => b.popularity - a.popularity).slice(0, 20);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="space-y-3 mb-12">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-[color:var(--color-fg-subtle)] uppercase tracking-wider">
          <Trophy className="w-3.5 h-3.5" /> Leaderboard
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">Top skills</h1>
        <p className="text-sm text-[color:var(--color-fg-muted)] max-w-xl">
          Ranked by community engagement. Likes are weighted alongside downloads from the Mercury CLI.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Board title="Overall" icon={<Trophy className="w-3.5 h-3.5" />} items={topOverall} kind="overall" />
        <Board title="Most liked" icon={<Heart className="w-3.5 h-3.5" />} items={topLikes} kind="likes" />
        <Board
          title="Most downloaded"
          icon={<Download className="w-3.5 h-3.5" />}
          items={topDownloads}
          kind="downloads"
        />
      </div>
    </div>
  );
}

function Board({
  title,
  icon,
  items,
  kind,
}: {
  title: string;
  icon: React.ReactNode;
  items: { id: string; title: string; category: string; likes: number; downloads: number; popularity: number }[];
  kind: "overall" | "likes" | "downloads";
}) {
  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[color:var(--color-border)] flex items-center gap-2 text-xs uppercase tracking-wider font-mono text-[color:var(--color-fg-muted)]">
        {icon}
        {title}
      </div>
      <ol className="divide-y divide-[color:var(--color-border)]">
        {items.map((s, i) => {
          const stat = kind === "likes" ? s.likes : kind === "downloads" ? s.downloads : s.popularity;
          return (
            <li key={s.id}>
              <Link
                href={`/skills/${s.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[color:var(--color-bg-elev-2)]"
              >
                <span className="w-5 text-xs font-mono text-[color:var(--color-fg-subtle)] text-right">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.title}</div>
                  <div className="text-[11px] uppercase font-mono text-[color:var(--color-fg-subtle)] mt-0.5">
                    {s.category}
                  </div>
                </div>
                <span className="text-xs font-mono text-[color:var(--color-fg-muted)]">{formatNumber(Math.round(stat))}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
