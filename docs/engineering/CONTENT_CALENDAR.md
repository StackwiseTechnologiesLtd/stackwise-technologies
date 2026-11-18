# Content calendar

Admin route: `/admin/content-calendar` (Agency sidebar + Overview shortcut).

## Data

- **Posts** — `content_calendar_posts` (title, `scheduled_on`, optional time, channel, status, script, notes, accent).
- **Media** — `content_calendar_assets` with R2 keys in production; `dev_data` BYTEA when the Worker R2 binding is absent (`next dev`).

Migration: `migrations/0031_content_calendar.sql` — run `npm run db:migrate`.

**December plan (scripts only, no attachments):** `npm run content-calendar:plan-december` — replaces posts titled `[dec-plan] …`. Default year is 2026; override with `CONTENT_CALENDAR_PLAN_YEAR=2025`. Mix: Looial + Stackwise on Instagram, X, and TikTok (~2 posts/day, 3 every third day).

## R2 (no paid storage at low volume)

Cloudflare R2 includes a free tier (storage + modest operations). Bucket: `stackwise-content-calendar`. Worker binding: `CONTENT_CALENDAR_BUCKET` in `wrangler.jsonc`.

One-time:

```bash
npx wrangler r2 bucket create stackwise-content-calendar
```

**Production / `opennextjs-cloudflare preview`:** uploads use the Worker R2 binding.

**`next dev`:** same bucket via the S3-compatible API when these are in `.env.local` (create an R2 API token in Cloudflare dashboard):

- `CLOUDFLARE_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

Optional: `CONTENT_CALENDAR_R2_BUCKET` (defaults to `stackwise-content-calendar`).

If neither binding nor S3 env is set, uploads fall back to Neon `dev_data` (fine for tiny local tests only).

Previews: `GET /api/admin/content-calendar/assets/[id]/file` (admin session).

## UI

Month/week grid inspired by [gr8r-studio calendar](https://github.com/gr8rstudio/gr8r-studio) (`src/views/calendar.js`). **Studio** matches the admin shell; **Scrapbook** adds a subtle accent wash, serif chips, and polaroid thumbnails (same dark admin palette).

Post sheet attachments (`StackwiseFilePicker`): dashed upload zone only opens the file dialog / accepts drops; **list rows** for PDF, links, audio, video, and other non-images (icon chip → name → size/type → download/open → remove); **gallery strip** for images only. Audio rows use in-row play, seekable waveform, and elapsed/total times (reference-style). Quick view is via filename (portal, download still available).

Demo data: `npm run content-calendar:seed` (prefix `[sample]`, safe to re-run).