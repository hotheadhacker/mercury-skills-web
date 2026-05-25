import Link from "next/link";
import { BookmarkIcon, TrophyIcon, GithubIcon } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[color:var(--color-bg)]/80 border-b border-[color:var(--color-border)]">
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-block w-5 h-5 rounded-full bg-[color:var(--color-brand)]" />
          <span>Mercury Skills</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm text-[color:var(--color-fg-muted)]">
          <Link
            href="/leaderboard"
            className="px-3 py-1.5 rounded-md hover:bg-[color:var(--color-bg-elev)] hover:text-[color:var(--color-fg)] inline-flex items-center gap-1.5"
          >
            <TrophyIcon className="w-3.5 h-3.5" />
            Leaderboard
          </Link>
          <Link
            href="/bookmarks"
            className="px-3 py-1.5 rounded-md hover:bg-[color:var(--color-bg-elev)] hover:text-[color:var(--color-fg)] inline-flex items-center gap-1.5"
          >
            <BookmarkIcon className="w-3.5 h-3.5" />
            Bookmarks
          </Link>
          <a
            href="https://github.com/cosmicstack-labs/mercury-agent-skills"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-md hover:bg-[color:var(--color-bg-elev)] hover:text-[color:var(--color-fg)] inline-flex items-center gap-1.5"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            GitHub
          </a>
          <div className="w-px h-5 bg-[color:var(--color-border)] mx-1" />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
