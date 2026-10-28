# Growth — real data (not demos)

Use this checklist so **Growth → Inbox**, **Jobs**, and **CRM** reflect live prospects—not `example.com` smoke tests.

## 1. Environment (`.env.local`)

| Variable | Purpose |
| -------- | ------- |
| `DATABASE_URL` | Neon — required |
| `OPENROUTER_API_KEY` | Generate reply drafts on demand |
| `INTEGRATIONS_INGEST_SECRET` | Huginn / freehire → ingest |
| `GROWTH_CONNECTOR_SECRET` | Optional; connector scripts |
| `ALLOW_TEST_INGEST=1` | **Dev only** — allow example.com smoke ingest |

Do **not** set `ALLOW_TEST_INGEST` in production.

Demo URLs (`example.com`) are **rejected** by `/api/admin/integrations/ingest` unless `ALLOW_TEST_INGEST=1`.

## 2. Connect social accounts (real sessions)

1. **Growth → Settings → Connect**
2. Complete **LinkedIn** and **X** login in the browser panel
3. Confirm session shows **active** and your account label

Without a valid `li_at` / `auth_token`, harvest returns zero posts.

## 3. ICP settings (what to hunt)

**Growth → Settings** — tune JSON:

- `intentPhrases` — phrases people use when they need dev help (used in X/LinkedIn **search** harvest)
- `titleKeywords`, `intentPhrases`, exclusions — scoring

## 4. Harvest real social posts

**Admin (recommended):** **Growth → Inbox** → **Harvest LinkedIn** / **Harvest X**

**CLI (same engine):**

```bash
npm run growth:harvest -- linkedin
npm run growth:harvest -- x
```

**LinkedIn notes:**

- Local dev uses a **visible browser** by default (headless is often empty). Override with `GROWTH_HARVEST_HEADLESS=1`.
- If ICP **search** returns 0 posts, harvest automatically tries your **home feed** and saves matching posts.
- Watch the activity log DOM line — if all counts are 0, reconnect LinkedIn or run headed.

## 5. Real job listings (freehire)

This repo does **not** run the freehire app for you.

1. Run [freehire](https://github.com/strelov1/freehire/) (or your job source) and export **JSON** with real `url`, `company`, `title`, `description`.
2. Ingest:

```bash
node scripts/freehire-ingest.mjs /path/to/your/jobs.json
```

3. Review **Growth → Jobs** (use **All time** if needed).

`npm run integrations:freehire:sample` is for wiring tests only — **example.com** URLs are refused.

## 6. Huginn (real RSS / webhooks)

```bash
npm run integrations:up
npm run integrations:huginn:scenario   # import generated JSON
```

In Huginn (http://localhost:3001):

1. Import `stackwise-ingest.local.json`
2. Enable **Stackwise — RSS** and point it at a **real** feed (job board RSS, newsletter, etc.)
3. Tune **hiring intent filter** regex to your ICP
4. Manual test events must use **real `source_url`** values (LinkedIn/X post URLs), not example.com

## 7. Daily pipeline

| Step | Where |
| ---- | ----- |
| Discover | Harvest, Huginn, freehire ingest |
| Triage | **Growth → Inbox** / **Jobs** — filters: channel, source, freshness |
| Engage | Expand lead → **Generate reply** → **Copy & open post** / X post |
| Track | **CRM** board — stage + activity notes |
| Close | **Won** / **Lost** on CRM |

## 8. Clean up old demo leads

Remove test leads that used example URLs (optional SQL in Neon) or mark **Not a fit** in inbox.

For integration smoke only:

```bash
ALLOW_TEST_INGEST=1 npm run integrations:smoke
```

See also: [GROWTH_ENGINE.md](./GROWTH_ENGINE.md), [INTEGRATIONS_LOCAL.md](./INTEGRATIONS_LOCAL.md).
