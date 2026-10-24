<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Stackwise integrations (agents)

- **Build plan:** `docs/INTEGRATIONS_BUILD_PLAN.md` — includes manual test flows and a progress sign-off table per phase.
- **CRM:** In-repo only (`src/lib/crm/`, `/admin/crm`). Data: `docs/vendor/TWENTY_REFERENCE.md`. UI/features (inspire or copy per AGPL): `docs/vendor/TWENTY_UI_AND_FEATURES.md`, `vendor/twenty/`. No hosted Twenty server or iframe.
- **Scope:** Ponytail-style minimal changes (`docs/engineering/ponytail.md`). No secrets in tracked files; run `node scripts/check-no-secrets.mjs` before PRs touching config.
