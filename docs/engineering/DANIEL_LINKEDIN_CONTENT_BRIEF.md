# Daniel personal LinkedIn content

Scripts for Daniel "Teddy" Tshikomba (hiring + Looial SMB audience). **Not** Looial brand voice — see [LOOIAL_CONTENT_BRIEF.md](./LOOIAL_CONTENT_BRIEF.md).

## Calendar

- Admin: `/admin/content-calendar` — channel **LinkedIn**, titles prefixed `[daniel-li]`.
- Seed / refresh scripts (requires `DATABASE_URL`):

```bash
npm run content-calendar:plan-daniel-linkedin
npm run content-calendar:plan-daniel-linkedin:audit
```

Optional env when seeding:

- `CONTENT_CALENDAR_DANIEL_KICKOFF=0` — no first-Saturday slot (Tue/Thu only)
- `CONTENT_CALENDAR_DANIEL_START=2026-12-01` — earliest publish day
- `CONTENT_CALENDAR_DANIEL_SKIP=12-24,12-25,12-31,01-01` — skip holidays (default)
- `CONTENT_CALENDAR_DANIEL_TIME=10:00` — scheduled_time column

Re-run **replaces** all `[daniel-li]` posts (same pattern as `[dec-plan]`). Edits in admin with heavy `updated_at` drift are warned in the script output.

Source of truth for copy: `scripts/lib/daniel-linkedin-posts.mjs` (26 posts: CMND connectors, Phi, Looial, INSIGHTER, Activepieces/OSS).

## Voice (summary)

- Open on one specific build/fix with constraint and outcome — never "excited to share" or concept definitions.
- One idea per post; ~120–200 words; short lines.
- Show orchestration (routing, retries, state, approval, observability) with real decisions — not skill lists.
- No invented metrics, customers, or dates. Ask Daniel before numbers or INSIGHTER year.
- ≤2 hashtags or none; no engagement-bait questions at the end.

## Fact anchors (for editors)

- **CMND:** `cmnd-ai-api` — tool.confirmed, getFunctionToRun, dangerous tools, WhatsApp piece, workspaces (git: Daniel Teddy + where.is.one).
- **Phi:** PR #268 / issue #259 (mirror vs present).
- **Construct AI / INSIGHTER:** Noor Ul Zain, Talal Shafei, Joseph Adepoju; grand prize; İskele — **confirm year**.
- **Looial:** WhatsApp + Wallet; Nairobi pilots; mid-December travel window — update when stale.