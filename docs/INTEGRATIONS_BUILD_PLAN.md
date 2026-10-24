# Integrations build plan — Ponytail, in-repo CRM, Huginn, freehire

Ship external capabilities **inside** [Stackwise admin](https://stackwisetechnologies.com/admin): same auth, same branding (`globals.css` admin tokens), same Neon database. No separate CRM product login and **no Twenty Cloud / self-hosted Twenty server**.

This document is the source of truth for implementation order, manual validation, and completion sign-off.

**Related:** [GROWTH_ENGINE.md](./GROWTH_ENGINE.md) (X / LinkedIn harvest and inbox).

---

## Goals

| Goal                                      | Approach                                                                                                                         |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Disciplined AI-assisted development       | **[Ponytail](https://github.com/dietrichgebert/ponytail)** rules/skills in-repo (Phase 0)                                        |
| Track X + LinkedIn leads through pipeline | **In-repo CRM** — Neon tables + `/admin` UI, modeled after [Twenty](https://github.com/twentyhq/twenty) objects we actually need |
| More signal sources                       | **[Huginn](https://github.com/huginn/huginn)** → webhook → unified ingest                                                        |
| Job-posting intent                        | **[freehire](https://github.com/strelov1/freehire/)** harvest → adapter → unified ingest                                         |
| Single operator experience                | Admin shell only; sidecars are headless (webhooks/cron), not second dashboards                                                   |

---

## What “Twenty” means for Stackwise

We **do not** deploy `twenty-server`, Redis, or the full Twenty monorepo.

We **do**:

1. **Reference** Twenty’s product model (Person, Company, Opportunity, Activity, pipeline stages) in `docs/vendor/TWENTY_REFERENCE.md` (field names, stage semantics, links to upstream).
2. **Implement** a minimal subset in this repo:
   - `src/lib/crm/` — types, repository, sync from `growth_leads`
   - `migrations/00xx_crm_*.sql` — `crm_companies`, `crm_people`, `crm_opportunities`, `crm_activities`
   - `src/app/admin/crm/` — pipeline board + record detail (Stackwise UI)
3. **Vendor selectively** — copy only permissively licensed snippets (types, GraphQL shape comments) into `vendor/twenty/` with `README` pointing at upstream commit SHA; no runtime dependency on Twenty npm packages until explicitly approved in a PR.

**Source of truth for social ingest:** existing `growth_signals` / `growth_leads`. CRM records **link** via `growth_lead_id`, not duplicate harvest logic.

---

## Architecture

```text
                    ┌─────────────────────────────────────┐
                    │  stackwisetechnologies.com/admin    │
                    │  AdminShell · OTP · branding        │
                    └──────────────┬──────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
   /admin/growth            /admin/crm              /admin/growth/settings
   inbox · harvest          pipeline · activities    integrations status
         │                         │
         └────────────┬────────────┘
                      ▼
              Neon (growth_* + crm_* + integration_*)
                      ▲
         ┌────────────┴────────────┐
         │                         │
    X / LinkedIn              POST /api/admin/integrations/ingest
    (existing harvest)              ▲           ▲
                                    │           │
                              Huginn webhook   freehire adapter (cron)
```

**Deployment:** Marketing + admin stay on **Cloudflare Workers** (current). Huginn + freehire run on **one optional VPS / Docker Compose** (`deploy/integrations/`); production secrets via `scripts/sync-cloudflare-env.mjs`, never `wrangler.jsonc` keys.

---

## Progress log (sign-off)

Record **date + initials** when all manual tests for a phase pass.

| Phase                | Status | Tester | Date | Notes |
| -------------------- | ------ | ------ | ---- | ----- |
| 0 Ponytail           | ☐      |        |      |       |
| 1 Integration fabric | ☐      |        |      |       |
| 2 In-repo CRM        | ☐      |        |      |       |
| 3 Huginn             | ☐      |        |      |       |
| 4 freehire           | ☐      |        |      |       |

---

## Phase 0 — Ponytail (mandatory first)

### Objective

Every contributor (human + coding agent) follows Ponytail-style restraint: small diffs, no scope creep, no secrets in git.

### Build tasks

| ID  | Task                                                                     | Path / artifact                                                                                              |
| --- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| 0.1 | Install Ponytail skills/rules for Cursor                                 | `.cursor/rules/ponytail.mdc` or `npx skills add` per [ponytail](https://github.com/dietrichgebert/ponytail/) |
| 0.2 | Stackwise integration policy in agent docs                               | `AGENTS.md` + pointer to this file                                                                           |
| 0.3 | Optional CI secret scan (fail on `sk_live`, `sk-or-v1` in tracked files) | `scripts/check-no-secrets.mjs` + `.github/workflows/ci.yml`                                                  |
| 0.4 | Engineering note                                                         | `docs/engineering/ponytail.md`                                                                               |

### Manual test flow — Phase 0

**Prerequisites:** Cursor (or agent) opened on this repo; `npm install` done.

| Step | Action                                                                            | Expected                                                                                                 |
| ---- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 0.T1 | Open a new agent chat; ask it to add a “small” feature unrelated to current work  | Agent cites Ponytail / minimal scope and asks to narrow OR produces a small plan, not a 500-line rewrite |
| 0.T2 | Run `npm run lint` and `npm test`                                                 | Both pass                                                                                                |
| 0.T3 | Run `node scripts/check-no-secrets.mjs` (after 0.3 lands)                         | Exit 0; no matches in tracked files                                                                      |
| 0.T4 | Confirm `wrangler.jsonc` has `"vars": {}` and comment about `sync-cloudflare-env` | No API keys in file                                                                                      |

**Mark Phase 0 complete when:** 0.T1–0.T4 pass; Progress log updated.

---

## Phase 1 — Integration fabric

### Objective

One authenticated ingest path and one integrations status UI for all external sources.

### Build tasks

| ID  | Task                                                                                                                 | Path / artifact                                                           |
| --- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1.1 | Migration: `integration_events`, `integration_connections` (or extend growth with `lead_source`)                     | `migrations/0014_integrations.sql`, `migration-statements.ts`             |
| 1.2 | Extend ingest types: `leadSource`: `linkedin` \| `x` \| `huginn` \| `freehire` \| `manual`                           | `src/lib/growth/types.ts`                                                 |
| 1.3 | `POST /api/admin/integrations/ingest` — auth via `GROWTH_CONNECTOR_SECRET` or dedicated `INTEGRATIONS_INGEST_SECRET` | `src/app/api/admin/integrations/ingest/route.ts`                          |
| 1.4 | `GET /api/admin/integrations/status`                                                                                 | `src/app/api/admin/integrations/status/route.ts`                          |
| 1.5 | Admin **Integrations** panel under Growth → Settings                                                                 | `GrowthSettingsPanel` or `GrowthIntegrationsPanel.tsx`                    |
| 1.6 | Source filter on Inbox (beyond platform)                                                                             | `GrowthInboxPanel` + API query `source=`                                  |
| 1.7 | Local compose stub (Huginn + optional freehire)                                                                      | `deploy/integrations/docker-compose.yml`, `deploy/integrations/README.md` |
| 1.8 | Env documentation                                                                                                    | `.env.example` keys: `INTEGRATIONS_INGEST_SECRET`, `HUGINN_WEBHOOK_TOKEN` |

### Manual test flow — Phase 1

**Prerequisites:** `npm run dev`; admin login works; `DATABASE_URL` set; migration applied.

| Step | Action                                                                          | Expected                                                                                           |
| ---- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1.T1 | Open `/admin/growth/settings` (or Integrations section)                         | Integrations card shows Huginn / freehire / CRM sync as “Not configured” or “Healthy” placeholders |
| 1.T2 | `curl -X POST http://localhost:3000/api/admin/integrations/ingest` without auth | `401`                                                                                              |
| 1.T3 | POST sample body with valid secret (see example below)                          | `200`; new row in `growth_signals` / `growth_lead`                                                 |
| 1.T4 | Open `/admin/growth` Inbox, filter by source **Huginn** (or manual test source) | Lead visible with correct body and source badge                                                    |
| 1.T5 | POST duplicate same `sourceUrl` or body within 14 days                          | Second request skipped or `409` / no duplicate lead (per `signalAlreadyIngested`)                  |
| 1.T6 | `GET /api/admin/integrations/status` as logged-in admin session                 | JSON with `lastIngestAt` / per-service flags                                                       |

**Example ingest (adjust secret and host):**

```bash
curl -sS -X POST "http://localhost:3000/api/admin/integrations/ingest" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INTEGRATIONS_INGEST_SECRET" \
  -d '{
    "source": "huginn",
    "platform": "linkedin",
    "authorName": "Test Founder",
    "bodyText": "We need a developer to ship our MVP before production.",
    "sourceUrl": "https://example.com/post/1",
    "contextSummary": "huginn-test-scenario"
  }'
```

**Mark Phase 1 complete when:** 1.T1–1.T6 pass; Progress log updated.

---

## Phase 2 — In-repo CRM (Twenty-inspired, inside Stackwise)

### Objective

Pipeline and activities for leads from X, LinkedIn, Huginn, and freehire—**only** in admin, backed by Neon.

### Build tasks

| ID  | Task                                                                                                   | Path / artifact                                                                                |
| --- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| 2.1 | Twenty reference doc (objects we mirror)                                                               | `docs/vendor/TWENTY_REFERENCE.md`                                                              |
| 2.2 | CRM migrations                                                                                         | `crm_companies`, `crm_people`, `crm_opportunities`, `crm_activities` + FK to `growth_leads.id` |
| 2.3 | `src/lib/crm/repository.ts` — CRUD, list by stage                                                      |                                                                                                |
| 2.4 | Auto-create CRM person + opportunity on lead ingest (or on “Promote to CRM” button first—choose in PR) | hook in `ingestSignal` or explicit action                                                      |
| 2.5 | `/admin/crm` — kanban or table by `pipeline_status` / opportunity stage                                | `src/app/admin/crm/page.tsx`                                                                   |
| 2.6 | Lead row: **View in CRM** → `/admin/crm/opportunities/[id]`                                            | Growth Leads + Inbox                                                                           |
| 2.7 | Activity timeline (note, stage change, link to original post)                                          | opportunity detail page                                                                        |
| 2.8 | Nav: **CRM** in `nav-meta.ts` (primary or under Growth—pick one and stay consistent)                   |                                                                                                |
| 2.9 | Sync rule: editing stage in CRM updates `growth_leads.pipeline_status`                                 | single direction or two-way documented                                                         |

### Manual test flow — Phase 2

**Prerequisites:** Phase 1 optional; at least one `growth_lead` from LinkedIn or X (harvest or capture).

| Step | Action                                                        | Expected                                                              |
| ---- | ------------------------------------------------------------- | --------------------------------------------------------------------- |
| 2.T1 | Harvest or capture one LinkedIn lead                          | Lead in `/admin/growth/linkedin`                                      |
| 2.T2 | Promote to CRM (or auto-create if implemented)                | `/admin/crm` shows person + opportunity linked to lead                |
| 2.T3 | Open opportunity detail                                       | Shows post URL, fit score, platform, activity empty                   |
| 2.T4 | Add activity note “Called — left VM”                          | Note appears in timeline with timestamp                               |
| 2.T5 | Move stage to **outreach** → **booked**                       | CRM and `/admin/growth/leads` show same stage                         |
| 2.T6 | From lead, click **Draft agreement** (existing)               | Still works; CRM record unchanged unless you link engagement id later |
| 2.T7 | Visual check: CRM page uses admin sidebar, dark theme, accent | No foreign SaaS theme / iframe                                        |

**Mark Phase 2 complete when:** 2.T1–2.T7 pass; Progress log updated.

---

## Phase 3 — Huginn

### Objective

RSS / website / webhook agents feed the same ingest API and CRM path as social leads.

### Build tasks

| ID  | Task                                                                         | Path / artifact                                              |
| --- | ---------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 3.1 | `deploy/integrations/docker-compose.yml` — Huginn + Postgres for Huginn only | separate DB from Neon                                        |
| 3.2 | Export scenario JSON: Webhook → Stackwise ingest URL                         | `deploy/integrations/huginn/scenarios/stackwise-ingest.json` |
| 3.3 | Document agent examples (RSS intent phrases, site change)                    | `deploy/integrations/huginn/README.md`                       |
| 3.4 | Inbox filter **Source: Huginn**                                              | UI + API                                                     |
| 3.5 | Integrations status: last Huginn event time                                  | status endpoint                                              |

### Manual test flow — Phase 3

**Prerequisites:** Phase 1 complete; Docker running compose; `INTEGRATIONS_INGEST_SECRET` on Worker and Huginn webhook URL reachable (use ngrok for local: `ngrok http 3000`).

| Step | Action                                                   | Expected                                                                                |
| ---- | -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 3.T1 | Start Huginn from compose; create admin user             | UI on `localhost:3000` (or mapped port) — **not** exposed publicly in prod without auth |
| 3.T2 | Import scenario; point webhook to ingest URL with secret | Scenario saved                                                                          |
| 3.T3 | Fire test event (manual agent run)                       | `200` from ingest; lead in Inbox with source Huginn                                     |
| 3.T4 | Confirm harvest-quality filters (irrelevant body)        | Skipped in harvest log or no lead created                                               |
| 3.T5 | Promote to CRM                                           | Opportunity shows source Huginn + link                                                  |
| 3.T6 | Integrations panel                                       | Last event timestamp updates                                                            |

**Mark Phase 3 complete when:** 3.T1–3.T6 pass; Progress log updated.

---

## Phase 4 — freehire (job offers)

### Objective

Job postings as **hiring-intent** leads, same inbox freshness and CRM pipeline.

### Build tasks

| ID  | Task                                                        | Path / artifact                          |
| --- | ----------------------------------------------------------- | ---------------------------------------- |
| 4.1 | Run freehire harvest in compose or cron on VPS              | `deploy/integrations/freehire/README.md` |
| 4.2 | Adapter script: job → ingest payload                        | `scripts/freehire-ingest.mjs`            |
| 4.3 | `leadSource: freehire`; optional `/admin/growth/jobs` nav   |                                          |
| 4.4 | ICP/scoring tweaks for job descriptions                     | `harvest-quality.ts` or separate scorer  |
| 4.5 | CRM opportunity title template `Hiring: {role} @ {company}` |                                          |

### Manual test flow — Phase 4

**Prerequisites:** Phase 1 complete; freehire DB/search running per their docs; adapter configured with ingest secret.

| Step | Action                                          | Expected                              |
| ---- | ----------------------------------------------- | ------------------------------------- |
| 4.T1 | Run adapter once against staging search results | Console reports N ingested, M skipped |
| 4.T2 | Inbox **Jobs** or filter freehire               | Rows with job URL and company         |
| 4.T3 | Freshness **Last 72h**                          | Old jobs hidden unless **All time**   |
| 4.T4 | Promote one job lead to CRM                     | Opportunity title matches template    |
| 4.T5 | Duplicate same job URL                          | No second lead                        |

**Mark Phase 4 complete when:** 4.T1–4.T5 pass; Progress log updated.

---

## Branding checklist (all phases)

Use for any new UI page before marking a phase complete:

| Check          | Requirement                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Layout         | `AdminShell`, `AdminPageHeader`                                                                       |
| Colors         | `var(--admin-*)`, `border-line`, `bg-panel`, `text-muted`, `text-accent`                              |
| Copy           | “Stackwise” / product names from `src/lib/content.ts`, not vendor product names in user-facing titles |
| Auth           | Same admin OTP session; no second login for CRM                                                       |
| Links external | Open in new tab; label “View article on LinkedIn/X” pattern from `GrowthArticleLink`                  |

---

## Environment variables (cumulative)

| Variable                                        | Phase | Purpose                                 |
| ----------------------------------------------- | ----- | --------------------------------------- |
| `INTEGRATIONS_INGEST_SECRET`                    | 1     | Bearer token for ingest API             |
| `HUGINN_WEBHOOK_TOKEN`                          | 3     | Optional extra Huginn header validation |
| `FREEHIRE_ADAPTER_URL`                          | 4     | Internal URL for adapter cron           |
| Existing `GROWTH_*`, `DATABASE_URL`, OpenRouter | —     | Unchanged                               |

Never commit values; use `.env.local` / `.env.prod` + `npm run cf:secrets`.

---

## Implementation order (sprints)

1. **Sprint A:** Phase 0 + Phase 1.1–1.6 (ingest + UI + migrations)
2. **Sprint B:** Phase 2 (CRM schema + `/admin/crm`)
3. **Sprint C:** Phase 3 (Huginn compose + scenario)
4. **Sprint D:** Phase 4 (freehire adapter + Jobs nav)

Each sprint ends only when the **Manual test flow** for that phase is signed off in the Progress log.

---

## Out of scope (explicit)

- Hosting Twenty Cloud or running full `twentyhq/twenty` server in production
- Embedding third-party CRM UI in iframe
- Putting Huginn/freehire inside the Cloudflare Worker bundle
- Replacing Paystack / contracts / growth harvest—integrations **extend** them

---

## Next PR (start here)

1. Add this file (done when merged).
2. Phase **0.1–0.2** + **1.1–1.3** (Ponytail rules stub, integration migration, ingest route).
3. Run Phase **0** and **1** manual tests locally; update Progress log.
