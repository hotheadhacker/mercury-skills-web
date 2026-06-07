import Link from "next/link";
import type { SkillIndexEntry } from "@/lib/skills";
import { formatNumber } from "@/lib/utils";
import { User } from "lucide-react";

interface Props {
  skill: SkillIndexEntry;
  stats?: { likes: number; downloads: number };
}

export default function SkillCard({ skill, stats }: Props) {
  return (
    <Link
      href={`/skills/${skill.id}`}
      className="group relative flex flex-col gap-3 p-5 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] hover:border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-bg-elev-2)] transition-colors"
    >
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[color:var(--color-fg-subtle)]">
        <span className="flex items-center gap-2">
          <span>{skill.category}</span>
          {skill.author && (
            skill.authorUrl ? (
              <a
                href={skill.authorUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-0.5 hover:text-[color:var(--color-fg-muted)] transition-colors"
              >
                <User className="w-2.5 h-2.5" /> {skill.author}
              </a>
            ) : (
              <span className="inline-flex items-center gap-0.5">
                <User className="w-2.5 h-2.5" /> {skill.author}
              </span>
            )
          )}
        </span>
        {skill.version && <span className="font-mono">v{skill.version}</span>}
      </div>
      <h3 className="text-lg font-semibold text-[color:var(--color-fg)] leading-snug tracking-tight">
        {skill.title}
      </h3>
      <p className="text-[15px] text-[color:var(--color-fg-muted)] line-clamp-3 leading-relaxed">
        {skill.description}
      </p>
      <div className="mt-auto flex items-center justify-between pt-2">
        <div className="flex flex-wrap gap-1.5">
          {skill.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[color:var(--color-border)] text-[color:var(--color-fg-muted)]"
            >
              {t}
            </span>
          ))}
        </div>
        {stats && (
          <div className="flex items-center gap-3 text-xs text-[color:var(--color-fg-subtle)] font-mono">
            <span>♥ {formatNumber(stats.likes)}</span>
            <span>↓ {formatNumber(stats.downloads)}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
