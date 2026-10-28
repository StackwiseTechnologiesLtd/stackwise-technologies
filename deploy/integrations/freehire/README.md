# freehire → Stackwise Growth

**Local UI:** clone + Docker — `npm run integrations:freehire:clone` then `npm run integrations:freehire:up`

| Service | URL |
| -------- | ----- |
| **Web UI** | http://localhost:8090 — run **`npm run integrations:freehire:ui`** (Vite + API in Docker). Docker **`web`** image often fails on pnpm; use **`--with-ui`** only if you need nginx SSR in Docker. |
| **API** | http://localhost:8088 (`/health`, `/api/v1/jobs/search`) |

Host ports are in [`compose.env`](./compose.env) so freehire does not clash with Huginn (:3001), Stackwise (:3000), or other Postgres on :5432.

The clone lives at **`vendor/freehire/`** (gitignored). See [`vendor/README-freehire.md`](../../vendor/README-freehire.md).

### Dev auth bypass (local only)

When **`FREEHIRE_DEV_AUTH_BYPASS=1`** is set on the API (in `compose.env`) and **`PUBLIC_FREEHIRE_DEV_AUTH=1`** on the Vite UI (`npm run integrations:freehire:ui` sets both):

- First page load calls **`POST /api/v1/auth/dev-login`** and sets the session cookie (`dev-local@stackwise.local`).
- **Apply / Save / sign-in prompts** auto dev-login instead of `/signin`.

**Never enable in production.** After `git pull` in `vendor/freehire`, run `npm run integrations:freehire:apply-patches` and rebuild the `app` container.

**Match / Tailor** still need a CV and `LLM_*` on the API for real scores; dev login only removes the account gate.

### Browse without signing in

- **Job search and job pages** (title, description, link to employer) are public — same as production.
- **Apply** (primary button) prompts sign-in first; use **“View without signing in”** to open the real posting on Stripe/Discord/etc.
- **Match / Tailor my CV / fit score / saved jobs** require an account (and often a CV + LLM config). Locally, OAuth is off unless you set `OAUTH_*` in `vendor/freehire/.env` — use **http://localhost:8090** job **`Apply on company site`** / external URL for testing without auth.

### Add more companies (boards)

Edit [`boards.seed.json`](./boards.seed.json) (`provider`, `board`, `company` — Greenhouse board slug is the URL segment on `boards.greenhouse.io/…`):

```bash
npm run integrations:freehire:add-boards   # insert new rows only
npm run integrations:freehire:crawl        # re-crawl greenhouse + reindex
```

Or add one board:

```bash
cd vendor/freehire
DATABASE_URL=postgres://hire:hire@localhost:5434/hire?sslmode=disable \
  go run ./cmd/add-board --provider=greenhouse --board=acme --company="Acme Inc." --apply
```

[freehire](https://github.com/strelov1/freehire/) harvests job listings. Stackwise ingests via HTTP only — no shared DB.

## Flow

```text
freehire (search / crawl)  →  export JSON  →  scripts/freehire-ingest.mjs  →  POST /api/admin/integrations/ingest
                                                                                      ↓
                                                                            Growth Jobs inbox + CRM (≥45% fit)
```

**Export + ingest in one step** (uses public API if local DB is empty):

```bash
FREEHIRE_API_BASE=https://freehire.me npm run integrations:freehire:export -- --ingest -q "full stack developer" -n 10
```

**Local API only** (after you have indexed jobs in your Docker DB):

```bash
npm run integrations:freehire:export -- -o /tmp/jobs.json
node scripts/freehire-ingest.mjs /tmp/jobs.json
```

**Sample wiring only** (no freehire install): `npm run integrations:freehire:sample` — see [docs/INTEGRATIONS_LOCAL.md](../../docs/INTEGRATIONS_LOCAL.md).

## Prerequisites

- `INTEGRATIONS_INGEST_SECRET` on the app and in the adapter environment
- Job export as JSON (array) — see `sample-jobs.json`

## Run the adapter

```bash
export INTEGRATIONS_INGEST_SECRET=your-secret
export INGEST_URL=https://stackwisetechnologies.com/api/admin/integrations/ingest

node scripts/freehire-ingest.mjs deploy/integrations/freehire/sample-jobs.json
```

Dry run (no HTTP):

```bash
node scripts/freehire-ingest.mjs --dry-run path/to/jobs.json
```

## Job JSON shape

Each item:

| Field | Required | Maps to ingest |
| ----- | -------- | -------------- |
| `title` | yes | `roleTitle`, part of `bodyText` |
| `company` | yes | `authorName`, `companyName` |
| `description` | yes | `bodyText` |
| `url` | yes | `sourceUrl` (dedupe key) |
| `postedAt` | no | ISO date |
| `platform` | no | `linkedin` or `x` (default `linkedin`) |

## Cron example

```cron
0 */6 * * * cd /opt/stackwise && INTEGRATIONS_INGEST_SECRET=... node scripts/freehire-ingest.mjs /var/lib/freehire/latest.json >> /var/log/freehire-ingest.log 2>&1
```

## UI

- **freehire** — http://localhost:8090 (local Docker)
- **Growth → Jobs** — inbox filtered to `leadSource: freehire`
- **CRM** — opportunities titled `Hiring: {role} @ {company}`

Manual tests: `docs/INTEGRATIONS_BUILD_PLAN.md` Phase 4 (4.T1–4.T5).
