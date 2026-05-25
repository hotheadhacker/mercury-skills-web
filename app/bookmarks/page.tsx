import BookmarksClient from "./BookmarksClient";
import { getAllSkills } from "@/lib/skills";

export const metadata = {
  title: "Bookmarks",
  description: "Your saved Mercury skills.",
};

export default function BookmarksPage() {
  const skills = getAllSkills();
  // Pass full index to client; small enough (~50KB) for instant filtering.
  const lite = skills.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    category: s.category,
    categorySlug: s.categorySlug,
    tags: s.tags,
    readingTime: s.readingTime,
  }));
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="space-y-3 mb-10">
        <div className="text-xs uppercase tracking-wider font-mono text-[color:var(--color-fg-subtle)]">
          Saved
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">Your bookmarks</h1>
        <p className="text-sm text-[color:var(--color-fg-muted)] max-w-xl">
          Bookmarks are stored privately in your browser. Sign-in support is coming with the next
          release.
        </p>
      </header>
      <BookmarksClient skills={lite} />
    </div>
  );
}
