# Instagram / Meta connect session

Stackwise stores Meta app credentials in admin (**Growth → Instagram**) and connects accounts via **Facebook Login** (Page access token for the linked Instagram Business account).

## 1. Meta for Developers

1. Create or open your **Meta app** (type: Business).
2. Add products:
   - **Facebook Login for Business** (or Facebook Login)
   - **Webhooks**
   - **Instagram** (Graph API)
3. **Facebook Login → Settings → Valid OAuth Redirect URIs**  
   Copy the exact URL from the admin panel (**OAuth callback**), e.g.  
   `https://your-domain.com/api/admin/instagram/oauth/callback`  
   For local dev without a tunnel, the panel uses the current origin (e.g. `http://localhost:3002/...`).  
   Override with `INSTAGRAM_OAUTH_REDIRECT_BASE` in production or **ngrok** (below).

## Local testing with ngrok

Meta requires a **public HTTPS** callback. Point ngrok at your dev server, then pin Stackwise to that URL.

1. Start dev: `npm run dev` (note the port, e.g. `3002`).
2. Tunnel: `ngrok http 3002` (or your port).
3. In `.env.local`:

   ```bash
   INSTAGRAM_OAUTH_REDIRECT_BASE=https://YOUR-SUBDOMAIN.ngrok-free.app
   NEXT_PUBLIC_SITE_URL=http://localhost:3002
   ```

   `INSTAGRAM_OAUTH_REDIRECT_BASE` must be **origin only** (no path). The admin panel shows the full callback URL to paste into Meta.

4. Restart dev so env loads. In Meta → Facebook Login → **Valid OAuth Redirect URIs**, paste the panel’s **OAuth callback** (under the ngrok host).
5. Optional: subscribe webhooks to `https://YOUR-SUBDOMAIN.ngrok-free.app/api/webhooks/meta/<slug>` using the same tunnel.
6. Open admin at `http://localhost:3002/admin/...` (your `NEXT_PUBLIC_SITE_URL`), click **Connect Instagram**. Facebook redirects to ngrok → your machine; you land back on localhost with `?oauth=ok`.

To use the ngrok URL for admin as well, set `NEXT_PUBLIC_SITE_URL` to the ngrok origin (and sign in there).

Override return URL after OAuth with `INSTAGRAM_OAUTH_ADMIN_RETURN_BASE` if needed.
4. **App roles:** add your Facebook user as **Admin** or **Developer** (required for testing before App Review).

## 2. Stackwise admin

1. **Add Meta app** — Meta app ID, app secret, webhook verify token, slug (used in webhook URL).
2. Click **Connect Instagram** — sign in with a user that **manages the Facebook Page** linked to the IG account.
3. Optional env:
   - `INSTAGRAM_FACEBOOK_PAGE_ID` — if multiple Pages have Instagram, pick one Page ID.
   - `INSTAGRAM_PUBLIC_BASE_URL` — public origin for tracked short links.
4. **Test token** on the connected account row (uses Meta `debug_token` with your stored app secret).

## 3. Webhooks

In Meta app → **Webhooks**, subscribe object **Instagram**:

- Callback: `https://<domain>/api/webhooks/meta/<slug>`  
  (`<slug>` matches the row you created in admin.)
- Verify token: same string you saved on the Meta app row.
- Fields (Phase 6.1–6.2): `comments`, `messages`, `messaging_postbacks` (as needed).

Use the app secret from admin for **signature validation** on `POST` (already implemented).

## 4. Permissions (App Review for production)

OAuth scopes requested by Stackwise:

- `instagram_basic`, `instagram_manage_comments`, `instagram_manage_messages`
- `pages_show_list`, `pages_read_engagement`, `pages_manage_metadata`

Standard access is enough for apps you own; other businesses’ accounts need **Advanced Access** and App Review.

## 5. Manual test checklist (Phase 6.1.T)

- [ ] Webhook verify `GET` succeeds in Meta console  
- [ ] Connect session completes; account shows `@username` and **Test token** passes  
- [ ] Comment on a post with campaign keyword → delivery log + DM (disable `INSTAGRAM_DRY_RUN` in prod)

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| Redirect URI mismatch | Callback in Meta must match admin **OAuth callback** byte-for-byte |
| No Instagram Business account | Link IG Professional/Business to a Facebook Page; grant Page access to the logging-in user |
| Several Pages listed in error | Set `INSTAGRAM_FACEBOOK_PAGE_ID` to the correct Page ID |
| DMs not sending | Turn off `INSTAGRAM_DRY_RUN`; confirm `instagram_manage_messages` approved |