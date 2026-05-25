# Mercury Skills — CLI Integration Contract

This document specifies the contract between the Mercury Skills web platform (`skills.mercuryagent.sh`) and the **Mercury CLI** / **Mercury Agent**.

The CLI is the primary consumer of this registry, similar to how Claude Code consumes the Claude Skills hub. The web UI and CLI share one source of truth.

---

## Base URL

```
https://skills.mercuryagent.sh
```

All endpoints return JSON unless otherwise noted. CORS is open for `GET` requests.

---

## Endpoints

### `GET /api/feed.json`

The full registry. Use this for `mercury skills sync` and `mercury skills search` (with local filtering).

```jsonc
{
  "schema": "mercury-skills-registry@1",
  "generatedAt": "2026-01-15T12:00:00.000Z",
  "count": 126,
  "skills": [
    {
      "id": "ai-ml/agent-audit-logging",
      "name": "agent-audit-logging",
      "title": "Agent Audit Log Reporting",
      "description": "...",
      "category": "Ai Ml",
      "categorySlug": "ai-ml",
      "tags": ["audit-logging", "compliance"],
      "author": "cosmicstack-labs",
      "version": "1.0.0",
      "sha": "<sha256 of SKILL.md body>",
      "size": 24512,
      "updatedAt": "2026-01-10T10:00:00.000Z",
      "installUrl": "/api/skills/ai-ml/agent-audit-logging/install",
      "detailUrl": "/api/skills/ai-ml/agent-audit-logging",
      "pageUrl": "https://skills.mercuryagent.sh/skills/ai-ml/agent-audit-logging"
    }
  ]
}
```

The CLI should cache this response by `generatedAt` and use `sha` to detect changes per-skill (skip downloads when unchanged).

---

### `GET /api/skills?q=&category=&tag=&sort=&limit=`

Filtered skill list (server-side). Useful for `mercury skills search` when the CLI wants a thin response.

| Query | Description |
|---|---|
| `q` | Free-text search across name, title, description, tags |
| `category` | Filter by `categorySlug` |
| `tag` | Filter by exact tag |
| `sort` | `popular` (default), `newest`, `name` |
| `limit` | Max results (default 100, max 500) |

---

### `GET /api/skills/<id>`

Full detail including the rendered SKILL.md body, SHA, and live stats.

```jsonc
{
  "id": "ai-ml/agent-audit-logging",
  "body": "# Agent Audit Log Reporting\n\n## Overview\n...",
  "sha": "abc123...",
  "stats": { "likes": 12, "downloads": 47 },
  "installUrl": "/api/skills/ai-ml/agent-audit-logging/install"
}
```

---

### `GET /api/skills/<id>/install`

Returns a gzipped tar archive containing the skill. **This is what `mercury skills install` downloads.** The endpoint also atomically increments the download counter.

Archive layout:

```
<id>/
├── SKILL.md           # Verbatim reconstruction of the original file
└── manifest.json      # Machine-readable metadata
```

Headers:

```
Content-Type: application/gzip
Content-Disposition: attachment; filename="ai-ml_agent-audit-logging.tar.gz"
```

The CLI should:
1. Download the tarball.
2. Verify `manifest.json` matches expectations.
3. Extract to `~/.mercury/skills/<id>/`.
4. Record installation in the local lockfile (`~/.mercury/skills.lock.json`).

---

### `POST /api/skills/<id>/like`

Increments the like counter for a skill. Rate-limited per IP in production.

```json
{ "id": "ai-ml/agent-audit-logging", "likes": 13 }
```

### `POST /api/skills/<id>/download`

Increments the download counter without returning a tarball. The `/install` endpoint does this automatically, so the CLI usually doesn't need this.

---

## Suggested CLI Surface

```bash
# Search the registry (uses /api/feed.json with local fuzzy search)
mercury skills search <query>

# Show details for a skill (uses /api/skills/<id>)
mercury skills show <id>

# Install a skill (uses /api/skills/<id>/install)
mercury skills install <id>

# List locally installed skills
mercury skills list

# Update all installed skills (compares local SHAs to /api/feed.json)
mercury skills update [--all]

# Remove a locally installed skill
mercury skills remove <id>

# Open a skill's page in the browser
mercury skills open <id>
```

### Local layout

```
~/.mercury/
├── skills/
│   ├── ai-ml/
│   │   └── agent-audit-logging/
│   │       ├── SKILL.md
│   │       └── manifest.json
│   └── ...
└── skills.lock.json     # { "<id>": { "version": "1.0.0", "sha": "..." } }
```

### Integrity verification

Every CLI download MUST verify that the SHA-256 of the downloaded `SKILL.md` body matches the `sha` reported by `/api/feed.json`. Mismatches must fail loudly.

---

## Versioning

The registry schema is versioned via the `schema` field on `/api/feed.json` (currently `mercury-skills-registry@1`). Breaking changes will bump to `@2` while keeping the old endpoint live for at least 90 days.

Per-skill versions follow semver and live in the `version` field. The web platform serves the latest published version on `main`.

---

## Open questions for the CLI team

- Auth: do we need authenticated downloads for private skills in v2? If so we can layer a bearer token on `/api/skills/<id>/install`.
- Mirroring: should the CLI optionally clone the GitHub repo for offline use? The `githubUrl` field already supports this.
- Telemetry: do we want anonymous install-success pings to a separate endpoint?
