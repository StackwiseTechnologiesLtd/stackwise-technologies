# Instagram production URLs (LOOIAL-IG)

Meta app slug in Neon: **`looial-ig`** (webhook path segment).

| Where in Meta | URL |
|---------------|-----|
| **Business login → Redirect URL** | `https://stackwisetechnologies.com/api/admin/instagram/oauth/callback` |
| **Webhooks → Callback URL** | `https://stackwisetechnologies.com/api/webhooks/meta/looial-ig` |
| **Verify token** | Same string stored on the Meta app row in admin (not the OAuth path) |

**After OAuth (browser only, not a Meta field):** users return to  
`https://stackwisetechnologies.com/admin/instagram/connection?oauth=ok`

**Worker env** (in `.env.prod`, synced with `npm run cf:secrets`):

```env
NEXT_PUBLIC_SITE_URL=https://stackwisetechnologies.com
INSTAGRAM_OAUTH_REDIRECT_BASE=https://stackwisetechnologies.com
INSTAGRAM_PUBLIC_BASE_URL=https://stackwisetechnologies.com
INSTAGRAM_DRY_RUN=0
```

Then `npm run deploy:live` (build bakes `NEXT_PUBLIC_*`) or `npm run cf:secrets` if only secrets changed.