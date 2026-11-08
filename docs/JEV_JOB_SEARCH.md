# JEV job search + Stackwise Growth

Use [jev-job-search](https://github.com/qbeka/jev-job-search) for **finding and rating job posts**. Use **this repo** for **agency leads** (outreach, CRM). Use **JEV `/apply`** only for **your personal** applications.

Two tracks:

| Track | JEV | Stackwise |
| ----- | --- | --------- |
| **Agency leads** | `/discover` on a profile tuned for companies you want to serve | `jev-queue-ingest` → **Growth → Jobs** → email / LinkedIn / CRM |
| **Personal jobs** | `/setup`, `/discover`, `/apply` | Optional ingest to track favorites in Jobs + CRM |

JEV ships for **new grad / early career** boards. For agency lead gen, widen sources (`/add-source`), relax personal fit in your head: a “below threshold” post can still be a **good company to pitch**.

## One-time setup

### Your CV → JEV profile

Stackwise reads `~/Documents/my-cv.json.json` before each discover (override with `STACKWISE_CV_JSON`).

```bash
npm run growth:jev:sync-profile
# or: node scripts/cv-json-to-jev-profile.mjs /path/to/my-cv.json.json
```

Review `workAuthorization` in the generated `~/jev-job-search/data/profile.json` (citizenship is not in the CV JSON and may need a manual fix).

### 1. Clone JEV (keep outside this repo)

```bash
git clone https://github.com/qbeka/jev-job-search ~/jev-job-search
cd ~/jev-job-search
npm install
npx playwright install chromium   # if not already
```

Secrets stay in `~/jev-job-search/data/` and `.env` (gitignored).

### 2. Stackwise

- `npm run dev` and admin login
- `.env.local`: `INTEGRATIONS_INGEST_SECRET`, `OPENROUTER_API_KEY` (Growth drafts)
- See [GROWTH_REAL_DATA.md](./GROWTH_REAL_DATA.md)

### 3. Keys (Cursor or Claude Code)

- [OpenRouter](https://openrouter.ai/keys) in `.env.local` — JEV scoring + Growth drafts
- **Cursor workflow (no Claude Code):** `ANTHROPIC_API_KEY` + `WRITER_BACKEND=api` — see **[JEV_CURSOR_APPLY.md](./JEV_CURSOR_APPLY.md)**
- Optional: Claude Code Pro/Max if you prefer the `claude` CLI and `/apply` skills

## Agency profile (discover → leads)

In JEV, run `claude` then `/setup` with a profile that matches **who you sell to**, not only where you’d work:

- Locations you serve (remote, regions)
- Role types you care about: full-stack, platform, MVP, contract-friendly wording in “what you’re looking for”
- Resume/docs that describe **Stackwise** delivery (production, payments, Cloudflare) so JEV scores against real positioning

Daily:

```bash
# In ~/jev-job-search (Claude Code)
/discover
```

Push strong fits into Growth:

```bash
# From stackwise-technologies (dev server running)
npm run growth:jev:ingest -- --dry-run ~/jev-job-search/data/queue.json
npm run growth:jev:ingest -- ~/jev-job-search/data/queue.json
```

Flags:

- `--min-score=50` (default from env `JEV_INGEST_MIN_SCORE` or 42)
- `--all-queued` — only rows JEV marked ready to apply (personal shortlist)

Then in admin:

1. **Growth → Jobs** — filter, score, notes
2. **Generate reply** / outreach email (company hiring = prospect)
3. **Promote to CRM** — pipeline stage, follow-up

Do **not** run `/apply` for agency leads unless you are personally applying to a role.

Job ingest allows **internships and student programs** (social harvest still filters `looking for job` / `open to work`). Tune **Growth → Settings → ICP** for extra title keywords; defaults add `engineer`, `developer`, `intern`, etc. for scoring.

## Personal profile (discover → apply)

Use the same JEV clone or a second clone (`~/jev-personal`) so agency discover does not mix with personal queue.

1. `npm run growth:jev:sync-profile` — CV → JEV profile; add `JEV_RESUME_PDF` if needed
2. `npm run growth:jev:discover` every day or two
3. **Cursor browser:** `npm run growth:jev:browser:pack` + agent (no Chrome). **Or** `growth:jev:apply` if Google Chrome is installed — [JEV_CURSOR_APPLY.md](./JEV_CURSOR_APPLY.md)
4. Optional: ingest top queue rows into Stackwise to track status next to CRM notes

## Weekly rhythm

| Day | Agency | Personal |
| --- | ------ | -------- |
| Mon / Thu | JEV `/discover` + `growth:jev:ingest` | `/discover` |
| Tue | Growth Jobs triage, 5 outreach emails | `/apply` batch (approved) |
| Wed | CRM follow-ups | `/status`, `/resume` for stuck forms |
| Fri | Harvest X/LinkedIn (social leads) + Jobs merge | `/report` dashboard |

Social intent (founders posting “need a dev”) stays on **Harvest**; job boards stay on **JEV → Jobs**.

## Troubleshooting

| Issue | Fix |
| ----- | --- |
| Ingest `401` | `INTEGRATIONS_INGEST_SECRET` matches Worker/local |
| Ingest `422` low score | Lower `--min-score` or widen ICP in Growth Settings |
| Ingest `409` | Duplicate URL already in inbox |
| JEV only intern titles | Add boards via `/add-source`; check `docs/SOURCES.md` in JEV |
| Jobs page empty | Use **All time** freshness filter in inbox panel |

## Related

- [GROWTH_ENGINE.md](./GROWTH_ENGINE.md)
- [GROWTH_REAL_DATA.md](./GROWTH_REAL_DATA.md)
- JEV: [README](https://github.com/qbeka/jev-job-search), [ARCHITECTURE](https://github.com/qbeka/jev-job-search/blob/main/docs/ARCHITECTURE.md)
