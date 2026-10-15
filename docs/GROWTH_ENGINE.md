# Growth engine (content + leads)

Admin UI under `/admin/growth` scores inbound social signals, drafts replies for human review, and stores **encrypted** LinkedIn / X session cookies for a **local connector** (no official posting APIs in phase 1).

Discovery calls use [Cal.com](https://cal.com/stackwise-technologies/30min) via `bookingUrl()` in `src/lib/booking.ts` (guest `tshikombadaniel@gmail.com` always prefilled).

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

## Daily workflow

1. **Capture** — `/admin/growth`: paste post URL, author, and text → ICP score + reply draft.
2. **Review** — edit draft → **Approve** → **Copy for LinkedIn/X** → post manually (or **Mark posted**).
3. **Pipeline** — `/admin/growth/leads`: update status (new → booked → won / not_a_fit).
4. **Tune scoring** — `/admin/growth/settings`: edit ICP JSON.

## Local connector CLI

From the repo root, with `npm run dev` (or production `GROWTH_API_BASE`) running:

```bash
export GROWTH_CONNECTOR_SECRET='…'   # same value as on the server
export GROWTH_API_BASE='http://localhost:3000'   # optional

# Batch ingest (see examples/growth-signals.example.json)
node scripts/growth-connector.mjs push examples/growth-signals.example.json

# Upload cookies exported from your browser (JSON array)
node scripts/growth-connector.mjs upload-cookies linkedin ./linkedin-cookies.json

# Pull decrypted session for Playwright on your machine (connector secret only)
node scripts/growth-connector.mjs pull-cookies linkedin -o ./linkedin-session.json
```

Shorthand npm scripts (pass file paths after `--`):

- `npm run growth:push -- examples/growth-signals.example.json`
- `npm run growth:cookies:upload -- linkedin ./cookies.json`
- `npm run growth:cookies:pull -- linkedin -o ./session.json`

Next step on your machine: a small Playwright script that loads `linkedin-session.json`, reads feed/search pages, and writes `signals.json` for `growth:push`. Posting stays manual or behind **approved** drafts only.

## HTTP API

Auth: admin session cookie **or** `Authorization: Bearer $GROWTH_CONNECTOR_SECRET`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/growth/signals` | POST | Single signal ingest |
| `/api/admin/growth/connector/ingest` | POST | Batch `{ "signals": [ ... ] }` |
| `/api/admin/growth/credentials` | POST | Upload encrypted cookies |
| `/api/admin/growth/connector/credentials?platform=` | GET | **Connector secret only** — decrypt for local automation |
| `/api/admin/growth/inbox` | GET | Drafts + leads for UI |

## Data model

- `growth_signals` — source post / comment
- `growth_leads` — person + scores + pipeline
- `growth_drafts` — reply/post text + approval state
- `growth_icp_settings` — scoring config
- `growth_platform_credentials` — encrypted cookie jars

## Roadmap

- Playwright harvester package (read-only) using `pull-cookies`
- Optional LLM draft rewrite when `OPENAI_API_KEY` is set
- Publish worker: post only **approved** drafts, rate-limited, using stored sessions
