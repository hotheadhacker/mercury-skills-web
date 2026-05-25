# Deployment Setup

This is a one-time setup guide for putting the `web-platform` branch behind `skills.mercuryagent.sh`.

## 1. Push the branch

```bash
git push -u origin web-platform
```

## 2. Copy the sync workflow to `main`

The sync workflow in `.github/workflows/sync-skills.yml` must live on **`main`** to trigger on pushes to `main`. From a clone:

```bash
git checkout main
mkdir -p .github/workflows
git checkout web-platform -- .github/workflows/sync-skills.yml
git add .github/workflows/sync-skills.yml
git commit -m "ci: mirror skills content to web-platform branch"
git push origin main
```

Trigger it once manually from the **Actions** tab → *Sync skills to web-platform* → *Run workflow* to populate the branch with `categories/`.

## 3. Create the Vercel project

1. New Project → Import `cosmicstack-labs/mercury-agent-skills`.
2. **Production Branch:** `web-platform`.
3. Framework preset: **Next.js**.
4. Install command: `npm install --legacy-peer-deps`.
5. Build command: `npm run build`.
6. Output: `.next` (default).

## 4. Provision Upstash Redis

Storage tab → **Create Database** → **Marketplace** → **Upstash for Redis**.
Connect it to the project. Vercel injects:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

No code change required — `lib/storage.ts` uses `Redis.fromEnv()` and also
mirrors the legacy `KV_REST_API_URL` / `KV_REST_API_TOKEN` names if your
project still has them from the old Vercel KV integration.

## 5. Attach the domain

Settings → Domains → add `skills.mercuryagent.sh`. Update DNS at your registrar with the CNAME Vercel provides.

## 6. Verify

- `https://skills.mercuryagent.sh` → homepage with skills
- `https://skills.mercuryagent.sh/api/feed.json` → registry JSON
- `https://skills.mercuryagent.sh/api/skills/ai-ml/agent-audit-logging/install` → tarball download
