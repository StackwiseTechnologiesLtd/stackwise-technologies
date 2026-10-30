# Huginn → Stackwise Growth

**Start here:** [docs/INTEGRATIONS_LOCAL.md](../../docs/INTEGRATIONS_LOCAL.md) (`npm run integrations:huginn:up`, `npm run integrations:huginn:scenario`).

Huginn runs in Docker beside your app (see `../docker-compose.yml`). It never shares the Neon database — only HTTP calls to the ingest API.

## Prerequisites

1. `INTEGRATIONS_INGEST_SECRET` (≥32 chars) in `.env.local` / Cloudflare Worker secrets.
2. App reachable from the Huginn container:
   - **Local:** `http://host.docker.internal:3000` (Mac/Windows Docker Desktop)
   - **Linux Docker:** add `extra_hosts: ["host.docker.internal:host-gateway"]` to the `huginn` service, or use your LAN IP.
   - **Production:** `https://stackwisetechnologies.com/api/admin/integrations/ingest`

Optional: `HUGINN_WEBHOOK_TOKEN` — second bearer token accepted only for ingest (same length rules as ingest secret).

## Start Huginn

```bash
docker compose -f deploy/integrations/docker-compose.yml up -d
```

Open **http://localhost:3001**, sign up with invitation code `stackwise-local`.

## Import scenario

1. Huginn → **Scenarios** → **Import** → upload  
   `deploy/integrations/huginn/scenarios/stackwise-ingest.json`
2. Open **Stackwise — POST ingest** and set:
   - `post_url` → your ingest URL
   - `headers.Authorization` → `Bearer <INTEGRATIONS_INGEST_SECRET>`
3. Open **Stackwise — manual test event** → **Create Event** with JSON:

```json
{
  "author_name": "Acme CTO",
  "body_text": "We need a developer team to harden our MVP before production launch.",
  "source_url": "https://example.com/intent-post",
  "platform": "linkedin",
  "posted_at": "2026-03-24T10:00:00Z"
}
```

Then run downstream agents (or wait for propagation).

Expected: HTTP `200` from Stackwise, lead in **Growth → Inbox** with channel **Huginn**.

## Agent patterns

### Manual / one-off test

Use the imported **Manual test event** agent. Body fields map through **ingest JSON shape** → **POST ingest**.

### RSS + intent filter

1. Enable **RSS (example)** — replace feed URL with your source.
2. Enable **hiring intent filter** — edit regex for your ICP phrases (`need a developer`, `hiring`, `MVP`, etc.).
3. Enable both agents and wait for a poll (or run RSS agent manually).

Irrelevant posts should not create Growth leads: Stackwise ingest returns **422** when `evaluateHarvestCandidate` fails; Huginn Post Agent may still show the response — check **Growth → Settings → Integrations** for `ingest_rejected` events.

### Website change

Add a **Website Agent** (mode `on_change`) → link to **ingest JSON shape** with extract fields:

| Website extract key | Ingest field |
| ----------------- | ------------ |
| `title`           | `authorName` (via formatting agent defaults) |
| `text`            | `bodyText` |
| page URL          | `sourceUrl` |

Set `platform` to `linkedin` or `x` in a formatting instruction default.

### Inbound webhook (optional)

Add a **Webhook Agent** → **ingest JSON shape** if an external system should POST into Huginn first, then forward to Stackwise.

## Payload contract

Same as `POST /api/admin/integrations/ingest`:

```json
{
  "source": "huginn",
  "platform": "linkedin",
  "authorName": "Jane Doe",
  "bodyText": "We need a developer team for our MVP",
  "sourceUrl": "https://example.com/post",
  "postedAt": "2026-03-24T12:00:00Z"
}
```

## Smoke test without Huginn

```bash
export INTEGRATIONS_INGEST_SECRET=your-secret
node scripts/huginn-ingest-smoke.mjs
```

## CRM

After a lead appears, use **Promote to CRM** — opportunity keeps `leadSource` Huginn and post URL.

See `docs/INTEGRATIONS_BUILD_PLAN.md` Phase 3 manual tests (3.T1–3.T6).
