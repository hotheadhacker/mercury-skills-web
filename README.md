# Mercury Skills Web

The web platform for **Mercury Skills** — a searchable, browsable hub for the agent skills published in the [Mercury Skills](https://github.com/cosmicstack-labs/mercury-agent-skills) main branch.

Live at: **[skills.mercuryagent.sh](https://skills.mercuryagent.sh)**

> This branch (`web-platform`) is an **orphan branch** that contains only the Next.js application. Skills content lives on `main`; a GitHub Action mirrors `SKILL.md` files into this branch on every change.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, RSC) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + custom design tokens |
| Content | MDX via `next-mdx-remote` + Shiki (server-rendered code highlighting) |
| Search | FlexSearch (client-side fuzzy search over a pre-built index) |
| Counts | Vercel KV (Upstash Redis) — abstracted behind `lib/storage.ts`, swappable for Mongo |
| Bookmarks | Zustand + `localStorage` (fully client-side) |
| Hosting | Vercel (edge functions + ISR) |

---

## Local development

```bash
pnpm install
pnpm dev
```

The dev server runs `pnpm build:skills` first, which walks the synced `categories/` tree and emits:

- `content/skills.json` — flat index used by listings and the API
- `content/skills/<id>.mdx` — per-skill MDX file rendered on detail pages
- `content/search-index.json` — pre-built FlexSearch index loaded by the client

When the `categories/` directory is empty (e.g. immediately after the orphan branch is cut), the script emits empty artifacts and the site still builds. In CI the GitHub Action populates `categories/` from `main` before building.

---

## Environment variables

| Var | Required? | Purpose |
|---|---|---|
| `KV_REST_API_URL` | Production | Vercel KV endpoint |
| `KV_REST_API_TOKEN` | Production | Vercel KV token |
| `KV_REST_API_READ_ONLY_TOKEN` | Optional | Read-only KV reads from client |

In local development the storage layer falls back to a `data/stats.local.json` file.

---

## Branch & deployment topology

```
main  ─── SKILL.md content (source of truth)
  │
  └─►  .github/workflows/sync-to-web.yml  (runs on push to main when categories/** changes)
          │
          └─► force-pushes categories/ into web-platform branch
                │
                └─► Vercel auto-deploys web-platform → skills.mercuryagent.sh
```

---

## CLI integration

The site exposes a stable JSON registry consumed by the Mercury Agent CLI. See [docs/cli-integration.md](./docs/cli-integration.md) for the contract.

Quick reference:

```bash
mercury skills search <query>
mercury skills install <category>/<slug>
mercury skills list
```

---

## License

MIT — same as the parent repository.
