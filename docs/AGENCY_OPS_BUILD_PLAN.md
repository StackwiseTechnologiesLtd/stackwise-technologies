# Agency ops build plan — from integrations stack to day-to-day agency software

Stackwise admin already covers **revenue** (payment links, agreements, subscriptions), **pipeline** (Growth + in-repo CRM), **brand** (guidelines + portal), and **Instagram** automation. This plan closes the gaps between “features exist” and **a founder can run the agency every week without duct tape**.

**Prerequisites:** Treat [INTEGRATIONS_BUILD_PLAN.md](./INTEGRATIONS_BUILD_PLAN.md) Phases **0–5** as the foundation. Instagram **6.1–6.4** are started in-repo but must be signed off there before expanding scope below.

**Related:** [GROWTH_ENGINE.md](./GROWTH_ENGINE.md) (connector ops), [TWENTY_UI_AND_FEATURES.md](./vendor/TWENTY_UI_AND_FEATURES.md) (CRM Tier B), [PAYMENTS.md](./PAYMENTS.md), [INSTAGRAM_PROD_URLS.md](./INSTAGRAM_PROD_URLS.md).

---

## What “functional” means for Stackwise

| Capability | Definition of done |
| ---------- | -------------------- |
| **Sell** | Leads ingested, triaged, in CRM; meetings booked; IG campaigns trusted in prod |
| **Close** | Agreements reviewed; payment links sent; cash and subscriptions visible |
| **Deliver** | After **won**, projects/milestones exist; team knows what to ship this week |
| **Collect** | Open invoices and stale agreements surfaced; client can pay without admin |
| **Operate** | Someone gets notified when queues fail—not only when they open Overview |

Out of scope here (unchanged from integrations doc): Twenty Cloud, full e-sign platform, omnichannel ManyChat builder, full accounting/ERP, replacing Paystack.

---

## Current state (baseline)

| Pillar | Routes / libs | Gap |
| ------ | ------------- | --- |
| Command center | `/admin`, `agency-overview.ts` | Attention is passive (no alerts) |
| Revenue | `/admin/payment-links`, contracts, subscriptions, withdraw | No aging, reminders, client invoice status page |
| CRM | `/admin/crm`, `src/lib/crm/` | Tier A only; no tasks, saved views, drag board |
| Growth | `/admin/growth/*`, connector | Harvest depends on always-on connector + session health |
| Integrations | Ingest, Huginn, freehire, Jobs | Prod host + smoke cadence not a product concern yet |
| Instagram | `/admin/instagram/*` | 6.1–6.4 manual sign-off incomplete |
| Brand | Brand guidelines + portal | No **project delivery** portal for active clients |
| Team | OTP owners; IG operators | No CRM/revenue roles or assignment |

---

## Implementation order (after integrations foundation)

```text
Sprint G  →  A  Stabilize (IG + ingest + Phase 0 + connector ops)
Sprint H  →  B  Daily ops (CRM tasks, saved views, notifications)
Sprint I  →  C  Post-sale projects (data + admin UI)
Sprint J  →  D  Client delivery portal (lite)
Sprint K  →  E  Revenue automation (reminders, aging, self-serve status)
Sprint L  →  F  Search + funnel reporting
Sprint M  →  G  Team / RBAC (optional; when hiring)
```

Do **not** start **C** (projects) until **A** is signed off. **B** can overlap **A** only for UI that does not depend on prod Instagram.

---

## Progress log (sign-off)

Record **date + initials** when all manual tests for a phase pass.

| Phase | Status | Tester | Date | Notes |
| ----- | ------ | ------ | ---- | ----- |
| A — Stabilize | ☐ | | | IG 6.1–6.4 + Phase 0 + prod ingest/connector |
| B — Daily ops | ☐ | | | **B.1–B.4** `crm_tasks`, saved views, record tasks UI; **B.5–B.6** alerts (`/api/cron/agency-alerts`) — sign off B.T1–T5 |
| C — Projects | ☐ | | | Engagements after **won** |
| D — Client portal (delivery) | ☐ | | | Client-facing status, not admin |
| E — Revenue automation | ☐ | | | Reminders + aging |
| F — Search + reporting | ☐ | | | Cross-entity search + funnel |
| G — Team / RBAC | ☐ | | | Optional |

---

## Phase A — Stabilize (production trust)

### Objective

Operators trust Growth, Instagram, and ingest in **production** without ad-hoc SQL or “works on my Mac.”

### Build tasks

| ID | Task | Path / artifact |
| -- | ---- | --------------- |
| A.1 | Complete **6.1–6.4** manual flows per integrations doc | [INTEGRATIONS_BUILD_PLAN.md](./INTEGRATIONS_BUILD_PLAN.md) Phase 6 |
| A.2 | Phase **0** sign-off (Ponytail, `check-no-secrets`, no keys in `wrangler.jsonc`) | Progress log integrations §0 |
| A.3 | Document prod URLs and webhook targets | [INSTAGRAM_PROD_URLS.md](./INSTAGRAM_PROD_URLS.md) |
| A.4 | Run `npm run cf:secrets` / ingest secret present; smoke ingest from prod or CI | `scripts/huginn-ingest-smoke.mjs`, `INTEGRATIONS_INGEST_SECRET` |
| A.5 | **Connector runbook**: who runs harvest, where (VPS/Mac), calendar for session refresh | `docs/GROWTH_ENGINE.md` § ops (add subsection) |
| A.6 | Optional: cron or uptime check posting to ingest health | `GET /api/admin/integrations/status` + external ping |

### Manual test flow — Phase A

| Step | Action | Expected |
| ---- | ------ | -------- |
| A.T1 | Prod: Instagram comment → DM → delivery log `sent` | 6.1.T4–T9 pass on production host |
| A.T2 | Prod: IG inbox manual reply within messaging window | 6.3.T3 pass |
| A.T3 | Promote IG lead to CRM with activity note | 6.4.T3 pass |
| A.T4 | `node scripts/check-no-secrets.mjs` on main | Exit 0 |
| A.T5 | Ingest POST with prod secret | `200`; lead visible in Growth inbox |
| A.T6 | Connector harvest once; sessions **active** in Growth settings | New signals within 24h or documented blocker |

**Mark Phase A complete when:** A.T1–A.T6 pass; integrations Progress log **6.1–6.4** and **0** updated.

---

## Phase B — Daily ops (CRM + attention)

### Objective

CRM supports “what do I do today?” and the stack **pushes** attention instead of only showing it on Overview.

### Build tasks

| ID | Task | Path / artifact |
| -- | ---- | --------------- |
| B.1 | `crm_tasks` migration + repository | `migrations/00xx_crm_tasks.sql`, `src/lib/crm/` |
| B.2 | Tasks on opportunity record (due date, done) | `CrmOpportunityDetail.tsx`, API routes |
| B.3 | **Saved views** presets on CRM list | `CrmRecordTable.tsx` + query params or `crm_saved_views` (start with 3 presets) |
| B.4 | Presets: “New this week”, “High fit (≥N)”, filter by `leadSource` | per [TWENTY_UI_AND_FEATURES.md](./vendor/TWENTY_UI_AND_FEATURES.md) Tier B |
| B.5 | **Notification channel** v1: email to owner list on thresholds | env `AGENCY_ALERT_EMAILS`, cron on Worker or daily DO alarm |
| B.6 | Alert rules (config in env or single JSON row): triage count, IG failed sends, open invoices, pending agreements | reuse `buildAttentionItems` logic server-side |
| B.7 | Optional: kanban drag stage change | `CrmPipelineBoard.tsx` (pointer drag or keep dropdown-first) |

### Suggested saved views (v1)

| Preset | Filter |
| ------ | ------ |
| New this week | `created_at` ≥ 7d, stage `new` \| `reviewed` |
| High fit | `fit_score` ≥ `CRM_AUTO_PIPELINE_MIN_SCORE` |
| Needs action | open task due ≤ today OR stage `replied` \| `outreach` |

### Manual test flow — Phase B

| Step | Action | Expected |
| ---- | ------ | -------- |
| B.T1 | Create task on opportunity; mark done | Persists; visible on record |
| B.T2 | Switch saved view “High fit” | List matches threshold |
| B.T3 | Force condition (e.g. 12 triage leads in DB); run alert job | Email received with inbox link |
| B.T4 | Overview “Needs review” count matches attention rules | Same numbers as alert payload |
| B.T5 | Stage change on board (drag or control) | CRM + `growth_leads.pipeline_status` in sync |

**Mark Phase B complete when:** B.T1–B.T5 pass.

---

## Phase C — Post-sale projects (delivery spine)

### Objective

When an opportunity is **won**, the agency has a **project** with milestones—not only a CRM card and an invoice.

### Build tasks

| ID | Task | Path / artifact |
| -- | ---- | --------------- |
| C.1 | Schema: `agency_projects`, `agency_project_milestones` | FK `crm_opportunity_id`, optional `contract_engagement_id`, `payment_link_id` |
| C.2 | Status: `planned` \| `active` \| `blocked` \| `delivered` \| `archived` | align copy with admin tone |
| C.3 | Create project from won opportunity (button) or auto on stage `won` | `src/lib/agency/projects.ts` |
| C.4 | Admin UI: `/admin/projects` list + detail | `AdminShell`, link from CRM record |
| C.5 | Overview work queue tab or panel: **Delivery** (milestones due ≤14d) | `AgencyOverviewDashboard.tsx`, extend overview API |
| C.6 | Link existing agreement + payment link on project detail | read-only links to contracts/payment routes |

### Data model (sketch)

```text
agency_projects
  id, title, client_name, status, opportunity_id, created_at, updated_at

agency_project_milestones
  id, project_id, title, due_at, completed_at, sort_order
```

### Manual test flow — Phase C

| Step | Action | Expected |
| ---- | ------ | -------- |
| C.T1 | Mark opportunity **won** → create project | Project row; link from CRM |
| C.T2 | Add milestone due tomorrow | Shows on Overview delivery slice |
| C.T3 | Complete milestone | `completed_at` set; drops from “due soon” |
| C.T4 | Open project from payment link context (if linked) | Correct FK navigation |

**Mark Phase C complete when:** C.T1–C.T4 pass.

---

## Phase D — Client delivery portal (lite)

### Objective

Clients see **project status and milestones** without admin access—same auth patterns as brand portal (invite link / OTP).

### Build tasks

| ID | Task | Path / artifact |
| -- | ---- | --------------- |
| D.1 | `agency_portal_members` or reuse brand portal pattern with `project_id` | migration |
| D.2 | Routes: `/portal/projects/[token]` or subdomain pattern consistent with brand | new app segment |
| D.3 | Read-only: project title, milestone list, last updated | no admin chrome |
| D.4 | Admin: invite client email from project detail | mirror brand-portal invite UX |
| D.5 | Branding: Stackwise client tokens or per-client logo from brand guidelines slug | optional FK `brand_slug` |

### Manual test flow — Phase D

| Step | Action | Expected |
| ---- | ------ | -------- |
| D.T1 | Invite test client; open portal link | No admin session required |
| D.T2 | Complete milestone in admin | Portal shows updated state |
| D.T3 | Revoked / expired invite | 401 or friendly error |

**Mark Phase D complete when:** D.T1–D.T3 pass.

---

## Phase E — Revenue automation

### Objective

Cash collection does not depend on remembering open invoices and unsigned agreements.

### Build tasks

| ID | Task | Path / artifact |
| -- | ---- | --------------- |
| E.1 | **Aging** panel: open payment links by age buckets | `/admin/payment-links` filter or overview widget |
| E.2 | Scheduled reminder email (owner-configurable cadence) for `sent` unpaid links | Worker cron + email templates in `src/lib/emails/` |
| E.3 | Client **invoice status** page: existing public pay flow + “paid on …” receipt | extend payment link public route if missing |
| E.4 | Agreement status: list `PENDING_REVIEW` with days since send | contracts list + overview |
| E.5 | Optional: one-click “resend payment email” from admin | audit log entry |

### Manual test flow — Phase E

| Step | Action | Expected |
| ---- | ------ | -------- |
| E.T1 | Open link aging report | Buckets 0–7d, 8–30d, 30d+ |
| E.T2 | Trigger reminder job on test link | Email received; no duplicate spam same day |
| E.T3 | Client opens pay URL after paid | Receipt state correct |

**Mark Phase E complete when:** E.T1–E.T3 pass.

---

## Phase F — Search + funnel reporting

### Objective

One search box and one funnel view across Growth, CRM, revenue, and projects.

### Build tasks

| ID | Task | Path / artifact |
| -- | ---- | --------------- |
| F.1 | `GET /api/admin/search?q=` — opportunities, leads, payment links, projects | Neon full-text or ILIKE v1 |
| F.2 | Admin CMD+K or header search (debounced) | optional; start with `/admin/search` page |
| F.3 | Funnel report: counts by stage + conversion rates (30d / 90d) | `src/lib/admin/funnel.ts` |
| F.4 | Source dimension: `lead_source` / platform on funnel | Growth + CRM join |
| F.5 | Export CSV for funnel snapshot | download route |

### Manual test flow — Phase F

| Step | Action | Expected |
| ---- | ------ | -------- |
| F.T1 | Search customer name | Hits CRM + payment link |
| F.T2 | Funnel page loads | Stages sum to active pipeline |
| F.T3 | CSV export | Opens in spreadsheet |

**Mark Phase F complete when:** F.T1–F.T3 pass.

---

## Phase G — Team / RBAC (optional)

### Objective

Multiple operators without sharing one owner OTP; align with existing Instagram operator pattern.

### Build tasks

| ID | Task | Path / artifact |
| -- | ---- | --------------- |
| G.1 | Roles: `owner` \| `sales` \| `delivery` \| `finance` \| `instagram_operator` | extend session claims |
| G.2 | Route guards: finance → revenue; sales → growth + CRM | middleware or layout checks |
| G.3 | Assignee on `crm_opportunities` and `agency_projects` | filter “mine” saved view |
| G.4 | Audit: who changed stage / sent invoice | extend audit logs |

Defer **G** until hiring or contractor access is a real need.

---

## Environment variables (cumulative)

| Variable | Phase | Purpose |
| -------- | ----- | ------- |
| Existing `INTEGRATIONS_*`, `GROWTH_*`, `META_*`, Paystack | A | Unchanged |
| `AGENCY_ALERT_EMAILS` | B | Comma-separated alert recipients |
| `AGENCY_ALERT_THRESHOLDS` | B | Optional JSON overrides for triage/IG failures |
| `AGENCY_REMINDER_CRON` | E | Enable payment reminder job |
| `AGENCY_PORTAL_JWT_SECRET` | D | Portal invite tokens (or reuse app secret root) |

Never commit values; use `scripts/sync-cloudflare-env.mjs`.

---

## Branding checklist (all new UI)

| Check | Requirement |
| ----- | ----------- |
| Layout | `AdminShell`, overview uses `max-w-[88rem]` on `/admin` |
| Colors | `var(--admin-*)`, semantic warn/danger tokens |
| Copy | Concrete counts; no vendor product names in titles |
| Auth | Same OTP; portal is separate surface with invite only |
| Ponytail | Small diffs; sign-off manual tests before claiming done |

---

## How this relates to the overview dashboard

Today’s `/admin` overview is the **template** for Phases B, C, and E:

| Overview widget | Phase that deepens it |
| --------------- | --------------------- |
| Due soon | B (alerts), E (revenue) |
| Work queue | C (delivery tab) |
| KPIs | F (funnel backing data) |
| Needs review | B (tasks + rules) |

Ship Overview changes **with** the phase that owns the data—not ahead of schema/API.

---

## Suggested next actions (operators)

1. Run **Phase A** manual tests on production (Instagram + ingest + connector runbook).
2. Pick **B** or **C** for the next dev sprint: **B** if sales inbox is the bottleneck; **C** if delivery chaos is the bottleneck.
3. Update both progress logs (integrations **6.x** + this doc) when a phase goes green.

---

## Code delivery status (planning only)

| Phase | Depends on | Primary new surfaces |
| ----- | ---------- | -------------------- |
| A | Integrations 6.x | Ops runbooks, prod smoke |
| B | CRM repo | Tasks, views, email alerts |
| C | CRM `won` | `/admin/projects` |
| D | C | Client portal routes |
| E | Payments | Cron + aging |
| F | B, C, E | Search + funnel |
| G | Session model | RBAC |

**Agents:** Follow phase order in this file after [INTEGRATIONS_BUILD_PLAN.md](./INTEGRATIONS_BUILD_PLAN.md) Phase 6 sign-off, unless the user explicitly scopes a smaller Ponytail diff (e.g. B.3 only).