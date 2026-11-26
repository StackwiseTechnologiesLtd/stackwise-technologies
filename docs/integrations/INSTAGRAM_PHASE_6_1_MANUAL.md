# Instagram Phase 6.1 — manual sign-off

Runs the checklist in [INTEGRATIONS_BUILD_PLAN.md](../INTEGRATIONS_BUILD_PLAN.md) (6.1.T1–6.1.T9). Do not check **6.1** complete until all steps pass on **production** (or tunneled preview with Meta webhooks pointed at the same URL).

## Quick setup (CLI)

```bash
npm run integrations:instagram:61-setup          # T1 probe + active account check
INSTAGRAM_61_MEDIA_ID=<post-id> npm run integrations:instagram:61-setup   # GUIDE campaign on active account (@trylooial)
INSTAGRAM_DRY_RUN=1 npm run dev                  # then in another terminal:
INSTAGRAM_SMOKE_BASE=http://localhost:3002 npm run integrations:instagram:61-exercise  # T4–T8 on Neon via /simulate
```

Get `<post-id>` from the post in Meta/IG (or admin after reconnecting OAuth). Uses prod webhook host `https://stackwisetechnologies.com` unless `INSTAGRAM_61_WEBHOOK_HOST` is set.

## Prerequisites

- `npm run db:migrate:prod` applied (Instagram migrations `0020`–`0026+`).
- Worker secrets synced: `npm run cf:secrets` (Meta app secret, `INSTAGRAM_*`, `DATABASE_URL`, queue bindings in `wrangler.jsonc`).
- Meta app: Instagram product, **webhooks** + **messages** permissions; test IG Business/Creator account.
- Webhook URL: `https://stackwisetechnologies.com/api/webhooks/meta/<appSlug>` (or your `NEXT_PUBLIC_SITE_URL` + slug).
- Admin: `/admin/instagram/connection` (Meta apps + OAuth), `/admin/growth/instagram` (accounts, campaigns, **Delivery log**).
- Integrations strip: `/admin/growth` → integrations status (or Overview Instagram card) for **last webhook / last send**.

## Test steps (map to build plan)

| ID | Where | Pass criteria |
|----|--------|----------------|
| 6.1.T1 | Meta Developer → Webhooks → Verify | `hub.challenge` 200; fields subscribed (`comments`, `messages` as needed). |
| 6.1.T2 | `/admin/instagram/connection` | Meta app row + connected IG account; token encrypted in DB. |
| 6.1.T3 | `/admin/growth/instagram` → campaign | Active campaign, media id, keyword `GUIDE`, private reply template. |
| 6.1.T4 | Second IG user comments `GUIDE` | Delivery: `queued` → `sent` (or `failed` with Meta error in log). |
| 6.1.T5 | Delivery log filters | Campaign + status; trigger id, recipient, template snippet, times. |
| 6.1.T6 | Repeat keyword / duplicate payload | `skipped` + `duplicate`. |
| 6.1.T7 | Non-matching comment | No send (optional skipped row — may be absent). |
| 6.1.T8 | Deactivate campaign; comment again | `skipped` + `campaign_inactive`. |
| 6.1.T9 | `/admin/instagram` overview or integrations status | `lastWebhookAt` / `lastSendAt` refresh after T4. |

## Sign-off

When all pass, update the progress table in `INTEGRATIONS_BUILD_PLAN.md`:

```markdown
| 6.1 IG comment-to-DM | ☑ | <initials> | YYYY-MM-DD | 6.1.T1–T9 prod |
```

Then proceed to **[Phase 6.2](./INSTAGRAM_PHASE_6_2_MANUAL.md)** (triggers, links, `{username}`).

### Automated smoke (6.1 + 6.2 paths, local only)

```bash
PORT=3002 INSTAGRAM_DRY_RUN=1 npm run dev    # terminal A
INSTAGRAM_SMOKE_BASE=http://localhost:3002 npm run integrations:instagram:smoke   # terminal B
```

Use port **3002** when **3000** is taken (e.g. other Docker stacks). Account connect in smoke uses token `fake-token-for-dry-run` (dev-only bypass).