"use client";

import { Bookmark } from "lucide-react";
import { useBookmarks } from "@/lib/bookmarks";
import { useEffect, useState } from "react";

export default function BookmarkButton({ id }: { id: string }) {
  const [mounted, setMounted] = useState(false);
  const toggle = useBookmarks((s) => s.toggle);
  const bookmarks = useBookmarks((s) => s.bookmarks);
  const has = bookmarks.includes(id);

  useEffect(() => setMounted(true), []);

  return (
    <button
      onClick={() => toggle(id)}
      className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border transition-colors ${
        mounted && has
          ? "border-[color:var(--color-brand)] text-[color:var(--color-brand)] bg-[color:var(--color-brand)]/10"
          : "border-[color:var(--color-border)] hover:border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-bg-elev)]"
      }`}
    >
      <Bookmark className={`w-3.5 h-3.5 ${mounted && has ? "fill-current" : ""}`} />
      <span>{mounted && has ? "Bookmarked" : "Bookmark"}</span>
    </button>
  );
}
