# Ponytail + Stackwise agent discipline

[Ponytail](https://github.com/dietrichgebert/ponytail/) encourages minimal, senior-style changes: solve the task with the smallest correct diff, avoid speculative abstractions, and skip work that is not required for the current step.

## Required for this repo

1. Follow [INTEGRATIONS_BUILD_PLAN.md](../INTEGRATIONS_BUILD_PLAN.md) phase order (Ponytail → integration fabric → in-repo CRM → Huginn → freehire).
2. Prefer extending existing modules (`growth_*`, `AdminShell`, Neon migrations) over new apps or hosted CRMs.
3. Never commit secrets; use `scripts/sync-cloudflare-env.mjs` for Worker secrets.

## Installing Ponytail skills (optional)

```bash
npx skills add https://github.com/dietrichgebert/ponytail --list
```

Use the Cursor / agent rules variant that matches your editor. Project rules in `.cursor/rules/` should stay aligned with Ponytail (small scope, YAGNI).

## Before marking a phase complete

Run the **Manual test flow** for that phase in `INTEGRATIONS_BUILD_PLAN.md` and update the Progress log table.
