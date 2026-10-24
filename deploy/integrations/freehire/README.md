# freehire → Stackwise Growth

[freehire](https://github.com/strelov1/freehire/) harvests job listings. This repo does **not** embed freehire in the Worker — run it on a VPS or locally and push results through the same ingest API as Huginn.

## Flow

```text
freehire harvest / export  →  scripts/freehire-ingest.mjs  →  POST /api/admin/integrations/ingest
                                                                    ↓
                                                          Growth Jobs inbox + CRM (≥45% fit)
```

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

- **Growth → Jobs** — inbox filtered to `leadSource: freehire`
- **CRM** — opportunities titled `Hiring: {role} @ {company}`

Manual tests: `docs/INTEGRATIONS_BUILD_PLAN.md` Phase 4 (4.T1–4.T5).
