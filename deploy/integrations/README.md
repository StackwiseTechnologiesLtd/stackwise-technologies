# Integrations deploy stubs

See [docs/INTEGRATIONS_BUILD_PLAN.md](../../docs/INTEGRATIONS_BUILD_PLAN.md) for the full plan.

## Ingest endpoint

External systems POST JSON to:

`POST /api/admin/integrations/ingest`

Authenticate with either:

- Admin session cookie (browser), or
- `Authorization: Bearer <INTEGRATIONS_INGEST_SECRET>` (also accepts legacy `GROWTH_CONNECTOR_SECRET`)

## Local Huginn

```bash
docker compose -f deploy/integrations/docker-compose.yml up -d
```

Open http://localhost:3001 and complete signup with invitation code `stackwise-local`.

Configure a Webhook Agent to call your app ingest URL with the bearer token.

## Env vars

Add to `.env.local` / Cloudflare:

- `INTEGRATIONS_INGEST_SECRET` — shared secret for webhook ingest
- `HUGINN_WEBHOOK_TOKEN` — optional; reserved for Huginn-specific agent auth (Phase 3)
