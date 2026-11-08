# JEV apply from Cursor (no Claude Code)

[JEV](https://github.com/qbeka/jev-job-search) was packaged with Claude Code skills (`/apply`, `/discover`). From this repo you can either use **Cursor’s built-in browser** (agent-assisted) or JEV’s **full auto-fill** (requires Google Chrome). Stackwise forwards keys from `.env.local` so you do not duplicate secrets in `~/jev-job-search/.env`.

## Cursor browser apply (no Google Chrome)

**`npx jev apply` cannot drive Cursor’s browser tab.** JEV spawns its own Chrome and speaks CDP to `127.0.0.1`; Cursor’s browser is only available to the agent via MCP (`browser_navigate`, `browser_fill`, etc.).

Use this track when Chrome is missing or you want to watch the tab inside Cursor:

```bash
npm run growth:jev:discover          # refill queue (no browser)
npm run growth:jev:browser:pack -- --count 1
```

That writes **`.jev-cursor-apply/session.json`** (gitignored; contains your email/phone for the agent).

In Cursor chat, for example:

> Apply job **1** from `.jev-cursor-apply/session.json` in the Cursor browser. Fill from `applicant`, do not submit until I say so.

The agent should: navigate to `jobs[0].applyUrl`, snapshot the form, fill known fields from `applicant` and `standingAnswers`, pause for you on CAPTCHA / resume upload / multi-step flows, and submit only when you ask.

After each job:

```bash
npm run growth:jev:browser:mark -- <jobId> applied
# or skipped | manual
```

| JEV Chrome apply | Cursor browser apply |
| ---------------- | -------------------- |
| JEV maps fields + JEV model + read-back verify | Agent + you; slower, more flexible |
| Needs Google Chrome | Needs Cursor browser MCP |
| `growth:jev:apply` | `growth:jev:browser:pack` + agent |

Discover and queue scoring are the same for both.

## Full JEV apply (Google Chrome)

Requirements and Chrome-only CLI flow below.

## What you need

| Requirement | Notes |
| ----------- | ----- |
| **Node 22+** | Same as JEV |
| **Google Chrome** | Only for `growth:jev:apply` (full automation). **Not** required for Cursor browser apply |
| **`~/jev-job-search`** | `git clone` + `npm install` |
| **`OPENROUTER_API_KEY`** | In Stackwise `.env.local` (discover + JEV field decisions) |
| **`ANTHROPIC_API_KEY`** | Or the Claude Code `claude` CLI (you have this) — see writer row below |
| **Resume PDF** | Path in `~/jev-job-search/data/profile.json` — set `JEV_RESUME_PDF` when syncing CV |

Optional in `.env.local`:

```bash
WRITER_BACKEND=api          # default when ANTHROPIC_API_KEY is set
JEV_HOME=/path/to/jev-job-search
JEV_WRITER_BACKEND=api      # override writer without touching JEV’s .env
JEV_APPLY_SUBMIT=1          # only if you insist on npm scripts defaulting to submit (prefer --submit on CLI)
```

Do **not** commit API keys. Run `node scripts/check-no-secrets.mjs` before PRs that touch env samples.

## One-time checklist

```bash
# From stackwise-technologies
npm run growth:jev:sync-profile
npm run growth:jev:doctor -- --online
```

Fix anything `doctor` flags (Chrome, resume PDF, queue empty → discover first).

## Daily flow in Cursor

1. **Discover** (refill queue):

   ```bash
   npm run growth:jev:discover -- --limit 40
   ```

2. **Apply in Cursor browser** (no Chrome):

   ```bash
   npm run growth:jev:browser:pack -- --count 1
   ```

   Then ask the agent to fill job `[1]` from the session file (see top of this doc).

3. **Or full JEV** — rehearse then submit (Google Chrome required):

   ```bash
   npm run growth:jev:apply -- --dry --count 3
   npm run growth:jev:apply -- --count 5 --submit
   ```

4. **Status** / logs:

   ```bash
   npm run growth:jev:status
   ```

   Records: `~/jev-job-search/applications/*.csv` and `npx jev log` inside JEV.

5. **Optional agency track** (do not confuse with personal apply):

   ```bash
   INGEST_URL=http://localhost:3005/api/admin/integrations/ingest npm run growth:jev:ingest
   ```

## Asking the Cursor agent

Open this repo and say, for example:

- “Run `growth:jev:doctor --online` and fix blockers.”
- “Dry-run three applications, then apply one with `--submit` if output looks correct.”

The agent should follow `docs/JEV_CURSOR_APPLY.md` and **never** submit without `--submit` unless you explicitly asked.

## Claude Code vs Cursor

| Claude Code | Cursor + Stackwise |
| ----------- | ------------------ |
| `/apply` skill orchestration | `npm run growth:jev:apply` + this doc |
| `claude` CLI on subscription | `ANTHROPIC_API_KEY` + `WRITER_BACKEND=api` |
| Skills read `SKILL.md` | Agent reads `docs/JEV_CURSOR_APPLY.md` |

JEV does not support OpenRouter for **sentence** writing—only Anthropic (API or Claude Code). Growth drafts elsewhere in this app may still use OpenRouter.

If `npm run growth:jev:doctor` shows **Claude: Claude Code** and ok, you do not need `ANTHROPIC_API_KEY` for apply—only OpenRouter for discover/scoring.

## Troubleshooting

| Issue | Fix |
| ----- | --- |
| `claude command was not found` | Add `ANTHROPIC_API_KEY` to `.env.local` or install Claude Code |
| Chrome not found | Install Chrome; on Linux set `BROWSER.chromePath` in JEV config |
| Empty queue | `npm run growth:jev:discover` |
| Resume missing | Export PDF, set `JEV_RESUME_PDF=/full/path/to.pdf` and re-run `growth:jev:sync-profile` |
| Forms stuck (CAPTCHA, email code) | Finish in JEV’s Chrome window, then `npx jev resume` in `JEV_HOME` |

See also [JEV_JOB_SEARCH.md](./JEV_JOB_SEARCH.md).
