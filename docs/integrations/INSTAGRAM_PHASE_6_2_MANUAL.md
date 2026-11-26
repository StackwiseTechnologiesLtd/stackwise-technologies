# Instagram Phase 6.2 — manual sign-off

Runs **6.2.T1–6.2.T6** in [INTEGRATIONS_BUILD_PLAN.md](../INTEGRATIONS_BUILD_PLAN.md). **6.1** must be signed off first.

## Local smoke (optional pre-check)

```bash
PORT=3002 INSTAGRAM_DRY_RUN=1 npm run dev    # terminal A
INSTAGRAM_SMOKE_BASE=http://localhost:3002 npm run integrations:instagram:smoke   # terminal B
```

Covers comment + DM simulate, `{username}`, tracked `/r/ig/:token` click count — not Meta App Review shapes.

## Prerequisites

- Prod `INSTAGRAM_DRY_RUN=0`; DM (`messages`) and webhook fields subscribed on the Meta app.
- `/admin/growth/instagram` — create campaigns per trigger type.

## Test steps

| ID | Action | Pass criteria |
|----|--------|----------------|
| 6.2.T1 | Campaign: DM keyword `PRICING` | Inbound DM enqueues send; delivery `sent` |
| 6.2.T2 | Story reply keyword (if enabled) | Story webhook shape → same as T1 |
| 6.2.T3 | Template with `{username}` | Received DM shows correct handle |
| 6.2.T4 | CTA / tracked URL in DM | `instagram_link_events` row; browser redirect OK |
| 6.2.T5 | Delivery log | Click count ≥ 1 without SQL |
| 6.2.T6 | Burst faster than rate policy | Rows `skipped` or retried with reason — no silent drops |

## Sign-off

```markdown
| 6.2 IG triggers/links | ☑ | <initials> | YYYY-MM-DD | 6.2.T1–T6 prod |
```

Then **Phase 6.3** (inbox sync + manual reply).