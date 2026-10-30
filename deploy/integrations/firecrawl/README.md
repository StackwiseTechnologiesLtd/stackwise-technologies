# Firecrawl (self-hosted) → Growth leads

Run [Firecrawl](https://github.com/firecrawl/firecrawl) **on your machine** (Docker). Stackwise talks to `http://localhost:3002` — no Firecrawl Cloud API required.

## Quick start

```bash
npm run integrations:firecrawl:clone   # vendor/firecrawl @ pinned tag
npm run integrations:firecrawl:up      # docker compose (Redis, Playwright, API)
npm run integrations:firecrawl:status

# Discover leads (needs OPENROUTER optional; uses search + scrape locally)
npm run growth:firecrawl:discover -- -q "founder hiring full stack developer" -n 15
```

Then **Growth → Discover** or **Email outreach** — Firecrawl leads skip the minimum fit score for cold email drafts.

## Ports

| Service | URL |
| -------- | ----- |
| Firecrawl API | http://localhost:3002 |
| Health | http://localhost:3002/v0/health/readiness |

## Env (`.env.local`)

| Variable | Purpose |
| -------- | ------- |
| `FIRECRAWL_API_BASE` | Default `http://localhost:3002` |
| `FIRECRAWL_API_KEY` | Only if `USE_DB_AUTHENTICATION=true` on your stack |

## Notes

- First `docker compose up --build` is heavy (Playwright, workers). Allow several minutes.
- Scraped contacts are stored as `lead_source: firecrawl` in Growth (not required in CRM).
- Verify emails before bulk send; scraped addresses can be stale or role inboxes.

See [docs/INTEGRATIONS_LOCAL.md](../../docs/INTEGRATIONS_LOCAL.md).
