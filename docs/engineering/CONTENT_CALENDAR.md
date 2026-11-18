# Content calendar

Admin route: `/admin/content-calendar` (Agency sidebar + Overview shortcut).

## Data

- **Posts** — `content_calendar_posts` (title, `scheduled_on`, optional time, channel, status, script, notes, accent).
- **Media** — `content_calendar_assets` with R2 keys in production; `dev_data` BYTEA when the Worker R2 binding is absent (`next dev`).

Migration: `migrations/0031_content_calendar.sql` — run `npm run db:migrate`.

## R2 (no paid storage at low volume)

Cloudflare R2 includes a free tier (storage + modest operations). Binding: `CONTENT_CALENDAR_BUCKET` → bucket `stackwise-content-calendar` in `wrangler.jsonc`.

One-time (per account):

```bash
npx wrangler r2 bucket create stackwise-content-calendar
```

Deploy as usual after migrate. Media uploads in production use R2; previews are served from `/api/admin/content-calendar/assets/[id]/file` (admin session required).

## UI

Month/week grid inspired by [gr8r-studio calendar](https://github.com/gr8rstudio/gr8r-studio) (`src/views/calendar.js`). **Studio** matches the admin shell; **Scrapbook** adds sky backdrop and polaroid thumbnails like the reference mood boards.