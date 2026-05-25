"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useBookmarks } from "@/lib/bookmarks";
import { Bookmark } from "lucide-react";

interface LiteSkill {
  id: string;
  title: string;
  description: string;
  category: string;
  categorySlug: string;
  tags: string[];
  readingTime: number;
}

export default function BookmarksClient({ skills }: { skills: LiteSkill[] }) {
  const [mounted, setMounted] = useState(false);
  const ids = useBookmarks((s) => s.bookmarks);
  const clear = useBookmarks((s) => s.clear);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const set = new Set(ids);
  const saved = skills.filter((s) => set.has(s.id));

  if (saved.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 rounded-xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)]">
        <Bookmark className="w-8 h-8 text-[color:var(--color-fg-subtle)] mb-3" />
        <h3 className="text-lg font-medium">No bookmarks yet</h3>
        <p className="text-sm text-[color:var(--color-fg-muted)] mt-1 max-w-sm">
          Tap the bookmark icon on any skill page to save it here for later.
        </p>
        <Link
          href="/"
          className="mt-5 inline-block text-sm px-4 py-2 rounded-md border border-[color:var(--color-border)] hover:border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-bg-elev-2)]"
        >
          Browse skills
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[color:var(--color-fg-muted)]">
          {saved.length} saved skill{saved.length === 1 ? "" : "s"}
        </p>
        <button
          onClick={() => {
            if (confirm("Clear all bookmarks?")) clear();
          }}
          className="text-xs text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-danger)]"
        >
          Clear all
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {saved.map((s) => (
          <Link
            key={s.id}
            href={`/skills/${s.id}`}
            className="group flex flex-col gap-3 p-5 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] hover:border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-bg-elev-2)] transition-colors"
          >
            <div className="text-[11px] uppercase tracking-wider font-mono text-[color:var(--color-fg-subtle)]">
              {s.category}
            </div>
            <h3 className="text-base font-medium leading-snug">{s.title}</h3>
            <p className="text-sm text-[color:var(--color-fg-muted)] line-clamp-2">{s.description}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
