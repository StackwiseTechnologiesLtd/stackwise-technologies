# Twenty — UI inspiration, selective copy, and feature roadmap

[Twenty](https://github.com/twentyhq/twenty) is the **UX and product reference** for Stackwise CRM inside `/admin`. We run **no** Twenty server; we **reimplement** (or selectively port) UI and behavior in our Next.js admin using Tailwind and existing `AdminShell` tokens.

**Data model:** [TWENTY_REFERENCE.md](./TWENTY_REFERENCE.md)

---

## License before copying code

Twenty is open source under **[AGPL-3.0](https://github.com/twentyhq/twenty/blob/main/LICENSE)** (verify on the commit you copy from).

| Approach | When to use | Obligation |
|----------|-------------|------------|
| **Inspired** — same layout, our components | Default for Stackwise | None; document reference link in PR |
| **Adapted** — port JSX/logic, rewrite styles to Tailwind + `--admin-*` | Faster parity on complex widgets | If substantial copy from Twenty, place under `vendor/twenty/` with `LICENSE` + `UPSTREAM_SHA` |
| **Pinned vendor chunk** — copy file(s) with minimal edits | Rare; e.g. a pure utility with no UI | AGPL: source of modifications available to users of our deployed app; legal review if unsure |

**Never** iframe `twenty.com` or ship their full `twenty-front` bundle as a black box.

---

## Where to look in the Twenty repo

| Area | Upstream path (typical) | Stackwise target |
|------|-------------------------|------------------|
| Pipeline / kanban | `packages/twenty-front` — opportunities, views | `src/components/admin/crm/CrmPipelineBoard.tsx` |
| Record detail (show page) | Record layout, tabs, fields | `src/app/admin/crm/opportunities/[id]/page.tsx` |
| Activity timeline | Timeline / notes components | `src/components/admin/crm/CrmActivityTimeline.tsx` |
| Table + filters | Record table, filter chips | `src/components/admin/crm/CrmRecordTable.tsx` |
| Command menu / quick actions | CMD+K patterns | Phase 2.5+ optional `CrmCommandPalette.tsx` |
| Design tokens | Linaria themes | Map to `src/styles/globals.css` admin vars — **do not** import Linaria into Worker bundle |

When copying, record in `vendor/twenty/README.md`:

```text
UPSTREAM_SHA=<git sha>
FILES=copied/path/in/twenty → vendor/twenty/...
NOTES=what was changed (Tailwind, removed GraphQL, etc.)
```

---

## UI principles (Stackwise identity)

1. **Shell:** Always `AdminShell` + sidebar; CRM is not a separate app chrome.
2. **Theme:** Dark admin canvas (`--admin-canvas`, `--admin-surface`, `--accent`). Twenty’s light-gray CRM look is **translated**, not pasted.
3. **Typography:** Existing Geist / admin scale — avoid importing Twenty font stacks unless explicitly matched in a design pass.
4. **Density:** Match Growth inbox card patterns where possible so Growth → CRM feels continuous.
5. **Labels:** User-facing copy says Stackwise CRM / Pipeline / Lead — not “Twenty”.

---

## Feature tiers (what we take from Twenty)

### Tier A — Phase 2 MVP (ship with in-repo CRM)

| Feature | Twenty inspiration | Stackwise implementation |
|---------|-------------------|---------------------------|
| Pipeline by stage | Kanban columns | Drag or dropdown stage change; columns = `pipeline_status` |
| Opportunity record | Show page header + key fields | Person, company, fit %, source URL, platform badge |
| Activity timeline | Notes + system events | `crm_activities`; manual notes + auto “promoted from Growth” |
| Link to Growth lead | Linked records | Button to `/admin/growth` inbox row / lead id |
| Table view | List view alternative to board | Sort by recency / fit score |

### Tier B — After MVP (copy or adapt UI as needed)

| Feature | Notes |
|---------|--------|
| **Saved views** (filters, sort) | Start with presets: “New this week”, “High fit”, “LinkedIn only” |
| **Field layout** on record | Two-column detail like Twenty; configurable later |
| **Company ↔ people** relations | Multiple contacts per deal |
| **Tasks / reminders** | Lightweight `crm_tasks` table |
| **Email compose stub** | Link out to mailto / copy draft — no full email sync in v1 |
| **CMD+K** quick open record | Optional; copy interaction pattern only |

### Tier C — Explicitly later / optional

| Feature | Why deferred |
|---------|----------------|
| Twenty workflows / automation builder | Use Huginn + Growth harvest instead |
| Twenty AI agents | Use OpenRouter in Growth drafts |
| Full email/calendar sync | High integration cost |
| Multi-workspace / RBAC | Single Stackwise admin OTP is enough for now |
| Custom objects builder | Fixed schema in Neon |

---

## UI copy workflow (for implementers)

1. Open Twenty demo or self-hosted screenshot / Storybook for the target screen.
2. Sketch layout in PR description (or link Figma).
3. Build with `src/components/admin/*` primitives first.
4. If stuck on interaction (e.g. kanban drag), find smallest upstream file → copy to `vendor/twenty/ui/` → restyle to Tailwind.
5. Add **manual test** row in [INTEGRATIONS_BUILD_PLAN.md](../INTEGRATIONS_BUILD_PLAN.md) Phase 2 UI section.
6. PR checklist: branding table + “no iframe” + upstream SHA if vendor copy.

---

## Manual UI parity checks (add to Phase 2 sign-off)

| ID | Check |
|----|--------|
| 2.U1 | Pipeline board: columns for all active stages; card shows name + company + fit % |
| 2.U2 | Record page: hero title, stage control, primary links (post, profile, Growth) |
| 2.U3 | Timeline: chronological notes; stage changes logged automatically |
| 2.U4 | Keyboard: Tab order sane; stage change usable without mouse |
| 2.U5 | Mobile: pipeline scrolls horizontally or collapses to list (define breakpoint in PR) |
| 2.U6 | Side-by-side feel: navigate Growth lead → CRM record without layout jump |

---

## Other products (brief)

| Product | UI / feature borrow |
|---------|---------------------|
| **Huginn** | None in admin — scenario names only in Integrations panel |
| **freehire** | Job row layout can mirror Growth inbox cards; optional borrow of search filter chips pattern from their Svelte app (inspired only) |
| **Ponytail** | No UI — agent behavior only |
