# Integrations build plan — Ponytail, in-repo CRM, Huginn, freehire, Instagram DM

Ship external capabilities **inside** [Stackwise admin](https://stackwisetechnologies.com/admin): same auth, same branding (`globals.css` admin tokens), same Neon database. No separate CRM product login and **no Twenty Cloud / self-hosted Twenty server**.

This document is the source of truth for implementation order, manual validation, and completion sign-off.

**Related:** [GROWTH_ENGINE.md](./GROWTH_ENGINE.md) (X / LinkedIn harvest and inbox). **Local setup:** [INTEGRATIONS_LOCAL.md](./INTEGRATIONS_LOCAL.md). **Instagram:** in-repo on the Cloudflare Worker (OpenReply / ManyChat **slice** — not the [OpenReply](https://github.com/diwenne/openreply) container). **After Phase 6:** agency delivery, alerts, and projects — [AGENCY_OPS_BUILD_PLAN.md](./AGENCY_OPS_BUILD_PLAN.md).

---

## Goals

| Goal                                      | Approach                                                                                                                         |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Disciplined AI-assisted development       | **[Ponytail](https://github.com/dietrichgebert/ponytail)** rules/skills in-repo (Phase 0)                                        |
| Track X + LinkedIn leads through pipeline | **In-repo CRM** — Neon + `/admin/crm` UI **inspired by Twenty** (layout/features); [copy policy](./vendor/TWENTY_UI_AND_FEATURES.md) |
| More signal sources                       | **[Huginn](https://github.com/huginn/huginn)** → webhook → unified ingest                                                        |
| Job-posting intent                        | **[freehire](https://github.com/strelov1/freehire/)** harvest → adapter → unified ingest                                         |
| Instagram comment/DM automation           | **In-repo** on the Worker — Meta webhooks → Cloudflare Queue → Graph API; Neon delivery log + inbox; **multi Meta app** rows       |
| Single operator experience                | Admin shell only; sidecars are headless (webhooks/cron), not second dashboards                                                   |

---

## What “Twenty” means for Stackwise

We **do not** deploy `twenty-server`, Redis, Twenty Cloud, or the full monorepo as a running product.

We **do**:

1. **Data model** — [docs/vendor/TWENTY_REFERENCE.md](./vendor/TWENTY_REFERENCE.md) (Person, Company, Opportunity, Activity, stages).
2. **UI & features** — [docs/vendor/TWENTY_UI_AND_FEATURES.md](./vendor/TWENTY_UI_AND_FEATURES.md): pipeline board, record pages, timeline, table views, and Tier B features (saved views, CMD+K, etc.) **inside** `/admin` with Stackwise branding.
3. **Implement** in this repo:
   - `src/lib/crm/` — types, repository, sync from `growth_leads`
   - `migrations/00xx_crm_*.sql`
   - `src/components/admin/crm/` — CRM UI (Twenty-inspired; Tailwind + `--admin-*` tokens)
   - `src/app/admin/crm/` — routes
4. **Copy when useful** — port or adapt Twenty front-end pieces into `vendor/twenty/` per AGPL + `vendor/twenty/README.md` (upstream SHA, changelog). Prefer **inspired reimplementation**; copy when it saves time on complex interactions (e.g. kanban).

**Source of truth for social ingest:** `growth_signals` / `growth_leads`. CRM **links** via `growth_lead_id`.

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

    Meta (per app) ──webhook──► POST /api/webhooks/meta/instagram
                                      │
                                 Queue ──► Graph API (private reply / inbox send)
                                      │
                                 instagram_* tables (Neon) ──optional──► growth_leads / CRM
```

**Deployment:** Marketing + admin stay on **Cloudflare Workers** (current). **Instagram automation runs on the same Worker** (webhooks, queue consumer, admin UI). Huginn + freehire run on **one optional VPS / Docker Compose** (`deploy/integrations/`); production secrets via `scripts/sync-cloudflare-env.mjs`, never `wrangler.jsonc` keys.

---

## Progress log (sign-off)

Record **date + initials** when all manual tests for a phase pass.

| Phase                | Status | Tester | Date | Notes |
| -------------------- | ------ | ------ | ---- | ----- |
| 0 Ponytail           | ☐      |        |      |       |
| 1 Integration fabric | ☑      | agent  | 2026-11-10 | Local 1.T1–1.T6 + prod ingest auth (401/400); UI on :3005 |
| 2 In-repo CRM (data) | ☑      | agent  | 2026-11-10 | Promote/PATCH stage/activity APIs; growth_leads.pipeline_status sync |
| 2b CRM UI (Twenty-inspired) | ☑ | agent  | 2026-11-10 | Board+record+timeline; fixed Suspense hang from useSearchParams |
| 3 Huginn             | ☑      | agent  | 2026-11-10 | Slim ManualEvent→Format→Post scenario; local :3001→:3005 ingest; 3.T1–3.T6 |
| 4 freehire           | ☑      | agent  | 2026-11-10 | Export→ingest from freehire.me; Jobs inbox + freshness; Hiring: title; URL dedupe |
| 5 LinkedIn Jobs      | ☑      | agent  | 2026-11-10 | Connect harvest (new Jobs UI selectors); assisted apply notes; Hiring: CRM titles; URL dedupe |
| 6.1 IG comment-to-DM | ☐      |        |      | Migrations + webhook + queue + delivery log |
| 6.2 IG triggers/links | ☐     |        |      | Code shipped; run smoke + Meta 6.2.T* |
| 6.3 IG inbox         | ☐      |        |      | Thread sync + manual reply in messaging window |
| 6.4 IG CRM bridge    | ☐      |        |      | growth_leads, tags, one-step follow-up |

**Phase 6 rule:** Do not start **6.1** migrations until this section is reviewed. Each milestone is signed off only when its manual tests pass (in order).

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

## Phase 2 — In-repo CRM (data + API)

### Objective

Neon schema and APIs for pipeline and activities; links to Growth leads. UI is Phase **2b**.

### Build tasks

| ID  | Task                                                                                                   | Path / artifact                                                                                |
| --- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| 2.1 | Reference docs                                                                                         | `docs/vendor/TWENTY_REFERENCE.md`, `TWENTY_UI_AND_FEATURES.md`                                 |
| 2.2 | CRM migrations                                                                                         | `crm_companies`, `crm_people`, `crm_opportunities`, `crm_activities` + FK to `growth_leads.id` |
| 2.3 | `src/lib/crm/repository.ts` — CRUD, list by stage                                                      |                                                                                                |
| 2.4 | Promote to CRM (button) or optional auto-create on high-score ingest                                    | Growth Inbox / Leads                                                                           |
| 2.5 | `GET/PATCH` CRM API routes for admin client                                                              | `src/app/api/admin/crm/...`                                                                    |
| 2.6 | Sync: CRM stage ↔ `growth_leads.pipeline_status`                                                       | documented in repository                                                                       |
| 2.7 | Vendor folder policy                                                                                   | `vendor/twenty/README.md`                                                                      |

### Manual test flow — Phase 2 (data)

**Prerequisites:** Migrations applied; admin login.

| Step | Action | Expected |
| ---- | ------ | -------- |
| 2.T1 | Promote a Growth lead to CRM via API or temporary dev action | Rows in `crm_people`, `crm_opportunities` |
| 2.T2 | PATCH opportunity stage | `growth_leads.pipeline_status` matches |
| 2.T3 | Insert activity note via API | Row in `crm_activities` |

**Mark Phase 2 (data) complete when:** 2.T1–2.T3 pass.

---

## Phase 2b — CRM UI (Twenty-inspired / selective copy)

### Objective

Operator-facing CRM that **feels like Twenty** (pipeline, record show, timeline) but lives in **Stackwise admin** styling. See [TWENTY_UI_AND_FEATURES.md](./vendor/TWENTY_UI_AND_FEATURES.md) Tier A.

### Build tasks

| ID   | Task | Path / artifact |
| ---- | ---- | ----------------- |
| 2b.1 | Pipeline board (columns = stages, cards = opportunities) | `CrmPipelineBoard.tsx` — layout inspired by Twenty kanban |
| 2b.2 | Table view toggle (list sort by fit / recency) | `CrmRecordTable.tsx` |
| 2b.3 | Record show page (header, stage, fields, links to Growth + post URL) | `opportunities/[id]/page.tsx` |
| 2b.4 | Activity timeline component | `CrmActivityTimeline.tsx` — inspired by Twenty timeline |
| 2b.5 | Nav: **CRM** in `nav-meta.ts` | primary sidebar item |
| 2b.6 | **View in CRM** from Growth Inbox / Leads | deep links |
| 2b.7 | Optional: port specific widget from Twenty into `vendor/twenty/ui/` | document `UPSTREAM_SHA` in PR |

### Manual test flow — Phase 2b (UI)

**Prerequisites:** Phase 1 optional; at least one `growth_lead` from LinkedIn or X (harvest or capture).

| Step | Action                                                        | Expected                                                              |
| ---- | ------------------------------------------------------------- | --------------------------------------------------------------------- |
| 2.T1 | Harvest or capture one LinkedIn lead                          | Lead in `/admin/growth/linkedin`                                      |
| 2.T2 | Promote to CRM (or auto-create if implemented)                | `/admin/crm` shows person + opportunity linked to lead                |
| 2.T3 | Open opportunity detail                                       | Shows post URL, fit score, platform, activity empty                   |
| 2.T4 | Add activity note “Called — left VM” on record page | Timeline shows note + timestamp |
| 2.T5 | Move stage **outreach** → **booked** on board or record | Growth Leads shows same stage |
| 2.T6 | **Draft agreement** from linked Growth lead | Still works |
| 2.U1–2.U6 | UI parity checks in [TWENTY_UI_AND_FEATURES.md](./vendor/TWENTY_UI_AND_FEATURES.md) | All pass |
| 2.T7 | Visual: `AdminShell`, dark theme, accent; **no iframe** | Feels like one product with Growth |

**Mark Phase 2b complete when:** data phase done + 2.T1–2.T7 and 2.U1–2.U6 pass; Progress log updated.

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

## Phase 5 — LinkedIn Jobs + assisted apply

### Objective

Discover **remote** LinkedIn Jobs via the existing Growth Connect session, land them in **Growth → Jobs** next to freehire, and support **human-assisted** apply (draft note + open posting — never unattended Easy Apply).

### Build tasks

| ID  | Task | Path / artifact |
| --- | ---- | --------------- |
| 5.1 | `linkedin_jobs` lead source + job quality gate + `Hiring:` CRM titles | `types.ts`, ingest, `opportunity-name.ts` |
| 5.2 | Remote Jobs search URL + Playwright extract/harvest | `harvest-search.ts`, `harvest-extract-jobs.ts`, `run-linkedin-jobs-harvest.ts` |
| 5.3 | Admin trigger + Jobs inbox aggregate (freehire + LinkedIn) | `/api/admin/growth/harvest-jobs`, `/admin/growth/jobs` |
| 5.4 | Apply note draft + Copy & open apply + Mark submitted | `generate-apply-note`, Jobs inbox actions |

### Manual test flow — Phase 5

**Prerequisites:** LinkedIn Connect session active; ICP `titleKeywords` set; `npm run dev` locally (Playwright).

| Step | Action | Expected |
| ---- | ------ | -------- |
| 5.T1 | Growth → Jobs → **Harvest LinkedIn jobs** | Activity log shows searches; N captured / M ingested (or clear skip reasons) |
| 5.T2 | Jobs inbox shows new rows with company + role | Badge **Jobs (LinkedIn)**; job URL opens |
| 5.T3 | Freshness **Last 72h** vs **All time** | Same behavior as freehire rows |
| 5.T4 | Promote a ≥45% job lead | Opportunity `Hiring: {role} @ {company}` |
| 5.T5 | **Generate apply note** → **Copy & open apply** → **Mark submitted** | Note copied; status progresses; no auto form fill |
| 5.T6 | Re-harvest / re-ingest same job URL | Duplicate skipped |

**Mark Phase 5 complete when:** 5.T1–5.T6 pass; Progress log updated.

---

## Phase 6 — Instagram DM automation (Worker-native)

### Objective

[OpenReply](https://openreply.diwen.dev/)-class **comment-to-DM**, **delivery tracking**, and (in later milestones) **inbox** and **CRM bridge** — all on the **same Cloudflare Worker** as this app. Supports **multiple Meta apps** (credential rows in Neon, not one global secret). **No** self-hosted OpenReply container, **no** ManyChat login, **no** visual flow builder.

### OpenReply / ManyChat parity (explicit scope)

| Capability | Target milestone | Notes |
| ---------- | ---------------- | ----- |
| Comment keyword → private DM | 6.1 | Meta `comments` webhook + queued Graph send |
| Public reply on comment | 6.1 | Same handler, optional per campaign |
| Delivery log (sent / skipped / failed + reason) | 6.1 | Admin filterable table |
| Queue, retries, per-account rate limit | 6.1 | Cloudflare Queue + KV or DO |
| DM + story text triggers | 6.2 | `messages` (and story fields App Review allows) |
| `{username}` templates, up to 2 link buttons | 6.2 | Template at send; buttons per Meta message rules |
| Tracked link clicks | 6.2 | `/r/ig/:token` redirect + `instagram_link_events` |
| Inbox + manual reply in messaging window | 6.3 | Webhook sync + admin thread UI |
| Promote responder to Growth / CRM + tags | 6.4 | Optional auto-lead; CRM activity notes |
| Simple follow-up (one delayed step in window) | 6.4 | Queue or Workflow — not a flow canvas |
| Visual flow builder, broadcasts, omnichannel | — | **Out of scope** (ManyChat full product) |

### Shared build tasks (reference paths — implement in 6.1+)

| ID | Task | Path / artifact |
| -- | ---- | --------------- |
| 6.0 | Design + parity table (this doc) | `docs/INTEGRATIONS_BUILD_PLAN.md` Phase 6 |
| 6.x | Encrypted tokens | Reuse `src/lib/growth/crypto.ts` patterns |
| 6.x | Wrangler queue binding + consumer | `wrangler.jsonc`, OpenNext queue handler as needed |
| 6.x | Secrets sync | `scripts/sync-cloudflare-env.mjs` (Meta app secrets never in `vars`) |

---

### Phase 6.1 — Comment-to-DM + delivery log

#### Build tasks

| ID | Task | Path / artifact |
| -- | ---- | --------------- |
| 6.1.1 | Migrations: `instagram_meta_apps`, `instagram_accounts`, `instagram_campaigns`, `instagram_deliveries` | `migrations/00xx_instagram_*.sql` |
| 6.1.2 | Meta webhook: verify `X-Hub-Signature-256`, route by app | `src/app/api/webhooks/meta/[appSlug]/route.ts` or single route + app lookup |
| 6.1.3 | Keyword match + enqueue (no Graph in webhook request) | `src/lib/instagram/webhook.ts`, Queue producer |
| 6.1.4 | Queue consumer: private reply (+ optional public comment) | `src/lib/instagram/send-private-reply.ts` |
| 6.1.5 | Admin: Meta apps, connect IG account (OAuth), campaigns CRUD | `/admin/growth/instagram` (or Integrations subsection) |
| 6.1.6 | Admin: **Delivery log** with status + skip reason | table component + API |
| 6.1.7 | Integrations status: last webhook / last successful send | extend status endpoint |

#### Manual test flow — Phase 6.1

**Operator runbook:** [docs/integrations/INSTAGRAM_PHASE_6_1_MANUAL.md](./integrations/INSTAGRAM_PHASE_6_1_MANUAL.md) (admin URLs + sign-off line).

**Prerequisites:** Phase 1 complete; at least one Meta app with Instagram messaging permissions; **test** IG Business/Creator account; production or tunneled HTTPS URL registered in Meta; Cloudflare Queue bound in preview/prod; migration applied.

| Step | Action | Expected |
| ---- | ------ | -------- |
| 6.1.T1 | Register webhook URL on Meta app; complete verify (`hub.challenge`) | Meta shows subscribed fields; challenge returns 200 |
| 6.1.T2 | Admin: add Meta app row (app id; secret via env/encrypted); connect IG account | Account shows connected; token stored encrypted |
| 6.1.T3 | Create campaign: choose media, keyword `GUIDE`, private reply template | Campaign saved as active |
| 6.1.T4 | From a **second** IG account, comment `GUIDE` on the post | Webhook received; delivery row `queued` → `sent` (or `failed` with Meta error text) |
| 6.1.T5 | Delivery log: filter by campaign + status | Row shows trigger comment id, recipient, template snippet, timestamps |
| 6.1.T6 | Comment same keyword again (or duplicate webhook payload) | Second row `skipped` with reason `duplicate` / idempotent constraint |
| 6.1.T7 | Comment non-matching text | No send; optional row `skipped` reason `no_keyword_match` |
| 6.1.T8 | Toggle campaign off; comment keyword again | `skipped` reason `campaign_inactive` |
| 6.1.T9 | Integrations / Instagram status panel | `lastWebhookAt` and `lastSendAt` updated |

**Mark Phase 6.1 complete when:** 6.1.T1–6.1.T9 pass; Progress log **6.1** updated.

---

### Phase 6.2 — DM/story triggers, buttons, tracked links

#### Build tasks

| ID | Task | Path / artifact |
| -- | ---- | --------------- |
| 6.2.1 | Campaign trigger types: `comment`, `dm`, `story_reply` | schema + admin form |
| 6.2.2 | Message templates with `{username}` substitution | send path |
| 6.2.3 | Up to two CTA URLs / buttons per Meta rules | template builder + send |
| 6.2.4 | Tracked redirects + click events | `src/app/r/ig/[token]/route.ts`, `instagram_link_events` |
| 6.2.5 | Delivery log columns: link tokens, click count | admin + API |

#### Manual test flow — Phase 6.2

**Prerequisites:** 6.1 signed off; App Review permissions for DM/story if required.

| Step | Action | Expected |
| ---- | ------ | -------- |
| 6.2.T1 | Campaign: DM keyword `PRICING` on inbound DM | Matching DM enqueues send; delivery log `sent` |
| 6.2.T2 | Campaign: story reply keyword (if enabled) | Same as 6.2.T1 for story webhook shape |
| 6.2.T3 | Template uses `{username}`; trigger from named account | Received DM contains correct handle |
| 6.2.T4 | Button / tracked URL in DM; open link in browser | `instagram_link_events` row; redirect lands on target URL |
| 6.2.T5 | Delivery log shows click count ≥ 1 for that send | Admin updates without manual SQL |
| 6.2.T6 | Rate limit: burst triggers faster than policy | Some rows `skipped` or retried with reason / retry count — no silent drops |

**Mark Phase 6.2 complete when:** 6.2.T1–6.2.T6 pass; Progress log **6.2** updated.

---

### Phase 6.3 — Inbox sync + manual reply

#### Build tasks

| ID | Task | Path / artifact |
| -- | ---- | --------------- |
| 6.3.1 | Migrations: `instagram_conversations`, `instagram_messages` | Neon |
| 6.3.2 | Inbound `messages` webhook → append thread rows | webhook handler |
| 6.3.3 | Admin inbox: thread list, message history, compose reply | `/admin/growth/instagram/inbox` |
| 6.3.4 | Send manual reply via Graph (within messaging window) | API + log outbound row |
| 6.3.5 | Link thread to delivery rows for same IGSID | record show side panel |

#### Manual test flow — Phase 6.3

**Prerequisites:** 6.2 signed off; conversation exists from 6.1/6.2 sends or organic DM.

| Step | Action | Expected |
| ---- | ------ | -------- |
| 6.3.T1 | User replies to auto-DM from test account | Inbound message appears in inbox within webhook latency |
| 6.3.T2 | Open thread in admin | History shows auto-DM (outbound) + user reply (inbound) in order |
| 6.3.T3 | Send manual reply from admin | Delivered in Instagram app; outbound row stored |
| 6.3.T4 | Attempt reply when window closed (test account or wait) | API error surfaced; row `failed` or UI blocks with clear policy message |
| 6.3.T5 | From delivery log, jump to conversation for recipient | Same thread opens |

**Mark Phase 6.3 complete when:** 6.3.T1–6.3.T5 pass; Progress log **6.3** updated.

---

### Phase 6.4 — Growth/CRM bridge, tags, follow-up

#### Build tasks

| ID | Task | Path / artifact |
| -- | ---- | --------------- |
| 6.4.1 | Optional `leadSource: instagram_dm` ingest on first send or first reply | hook in send path / webhook |
| 6.4.2 | `instagram_contact_tags` (or JSON on account) + admin assign | Neon + UI |
| 6.4.3 | Promote to CRM from Instagram lead / thread | reuse promote flow; activity “IG auto-DM: {campaign}” |
| 6.4.4 | One-step follow-up: delay N minutes if no reply, still in window | Queue delayed job or Workflow |
| 6.4.5 | Skip follow-up if inbound message after first send | idempotent check on thread |

#### Manual test flow — Phase 6.4

**Prerequisites:** 6.3 signed off; Phase 2 CRM data + 2b UI available.

| Step | Action | Expected |
| ---- | ------ | -------- |
| 6.4.T1 | Successful auto-DM (or first inbound reply) with bridge enabled | `growth_leads` row `platform: instagram` (or filterable source) |
| 6.4.T2 | Open Growth Inbox filter for Instagram source | Lead shows campaign + profile handle |
| 6.4.T3 | Promote to CRM | Opportunity + activity note referencing campaign |
| 6.4.T4 | Apply tag `interested` on contact; filter admin list | Tag persists; filter works |
| 6.4.T5 | Configure follow-up 15m, no user reply | Second DM sends once; delivery log shows `follow_up` |
| 6.4.T6 | User replies before follow-up fires | Follow-up `skipped` reason `replied` |
| 6.4.T7 | CRM opportunity timeline | Shows promote + optional “link clicked” if 6.2 event linked |

**Mark Phase 6.4 complete when:** 6.4.T1–6.4.T7 pass; Progress log **6.4** updated.

**Mark Phase 6 complete when:** 6.1–6.4 all signed off.

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
| CRM UI         | Twenty layout/interaction as reference; Stackwise colors/type; Tier A before Tier B in UI doc          |

---

## Environment variables (cumulative)

| Variable                                        | Phase | Purpose                                 |
| ----------------------------------------------- | ----- | --------------------------------------- |
| `INTEGRATIONS_INGEST_SECRET`                    | 1     | Bearer token for ingest API             |
| `HUGINN_WEBHOOK_TOKEN`                          | 3     | Optional extra ingest bearer            |
| `INGEST_URL`                                    | 3–4   | Target for `huginn-ingest-smoke` / `freehire-ingest` scripts |
| `CRM_AUTO_PIPELINE`                             | 2     | Set `false` to disable auto CRM on ingest |
| `CRM_AUTO_PIPELINE_MIN_SCORE`                   | 2     | Min fit % for CRM board + auto-sync (default 45) |
| `META_*` / per-app secrets (via sync script)    | 6.1   | App id + secret + verify token; encrypt in DB where stored |
| `INSTAGRAM_QUEUE` (binding name)                | 6.1   | Cloudflare Queue for DM jobs                    |
| `INSTAGRAM_OAUTH_REDIRECT_BASE`                 | 6.1   | Must match Meta Login redirect (prod URL)       |
| `INSTAGRAM_AUTO_CRM`                            | 6.4   | Optional `1` to create Growth lead on DM/reply  |
| Existing `GROWTH_*`, `DATABASE_URL`, OpenRouter | —     | Unchanged                               |

Never commit values; use `.env.local` / `.env.prod` + `npm run cf:secrets`.

---

## Implementation order (sprints)

1. **Sprint A:** Phase 0 + Phase 1.1–1.6 (ingest + UI + migrations)
2. **Sprint B:** Phase 2 + **2b** (CRM data + Twenty-inspired `/admin/crm` UI)  
3. **Sprint C:** Phase 3 (Huginn compose + scenario)
4. **Sprint D:** Phase 4 (freehire adapter + Jobs nav)
5. **Sprint E:** Phase 5 (LinkedIn Jobs harvest + assisted apply)
6. **Sprint F:** Phase 6.1 → 6.4 (Instagram DM — one milestone per deploy where possible)

Each sprint ends only when the **Manual test flow** for that phase is signed off in the Progress log.

---

## Out of scope (explicit)

- Hosting Twenty Cloud or running full `twentyhq/twenty` server in production
- Embedding third-party CRM UI in iframe
- Putting Huginn/freehire inside the Cloudflare Worker bundle
- Self-hosted [OpenReply](https://github.com/diwenne/openreply) or hosted ManyChat as a second product login
- ManyChat-class visual flow builder, SMS/email broadcasts, omnichannel (Messenger/WhatsApp) in Phase 6
- Replacing Paystack / contracts / growth harvest—integrations **extend** them

---

## Code delivery status (manual sign-off still required)

| Phase | Code in repo | Manual tests |
| ----- | ------------ | ------------ |
| 0 | Rules, `check-no-secrets`, `ponytail.md` | 0.T1–0.T4 |
| 1 | Ingest, status, inbox channel filter, compose stub | 1.T1–1.T6 |
| 2 | `crm_*`, APIs, auto-sync, backfill/prune | 2.T1–2.T3 |
| 2b | `/admin/crm` board + table, record, timeline, Growth links | 2.T4–2.T7, 2.U1–2.U6 |
| 3 | Huginn scenario + README + smoke script | 3.T1–3.T6 |
| 4 | `freehire-ingest.mjs`, Jobs inbox, job scoring, CRM titles | 4.T1–4.T5 |
| 5 | LinkedIn Jobs harvest, `linkedin_jobs`, assisted apply notes | 5.T1–5.T6 |
| 6.1 | Webhook, `after()` delivery worker, campaigns UI, delivery log | 6.1.T1–6.1.T9 (manual Meta still required) |
| 6.2 | DM/story webhooks, buttons, /r/ig tracking, rate limit | 6.2.T1–6.2.T6 |
| 6.3 | (planned) Inbox tables + manual reply UI | 6.3.T1–6.3.T5 |
| 6.4 | (planned) Growth/CRM bridge, tags, follow-up | 6.4.T1–6.4.T7 |

**Next for operators:** run each phase’s manual test flow; check boxes in the Progress log above when green. **Instagram:** complete 6.1 before 6.2, etc.; migrations start only after Phase 6 review.
