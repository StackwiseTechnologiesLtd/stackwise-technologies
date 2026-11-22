# Admin UI style guide

All routes under `/admin` share **one shell** (`AdminShell`): sidebar, header breadcrumb, canvas tokens, and max-width main column. Feature areas add a **horizontal sub-nav** only — never a second sidebar or alternate chrome.

## Shell (required)

| Piece | Source | Notes |
|--------|--------|--------|
| Layout wrapper | `src/app/admin/layout.tsx` → `AdminShell` | Login (`/admin/login`) is the only full-bleed exception. |
| Sidebar | `AdminShell` + `adminNavSections` | Icons, collapse, mobile drawer — do not rebuild. |
| Page title | `adminPageTitle(pathname)` | Shown in header breadcrumb. |
| Area label | `adminBreadcrumbArea(pathname)` | e.g. Agency, Pipeline, Instagram DM. |
| Main padding / width | `AdminShell` `<main>` | `max-w-6xl` (overview uses `max-w-[88rem]`). |

**Do not:**

- Bypass `AdminShell` for a feature (no custom `#0a0a0c` full-viewport layouts).
- Duplicate account menu / sign-out in feature headers.
- Use public-site tokens (`border-line`, `bg-panel`, `BTN_*` from `@/lib/ui/buttons`) inside admin.

## Design tokens (`globals.css`)

Use CSS variables, not one-off hex:

| Token | Typical use |
|-------|-------------|
| `--admin-canvas` | Page background (shell) |
| `--admin-surface` | Cards, tables |
| `--admin-surface-hover` | Row / list hover |
| `--admin-sidebar` | Sidebar + sticky header |
| `--admin-border` | Borders, dividers |
| `--admin-nav-hover` / `--admin-nav-active` | Subtle fills, selected chips |
| `--admin-focus` | Focus rings (matches accent) |
| `--admin-panel-inset` | Light top inset on panels |

## Class helpers (`@/lib/ui/admin`)

Import named constants — keeps panels aligned with Overview / CRM.

| Export | Use |
|--------|-----|
| `ADMIN_BTN_PRIMARY` / `SECONDARY` / `GHOST` | Actions |
| `ADMIN_INPUT` | Text fields |
| `ADMIN_TABLE_WRAP` / `ADMIN_TABLE_SCROLL` / `ADMIN_TABLE_HEAD` | Tables |
| `ADMIN_NAV_LINK` | Custom in-shell links only (sidebar is internal) |
| `ADMIN_PANEL` | Section card: bordered surface + inset shadow |
| `ADMIN_PANEL_PAD` | `ADMIN_PANEL` + `p-5 sm:p-6` |
| `ADMIN_INSET` | Nested block (code, forms inside a panel) |
| `ADMIN_PANEL_HEADER` | Title row with bottom border |

**Forms:** prefer `@/components/stackwise` pickers — see [STACKWISE_UI.md](./STACKWISE_UI.md).

## Sub-navigation pattern

When a sidebar item has multiple screens, add a **tab strip** under the breadcrumb (inside page content):

1. Define links in `src/lib/admin/*-nav.ts` (or `nav-meta.ts` children).
2. Component: `*SubNavBar.tsx` — copy `GrowthSubNavBar` / `InstagramSubNavBar`.
3. Layout: `*LayoutClient.tsx` wraps `{children}` with `space-y-6` + sub-nav.

**Examples:**

- Pipeline: `GrowthSubNavBar` on `/admin/crm`, `/admin/growth/*`, etc. (nested under Pipeline in sidebar).
- Instagram: `InstagramSubNavBar` on `/admin/instagram/*` (still under Pipeline → Instagram DM in sidebar).

**Two-column overview grids** (`1fr` + sidebar): use `items-start` so the main column does not stretch to the sidebar height. Sidebar rails: `sticky top-0 max-h-[calc(100dvh-5.5rem)] overflow-y-auto` when stacked panels exceed the viewport.

Sub-nav classes:

```txt
border-b border-[var(--admin-border)]
active tab: border-b-2 border-accent text-foreground
inactive: border-transparent text-muted hover:border-[var(--admin-border)] hover:text-foreground
```

## Panels and tables

**Standard section:**

```tsx
import { ADMIN_PANEL_PAD, ADMIN_PANEL_HEADER, ADMIN_INSET } from "@/lib/ui/admin";

<section className={ADMIN_PANEL_PAD}>
  <div className={ADMIN_PANEL_HEADER}>
    <h2 className="text-base font-semibold">Title</h2>
  </div>
  <div className={`mt-4 ${ADMIN_INSET} px-3 py-3 text-sm`}>…</div>
</section>
```

**Tables:** `ADMIN_TABLE_WRAP` + `ADMIN_TABLE_SCROLL`; header row `ADMIN_TABLE_HEAD`.

**Panel pagination:** `AdminPanelPagination` / `AdminScrollPaginatedPanel` — `«` page numbers `»` only (no single-step ‹ › or “Back” / “Next” text). Range: `1-4 of 6`.

## Instagram / growth integration UI

- Routes: `/admin/instagram/*` (not `/admin/growth/instagram` — redirect only).
- Connection, campaigns, activity reuse `GrowthInstagramPanel` sections but **must** use admin tokens above.
- OAuth banner: `GrowthInstagramOAuthBanner` via `InstagramPortalExtras`.

## Checklist for new admin features

1. Page lives under `src/app/admin/...` (inherits `AdminShell`).
2. Title + breadcrumb area registered in `nav-meta.ts` if needed.
3. Sub-nav only if ≥2 sibling pages; otherwise sidebar link is enough.
4. Panels use `ADMIN_PANEL*` / `--admin-*` tokens.
5. Buttons `ADMIN_BTN_*`; inputs `ADMIN_INPUT` or Stackwise pickers.
6. No secrets in UI; env hints are labels only.

## Legacy `border-line` / `bg-panel`

Older admin screens (some CRM/growth forms, login card) still use marketing tokens. **New work and refactors** must use `--admin-*` and `ADMIN_PANEL*` — do not add new `border-line` under `/admin`.

## Reference pages

- **Agency overview:** `AgencyOverviewDashboard.tsx` — KPI cards, panels, tables.
- **CRM:** `CrmWorkspace.tsx` — tables, modals, Stackwise pickers.
- **Instagram:** `InstagramOverviewDashboard.tsx` + `GrowthInstagramPanel.tsx` — after token unification.