"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { track } from "@/lib/analytics";
import { formatNumber } from "@/lib/utils";

export default function LikeButton({
  id,
  initial,
  category,
}: {
  id: string;
  initial: number;
  category?: string;
}) {
  const router = useRouter();
  const [count, setCount] = useState(initial);
  const [liked, setLiked] = useState(false);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (liked || pending) return;
    setLiked(true);
    setCount((c) => c + 1);
    track.skillLiked(id, category ?? "");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/skills/${id}/like`, { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.likes === "number") setCount(data.likes);
          // Invalidate the surrounding RSC tree so SkillCards on the same page
          // (related rail, trending grid) re-render with the new count.
          router.refresh();
        }
      } catch {
        // ignore, optimistic stays
      }
    });
  }

  return (
    <button
      onClick={onClick}
      disabled={liked}
      className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border transition-colors ${
        liked
          ? "border-[color:var(--color-brand)] text-[color:var(--color-brand)] bg-[color:var(--color-brand)]/10"
          : "border-[color:var(--color-border)] hover:border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-bg-elev)]"
      }`}
    >
      <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} />
      <span>{formatNumber(count)}</span>
    </button>
  );
}
