# Growth engine (content + leads)

Admin UI under `/admin/growth` scores inbound social signals, drafts replies for human review, and stores **encrypted** LinkedIn / X session cookies for a **local connector** (no official posting APIs required for phase 1).

## Setup

1. Run migrations: `npm run db:migrate`
2. Sign in to admin as usual.
3. Set your Cal.com event URL (discovery calls):

```bash
NEXT_PUBLIC_CAL_COM_BOOKING_URL=https://cal.com/your-team/your-event-type
```

All site and growth draft links use `bookingUrl()` from `src/lib/booking.ts`, which always prefills guest `tshikombadaniel@gmail.com` via Cal.com’s `guests` query param.

4. Optional: add to `.env.local`:

```bash
# 32+ characters — used by a local script to POST signals without browser cookies
GROWTH_CONNECTOR_SECRET=your-long-random-secret-here
```

Uses the same encryption root as other app secrets (`KPAY_WEBHOOK_SECRET` / `KPAY_SECRET_KEY` via `getAppSecret()`).

## Daily workflow

1. **Capture** — `/admin/growth`: paste post URL, author, and text → automatic ICP score + reply draft.
2. **Review** — edit draft → **Approve** → **Copy for LinkedIn/X** → post manually (or mark posted).
3. **Pipeline** — `/admin/growth/leads`: move status (new → booked → won / not_a_fit).
4. **Tune scoring** — `/admin/growth/settings`: edit ICP JSON (titles, exclusions, intent phrases).

## Session cookies (connector)

1. Export cookies from a logged-in browser session (format: JSON array of `{ name, value, domain, ... }`).
2. Upload in **Growth settings** per platform (stored encrypted in `growth_platform_credentials`).
3. A local Node script (you run on your machine) can:
   - `GET` decrypted cookies server-side only via internal jobs later, or
   - For now: use cookies locally with Playwright to **read** feeds and `POST` structured signals to the API.

### Connector API

Auth: admin session cookie **or** `Authorization: Bearer $GROWTH_CONNECTOR_SECRET`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/growth/signals` | POST | Single signal ingest |
| `/api/admin/growth/connector/ingest` | POST | Batch `{ "signals": [ ... ] }` |
| `/api/admin/growth/credentials` | POST | Upload encrypted cookies |
| `/api/admin/growth/inbox` | GET | Drafts + leads for UI |

Example single signal:

```json
{
  "platform": "linkedin",
  "sourceUrl": "https://www.linkedin.com/posts/...",
  "authorName": "Jane Doe",
  "roleTitle": "Founder",
  "bodyText": "Looking for a team to harden our AI MVP for production..."
}
```

## What ships next

- Local `scripts/growth-connector.mjs` (Playwright + your cookies) to scan saved searches and push to `/connector/ingest`
- Optional LLM rewrite for drafts when `OPENAI_API_KEY` is set
- Publish worker that uses stored sessions only after **approved** drafts (rate-limited, human-triggered)

## Data model

- `growth_signals` — source post / comment
- `growth_leads` — person + scores + pipeline
- `growth_drafts` — reply/post text + approval state
- `growth_icp_settings` — scoring config
- `growth_platform_credentials` — encrypted cookie jars
