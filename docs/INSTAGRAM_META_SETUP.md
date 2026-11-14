# Instagram / Meta setup (official API — OpenReply-class)

Stackwise connects Instagram **Professional** accounts with **Instagram Business Login** (unified Instagram API), exchanges long-lived tokens on `graph.instagram.com`, sends DMs/comments via the same Graph endpoints as [OpenReply](https://github.com/diwenne/openreply), and receives **comments** + **messages** webhooks.

## Meta dashboard (what you see)

Use **Instagram → API setup with Instagram business login** (not legacy Basic Display).

| Step in Meta | Stackwise |
|--------------|-----------|
| **Instagram App ID / secret** | Admin → Meta apps: **Instagram App ID** + **Instagram App secret** |
| **Configure webhooks** — Callback URL + Verify token | `https://<public-host>/api/webhooks/meta/<slug>` + same verify token as admin |
| Subscribe **comments** and **messages** | Required for comment-to-DM and DM/story triggers (6.2) |
| **Set up Instagram business login** → OAuth redirect URIs | `https://<public-host>/api/admin/instagram/oauth/callback` (exact; no trailing slash) |
| **Roles** → Instagram Tester | Your IG account before App Review |
| **App Review** | Skip if you only automate your own business |

Optional: **Facebook App secret** from **App settings → Basic** — add in admin if webhook `POST` signature verification fails (Meta may sign with either secret).

## Go live (production)

Set Cloudflare Worker secrets (`npm run cf:secrets` from `.env.prod`) — at minimum:

| Variable | Value (example) |
|----------|-----------------|
| `NEXT_PUBLIC_SITE_URL` | `https://stackwisetechnologies.com` |
| `INSTAGRAM_OAUTH_REDIRECT_BASE` | same origin |
| `INSTAGRAM_PUBLIC_BASE_URL` | same origin (tracked `/r/ig/` links) |
| `INSTAGRAM_DRY_RUN` | `0` or unset |

**Meta console**

| Field | URL |
|-------|-----|
| Business login → **Redirect URL** | `https://stackwisetechnologies.com/api/admin/instagram/oauth/callback` |
| Webhooks → **Callback URL** | `https://stackwisetechnologies.com/api/webhooks/meta/<slug>` |

Owners copy exact values from **Connection** in `/admin/instagram` (includes Copy buttons). Turn off ngrok; point Meta to the live host only.

**Operators** — invite on **Team access** (`ADMIN_EMAILS` only). They sign in via OTP, land on `/admin/instagram`, cannot open payments/growth/CRM, and cannot view Meta app secrets or connect tokens (API returns 403).

## Environment

| Variable | Purpose |
|----------|---------|
| `INSTAGRAM_OAUTH_REDIRECT_BASE` | Public origin (ngrok/prod), no path |
| `NEXT_PUBLIC_SITE_URL` | Admin origin when callback is ngrok |
| `INSTAGRAM_PUBLIC_BASE_URL` | Tracked `/r/ig/` links |
| `META_GRAPH_API_VERSION` | e.g. `v21.0` or `v25.0` (default `v21.0`) |
| `INSTAGRAM_DRY_RUN=1` | Local: skip Graph sends |

## Local testing with ngrok

1. `ngrok http <dev-port>`
2. `.env.local`:

   ```bash
   INSTAGRAM_OAUTH_REDIRECT_BASE=https://YOUR.ngrok-free.app
   NEXT_PUBLIC_SITE_URL=http://localhost:3002
   ```

3. Meta → **Business login** OAuth URIs + **Configure webhooks** use the ngrok host.
4. Admin on localhost → **Connect Instagram** → returns with `?oauth=ok`.

After connect, Stackwise calls `subscribed_apps` for **comments** + **messages** (same as OpenReply’s programmatic subscribe). You still verify the callback URL in the Meta UI.

## Operator portal (team access)

- **Dashboard:** `/admin/instagram` — OpenReply/ManyChat-style pages (Overview, Automations, Activity, Connection, Team).
- **Owners** (`ADMIN_EMAILS`): full access including Meta app secrets and **Team** invites.
- **Operators:** invite on **Team access** with email + optional single Instagram account scope. They sign in via the same OTP login but only see `/admin/instagram/*`.

## Stackwise admin flow

1. **Add Meta app** — Instagram App ID, Instagram App secret, webhook verify token, slug.
2. **Connect Instagram** — user signs in with the professional account.
3. Account row stores `user_id` (matches webhook `entry.id`), long-lived token, expiry.
4. **Test token** — Meta `debug_token` with app credentials.
5. Create campaigns; disable `INSTAGRAM_DRY_RUN` for real sends.

## Permissions (App Review)

OAuth scopes (Business Login):

- `instagram_business_basic`
- `instagram_business_manage_comments`
- `instagram_business_manage_messages`

Use the justifications in OpenReply’s `META_APP_REVIEW.md` as a template.

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| Redirect URI mismatch | OAuth URI in Meta must match admin **OAuth callback** exactly |
| Webhook verify OK but POST 401 | Add **Facebook App secret** on the Meta app row; subscribe **comments** + **messages** |
| Graph `Unsupported request` after connect | Use **Instagram** App ID/secret (Business Login), not Facebook Login Page tokens |
| Webhooks never arrive | Callback URL on primary domain (no redirect); app tester role; Live vs Dev per Meta |
| `entry.id` mismatch | Re-connect; stored ID must be `user_id` from `/me`, not app-scoped `id` |