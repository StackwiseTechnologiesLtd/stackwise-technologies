# Integrations — local first, VPS later

Run **Stackwise** on your machine (`npm run dev`). Run **Huginn** (and optionally **freehire**) beside it. They talk to the app only over HTTPS/HTTP + a shared **ingest secret** — no shared database.

When you move to production, keep Huginn/freehire on a VPS and point them at your live URL with the **same secret** synced to Cloudflare.

---

## 1. One-time app setup

### Generate a secret

```bash
npm run integrations:secret
```

Copy the line into **`.env.local`** (never commit it):

```bash
INTEGRATIONS_INGEST_SECRET=<64-char-hex-from-script>
```

Optional (defaults shown):

```bash
# Where adapters POST (local default)
INGEST_URL=http://localhost:3000/api/admin/integrations/ingest

# Used by render-huginn-scenario if INGEST_URL is unset
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Restart **`npm run dev`** after editing `.env.local`.

### Sync to Cloudflare (when you deploy the app)

```bash
npm run cf:secrets
```

Include `INTEGRATIONS_INGEST_SECRET` in `.env.prod` (or your secrets file) so production ingest accepts the same bearer token.

### Verify

With dev server running:

```bash
npm run integrations:check
```

Expected: app reachable + ingest **200** (or **422** if ICP rejects the test body — auth still OK).

Admin UI: **Growth → Settings → Integrations** should show ingest secret **configured**.

---

## 2. Huginn (local Docker)

### Start (Docker)

```bash
npm run integrations:up
```

This starts **Postgres + Huginn** via Compose (healthchecks, `--wait`), renders the Huginn import file, and prints next steps.

Open **http://localhost:3001**, sign up with invitation code **`stackwise-local`**.

Legacy alias: `npm run integrations:huginn:up` (same as `integrations:up`).

Stop: `npm run integrations:down`

### Import scenario with your URL + secret filled in

```bash
npm run integrations:huginn:scenario
```

Import the generated file (gitignored):

`deploy/integrations/huginn/scenarios/generated/stackwise-ingest.local.json`

Huginn → **Scenarios** → **Import** → choose that file.

The **Stackwise — POST ingest** agent is pre-set to:

- **Local:** `http://host.docker.internal:3000/api/admin/integrations/ingest` (from `INGEST_URL` or site URL)
- **Authorization:** `Bearer <your INTEGRATIONS_INGEST_SECRET>`

### Test event

1. Open **Stackwise — manual test event** → **Create Event**:

```json
{
  "author_name": "Acme CTO",
  "body_text": "We need a developer team to harden our MVP before production launch.",
  "source_url": "https://example.com/intent-post-1",
  "platform": "linkedin",
  "posted_at": "2026-03-24T10:00:00Z"
}
```

2. Run the scenario (or wait for agents to propagate).
3. **Growth → Inbox** → **Channel: Huginn**.

### Smoke test without Huginn UI

```bash
npm run integrations:smoke
```

### Stop Huginn

```bash
npm run integrations:huginn:down
```

More agent patterns: [deploy/integrations/huginn/README.md](../deploy/integrations/huginn/README.md).

---

## 3. freehire / job leads (local)

Clone and run the **freehire** app beside Stackwise (full job search UI):

```bash
npm run integrations:freehire:clone
npm run integrations:freehire:up
```

Open **http://localhost:8090** (API on **http://localhost:8088**). Ports: `deploy/integrations/freehire/compose.env`.

Local Postgres starts **empty** until you run freehire ingest workers (`vendor/freehire/README.md`). To push real listings into **Growth → Jobs** immediately:

```bash
FREEHIRE_API_BASE=https://freehire.me npm run integrations:freehire:export -- --ingest -n 10
```

This repo does **not** commit the freehire tree — only scripts and `compose.env`.

1. **Sample jobs** (no freehire UI — wiring only):

```bash
npm run integrations:freehire:sample
```

Or from Docker (Stackwise on host must be running):

```bash
npm run integrations:jobs:demo
```

2. **Your export** — run [freehire](https://github.com/strelov1/freehire/) on your machine or VPS, export JSON, then:

```bash
node scripts/freehire-ingest.mjs path/to/jobs.json
```

Dry run:

```bash
node scripts/freehire-ingest.mjs --dry-run deploy/integrations/freehire/sample-jobs.json
```

Jobs appear under **Growth → Jobs** (`leadSource: freehire`).

Shape: [deploy/integrations/freehire/README.md](../deploy/integrations/freehire/README.md).

---

## 4. Move Huginn / freehire to a VPS (later)

Same contract; only **URL** and **secret** change on the worker side.

| Setting | Local | VPS → production app |
|--------|--------|-------------------------|
| `INGEST_URL` (on VPS / in Huginn Post Agent) | `http://host.docker.internal:3000/api/admin/integrations/ingest` | `https://stackwisetechnologies.com/api/admin/integrations/ingest` |
| `INTEGRATIONS_INGEST_SECRET` | `.env.local` | Cloudflare Worker secret **and** Huginn Post Agent header **and** freehire cron env |

### Huginn on VPS

1. Copy `deploy/integrations/` to the server.
2. `docker compose -f deploy/integrations/docker-compose.yml up -d`
3. On your laptop (with `.env.local`):

   ```bash
   INGEST_URL=https://stackwisetechnologies.com/api/admin/integrations/ingest \
     npm run integrations:huginn:scenario
   ```

4. Import the generated JSON on the **VPS** Huginn UI (or edit Post Agent URL + bearer manually).
5. Restrict Huginn port (firewall / VPN); do not expose `:3001` publicly without auth.

### freehire on VPS

Cron example (from [freehire README](../deploy/integrations/freehire/README.md)):

```cron
0 */6 * * * cd /opt/stackwise && \
  INGEST_URL=https://stackwisetechnologies.com/api/admin/integrations/ingest \
  INTEGRATIONS_INGEST_SECRET=... \
  node scripts/freehire-ingest.mjs /var/lib/freehire/latest.json
```

Use **one** long-lived secret everywhere; rotate in Cloudflare and Huginn/cron together.

### Optional: tunnel for local Huginn → local Next

If Docker cannot reach `host.docker.internal`:

```bash
ngrok http 3000
```

Set `INGEST_URL=https://<subdomain>.ngrok-free.app/api/admin/integrations/ingest`, re-run `npm run integrations:huginn:scenario`, re-import.

---

## 5. API reference

**Endpoint:** `POST /api/admin/integrations/ingest`

**Auth:** `Authorization: Bearer <INTEGRATIONS_INGEST_SECRET>`  
(Also accepts legacy `GROWTH_CONNECTOR_SECRET` or `HUGINN_WEBHOOK_TOKEN` if set and ≥32 chars.)

**Huginn body example:**

```json
{
  "source": "huginn",
  "platform": "linkedin",
  "authorName": "Jane Doe",
  "bodyText": "We need a developer for our MVP",
  "sourceUrl": "https://example.com/post",
  "postedAt": "2026-03-24T12:00:00Z"
}
```

**freehire** uses `"source": "freehire"` (see adapter script).

---

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| Ingest **401** | Secret missing on app (`INTEGRATIONS_INGEST_SECRET` in `.env.local`) or wrong bearer in Huginn |
| Huginn **connection refused** | `npm run dev` running; on Linux ensure compose has `host.docker.internal:host-gateway` |
| Ingest **422** | Body failed ICP/hiring filter — tune ICP in Growth Settings or test copy |
| Ingest **409** | Duplicate `sourceUrl` — expected |
| Generated scenario missing | Run `npm run integrations:huginn:scenario` after `.env.local` is set |

Full phase checklist: [INTEGRATIONS_BUILD_PLAN.md](./INTEGRATIONS_BUILD_PLAN.md).
