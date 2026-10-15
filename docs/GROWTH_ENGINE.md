# Growth engine (content + leads)

Admin UI under `/admin/growth` scores inbound social signals, drafts replies for human review, and stores **encrypted** LinkedIn / X session cookies for a **local connector** (no official posting APIs in phase 1).

Discovery calls use [Cal.com](https://cal.com/stackwise-technologies/30min) via `bookingUrl()` in `src/lib/booking.ts` (guest `tshikombadaniel@gmail.com` always prefilled).

## Architecture: Cloudflare vs Playwright

| Layer | Where it runs | Role |
|--------|----------------|------|
| **Control plane** | Cloudflare Workers + Neon (this Next app) | Admin inbox, ICP scoring, encrypted session storage, health status APIs |
| **Data plane** | Your Mac or a small VPS | Playwright: headed login, human-paced read-only harvest, optional publish later |

**Playwright does not run on Cloudflare Workers.** Workers have no Chromium, no long-lived browser, and tight CPU/time limits. The pattern matches [cmnd-ai-api](https://github.com/cypruscodes/cmnd-ai-api) `cmndWebScraperBatchContainer`: stealth browser flags, human delays, and batch jobs on **AWS Batch** — not inside the API Lambda/Worker itself.

Session flow (similar to cmnd `testConnection` + `AppConnectionStatus`):

1. **Connect** — real browser login locally → cookies uploaded encrypted → `session_status = active`.
2. **Harvest** — connector pulls cookies, opens feed with jitter/delays → pushes signals → touches `last_sync_at`.
3. **Health** — connector reports `active` / `expired` / `challenge` to `/api/admin/growth/sessions/health`; admin UI shows reconnect when needed.

## Setup

1. Run migrations: `npm run db:migrate`
2. Sign in to admin as usual.
3. Optional Cal.com override:

```bash
NEXT_PUBLIC_CAL_COM_BOOKING_URL=https://cal.com/stackwise-technologies/30min
```

4. Connector secret (local machine + production Worker):

```bash
GROWTH_CONNECTOR_SECRET=your-long-random-secret-here
```

Uses the same encryption root as other app secrets (`KPAY_WEBHOOK_SECRET` / `KPAY_SECRET_KEY` via `getAppSecret()`).

5. Playwright (local only):

```bash
npm install -D playwright
npx playwright install chromium
```

6. **Production connect (no terminal)** — enable [Browser Rendering](https://developers.cloudflare.com/browser-run/) on your Cloudflare account. This repo’s `wrangler.jsonc` includes a `browser` binding. After deploy, **Connect** in admin uses Cloudflare-hosted Chromium in the embedded panel.

   Optional fallback: deploy `deploy/growth-connect` to Fly/Render and set `GROWTH_CONNECT_VIEWER_BASE` on the Worker (admin proxies via `/api/admin/growth/connect/relay`).

7. **Local dev** — `npm run dev` uses **local** connect mode (`http://127.0.0.1:9234`), not Miniflare’s browser binding (it often errors with a corrupt Chromium zip). Run:

```bash
npm run growth:connect-server
```

Optional: `GROWTH_CONNECT_USE_HOSTED_LOCAL=1` to try hosted browser under `next dev`. `GROWTH_CONNECT_FORCE_LOCAL=1` forces local mode in any environment.

## Daily workflow

1. **Connect** — `/admin/growth/settings` → **Connect** → sign in inside the embedded browser panel (requires `npm run growth:connect-server` on the same machine). CLI fallback: `node scripts/growth-connect.mjs linkedin`.
2. **Harvest** — `node scripts/growth-harvest.mjs linkedin` (business hours 08:00–20:00 local by default).
3. **Review** — `/admin/growth`: approve drafts, copy to platform, mark posted.
4. **Pipeline** — `/admin/growth/leads`: update status.
5. **Tune scoring** — `/admin/growth/settings`: edit ICP JSON.

If the UI shows **Session expired** or **Login or verification needed**, run `growth-connect` again for that platform.

## Local connector CLI

From the repo root, with `npm run dev` (or production `GROWTH_API_BASE`) running:

```bash
export GROWTH_CONNECTOR_SECRET='…'
export GROWTH_API_BASE='http://localhost:3000'   # optional

# Headed login → upload cookies → health ping
node scripts/growth-connect.mjs linkedin

# Human-paced read-only harvest → ingest
node scripts/growth-harvest.mjs linkedin
node scripts/growth-harvest.mjs x --dry-run

# Batch ingest from file
node scripts/growth-connector.mjs push examples/growth-signals.example.json
```

Shorthand npm scripts:

- `npm run growth:connect -- linkedin`
- `npm run growth:harvest -- linkedin`
- `npm run growth:push -- examples/growth-signals.example.json`
- `npm run growth:cookies:upload -- linkedin ./cookies.json`
- `npm run growth:cookies:pull -- linkedin -o ./session.json`

Env toggles:

- `GROWTH_IGNORE_BUSINESS_HOURS=1` — allow harvest outside 08:00–20:00
- `GROWTH_HEADLESS=1` — headless harvest (less human-like; use only on a trusted VPS)

Posting stays manual or behind **approved** drafts only.

## HTTP API

Auth: admin session cookie **or** `Authorization: Bearer $GROWTH_CONNECTOR_SECRET`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/growth/signals` | POST | Single signal ingest |
| `/api/admin/growth/connector/ingest` | POST | Batch `{ "signals": [ ... ] }` |
| `/api/admin/growth/credentials` | POST | Upload encrypted cookies |
| `/api/admin/growth/sessions` | GET | **Admin** — platform session status |
| `/api/admin/growth/sessions/health` | POST | **Connector** — report active/expired/challenge |
| `/api/admin/growth/connector/credentials?platform=` | GET | **Connector secret only** — decrypt for local automation |
| `/api/admin/growth/inbox` | GET | Drafts + leads for UI |

## Data model

- `growth_signals` — source post / comment
- `growth_leads` — person + scores + pipeline
- `growth_drafts` — reply/post text + approval state
- `growth_icp_settings` — scoring config
- `growth_platform_credentials` — encrypted cookies + `session_status`, `last_health_check_at`, `last_error`, `connected_account_label`

## Roadmap

- Optional LLM draft rewrite when `OPENAI_API_KEY` is set
- Publish worker on VPS: post only **approved** drafts, rate-limited
- systemd timer for `growth-harvest` on a dedicated connector VM
