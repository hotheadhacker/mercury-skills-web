import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-32 text-center">
      <div className="text-xs font-mono text-[color:var(--color-fg-subtle)] uppercase tracking-wider">
        404
      </div>
      <h1 className="text-4xl font-semibold tracking-tight mt-3">Skill not found</h1>
      <p className="text-[color:var(--color-fg-muted)] mt-3">
        That skill doesn&apos;t exist in this registry — yet. Search the catalogue or browse by
        category.
      </p>
      <Link
        href="/"
        className="inline-block mt-8 text-sm px-4 py-2 rounded-md border border-[color:var(--color-border)] hover:border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-bg-elev)]"
      >
        Go home
      </Link>
    </div>
  );
}
