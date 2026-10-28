# freehire → Stackwise Growth

**Local UI:** clone + Docker — `npm run integrations:freehire:clone` then `npm run integrations:freehire:up`

| Service | URL |
| -------- | ----- |
| **Web UI** | http://localhost:8090 |
| **API** | http://localhost:8088 (`/health`, `/api/v1/jobs/search`) |

Host ports are in [`compose.env`](./compose.env) so freehire does not clash with Huginn (:3001), Stackwise (:3000), or other Postgres on :5432.

The clone lives at **`vendor/freehire/`** (gitignored). See [`vendor/README-freehire.md`](../../vendor/README-freehire.md).

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
