# Integrations deploy stubs

**Local-first guide:** [docs/INTEGRATIONS_LOCAL.md](../../docs/INTEGRATIONS_LOCAL.md)

## Quick start (local)

```bash
# 1. Secret + dev server (two terminals)
npm run integrations:secret   # add line to .env.local
npm run dev

# 2. Docker (Huginn + Postgres)
npm run integrations:up

# 3. Verify ingest
npm run integrations:check

# 4. Import in Huginn UI: deploy/integrations/huginn/scenarios/generated/stackwise-ingest.local.json
#    http://localhost:3001 — invitation code stackwise-local

# 5. Optional sample jobs (Docker → host app)
npm run integrations:jobs:demo
```

Env template: [stackwise.env.example](./stackwise.env.example)

## Ingest endpoint

External systems POST JSON to:

`POST /api/admin/integrations/ingest`

Authenticate with:

- Admin session cookie (browser), or
- `Authorization: Bearer <INTEGRATIONS_INGEST_SECRET>` (also accepts legacy `GROWTH_CONNECTOR_SECRET`)

## Local Huginn

Image: **`ghcr.io/huginn/huginn`** (Docker Hub `huginn/huginn` was retired; update compose if you still see the migration banner).

```bash
docker compose -f deploy/integrations/docker-compose.yml up -d
# or: npm run integrations:huginn:up
```

Open http://localhost:3001 and complete signup with invitation code `stackwise-local`.

Import scenario: run `npm run integrations:huginn:scenario` and import  
`deploy/integrations/huginn/scenarios/generated/stackwise-ingest.local.json`  
(do not commit generated files).

Agent docs: [deploy/integrations/huginn/README.md](./huginn/README.md).

**freehire jobs:** [deploy/integrations/freehire/README.md](./freehire/README.md) and `npm run integrations:freehire:sample`.

## VPS (production app URL)

On the VPS, set adapter env:

```bash
INGEST_URL=https://stackwisetechnologies.com/api/admin/integrations/ingest
INTEGRATIONS_INGEST_SECRET=<same as Cloudflare Worker>
```

Re-run `integrations:huginn:scenario` with `INGEST_URL` pointing at prod, import on VPS Huginn.

Sync Worker secrets: `npm run cf:secrets` from `.env.prod`.

See [docs/INTEGRATIONS_LOCAL.md](../../docs/INTEGRATIONS_LOCAL.md) §4.

## Env vars

Add to `.env.local` / Cloudflare:

- `INTEGRATIONS_INGEST_SECRET` — shared secret for webhook ingest
- `INGEST_URL` — optional; used by CLI scripts and scenario renderer
- `HUGINN_WEBHOOK_TOKEN` — optional; second bearer accepted by ingest

Never commit values; use `.env.local` / `.env.prod` + `npm run cf:secrets`.
