# Brand guidelines portal — master bootstrap prompt

Use this document to spin up a **new client brand** in the in-repo guidelines portal with the same structure, visual language, and quality bar as **Opsis** (`/branding/opsis`). Reference implementation: Kargul-style layout + Stackwise shell (burgundy accent, footer credit), dark default, gated client access, admin preview without a second login.

---

## Copy-paste agent prompt

```text
You are bootstrapping a new brand guidelines portal entry for Stackwise Technologies.

GOAL
Deliver a near-1:1 experience to our Opsis reference: same sections, same UI patterns (Kargul CSS class names, sketch-line export boxes, wallpaper export grids, social mockup, application stacks), dark-by-default theme, Stackwise shell styling, and a complete BrandGuidelines config object. Route: /branding/<slug>. Assets live under public/branding/<slug>/.

REFERENCE (read before writing)
- Data shape: src/lib/branding/types.ts
- Gold copy + structure: src/lib/branding/brands/opsis.ts
- Page UI: src/components/branding/BrandGuidelinesPage.tsx
- Register brand: src/lib/branding/brands/index.ts
- Styles: src/styles/brand-guidelines/*
- Opsis assets layout: public/branding/opsis/
- Bootstrap checklist: docs/engineering/BRAND_GUIDELINES_MASTER_PROMPT.md (this file)

INPUTS YOU NEED FROM THE USER
1. Brand slug (lowercase, hyphenated, e.g. "acme-co")
2. Brand name, positioning line, meta title/description
3. Core palette (5 swatches with hex, rgb, cmyk) + proportion percentages (sum ~100)
4. Contrast pairs (foreground/background names, ratio, AAA/AA/Fail, optional P3)
5. Typography: display font name + role, UI font (usually Geist), type scale rows
6. Tone: 5 message tiers (signature → introduction), 3 principles × 3 say/avoid pairs each
7. Export files list or source URL (SVG marks, application PNGs, LinkedIn sizes, preview webp ids)
8. Application mockup images (introduction, tram/city, stationery, posters, materials, flag) + alts
9. Optional: Kargul/studio source URL for asset download (like branding.kargul.studio)

NON-NEGOTIABLES
- Do not change unrelated app areas; minimal diffs (ponytail).
- No secrets in git; session secrets via ADMIN_SESSION_SECRET / env sync only.
- robots: noindex on all /branding routes.
- Middleware skips locale redirect for /branding; portal auth for clients; admin session grants preview of all brands.
- Use existing components—do not rebuild the page from scratch.
- Export groups must match Opsis: Isotype, Logotype, Profile pictures, App icons, Social media (wallpaper grid + preview webp + aspect), Applications (wallpaper grid), Typography rows.
- Social media section in Applications + export banners; profile color radio mockup.
- Introduction hero image must use imageSlot/aspect wrapper (not collapsed absolute fill).
- Copy: plain, specific, no agency slop (see Copy criteria below).

IMPLEMENTATION ORDER
1. public/branding/<slug>/ — mirror opsis folder tree (exports/, previews/, AVIFs, brand-fonts.css, preview-fonts/)
2. Extend scripts/download-brand-assets.mjs OR add scripts/download-brand-assets-<slug>.mjs from source base URL
3. src/lib/branding/brands/<slug>.ts — full BrandGuidelines object
4. Register in src/lib/branding/brands/index.ts
5. Make asset URLs slug-aware: brandAssetUrl(slug, path), brandPreviewUrl(slug, id, w); pass slug through components; branding/layout.tsx font CSS per slug
6. stackwise-shell.css or per-brand CSS vars only if palette requires overrides beyond Opsis tokens
7. src/lib/branding/brands.test.ts — getBrand("<slug>") smoke test
8. Manual QA: /branding (admin bento), /branding/<slug> all nav sections, exports download, login gate for non-admin without portal account

COPY CRITERIA (match Opsis tone)
- British/global English, measured and confident, not hype.
- Short sentences; name concrete actions, owners, and decisions.
- Say/avoid pairs: "say" = specific and human; "avoid" = vague SaaS jargon.
- Section bodies: 2–4 sentences; explain rationale and usage, not features.
- Color names are proper nouns (Forest, Paper) when they are brand tokens.

VISUAL CRITERIA
- Dark theme default; light toggle persists in localStorage key brand-guidelines-theme.
- Stackwise: --brand-accent #e24b5c, burgundy #541111 in shell/footer; Kargul --fg/--bg tokens elsewhere.
- Export action bars: format select + copy (SVG) + download; wallpaper previews use Guidelines_exportPreviewWide + exportImageWallpaper + previewId srcset.
- Sketch lines on login fields/buttons: --sketch-line-reach ~72px (short overflow, fade), not full-screen grid.

WHEN UNSURE
- Prefer matching opsis.ts section IDs, nav labels, and export group titles exactly.
- Compare visually to https://branding.kargul.studio/opsis if source is Kargul-hosted.
- Do not ship until typecheck, test, and lint pass.
```

---

## Portal architecture (current)

| Concern | Location |
|--------|----------|
| Public routes | `/branding`, `/branding/login`, `/branding/<slug>` |
| Client auth | Email + password or OTP; account scoped to one `brand_slug` |
| Admin preview | Valid `sw_admin_session` → all brands, bento at `/branding` |
| Config | `BrandGuidelines` in `src/lib/branding/brands/<slug>.ts` |
| UI | `BrandGuidelinesPage` + `brand-ui-parts`, `brand-media`, etc. |
| CSS | Ported Kargul modules + `stackwise-shell.css` |
| Assets | `public/branding/<slug>/` served at `/branding/<slug>/...` (portal cookie or admin) |

---

## `BrandGuidelines` section rubric

Each new brand file must populate **every** key in `types.ts`. Use `opsis.ts` as the canonical outline.

### Meta & navigation
- **slug** — URL segment; must match asset folder name.
- **nav** — Seven top-level items: Foundation, Marks, Color palette, Typography, Tone of voice, Applications, Exports (ids must match section `id` anchors in `BrandGuidelinesPage`).
- **scrollSpy** — Maps nav ids to one or more section element ids for sidebar highlight.

### Introduction (Foundation)
- **body** — Brand story: what they do, symbol meaning, palette + type in one paragraph.
- **heroImage** — `{baseName}-introduction` AVIF set at repo root of brand folder.

### Marks
- **logotypeScale** — Sizes array (7 steps), usage copy, same hero as introduction or dedicated scale asset.
- **colorVersions** — Rules for black-on-light and white-on-dark; paths to black/white logotype SVGs under `exports/logotype/`.

### Colors
- **palette** — Exactly 5 swatches with full color specs; body explains hierarchy.
- **proportions** — Named bars summing to 100; body explains usage mix.
- **accessibility** — Rows for approved pairs (e.g. Black/White, Forest/Paper, White/Paper); include ratio string and WCAG level.

### Typography
- **typeSystem** — Display + UI font roles; font download path (often `preview-fonts/<Font>.ttf`).
- **typeScale** — Rows with level, meta, sample text, inline `sampleStyle` (font family, size, weight, line height).

### Tone of voice
- **messages** — Five labeled tiers from shortest to longest.
- **principles** — Three principles; each has title, description, and **three** say/avoid pairs.

### Applications
- **social** — LinkedIn header image set, profile color list, default color name.
- **brandInUse** — Two images (environment / campaign).
- **material** — Two images (texture / materials).
- **recognition** — One image (flag, signage, or presence).

### Exports
- **groups** — Same seven group titles as Opsis; assets with correct `variant` and preview metadata for banners/applications.
- **previewId** — Match Kargul `previews/<hash>-{400,800,1600}.webp` when mirroring their CDN.

---

## Asset naming convention

Prefix all raster bases with `<slug>-` or a stable brand prefix (Opsis uses `opsis-`):

| Asset | Pattern |
|-------|---------|
| Hero / intro | `<prefix>-introduction.{avif,png}` + `-800`, `-1600` |
| Applications | `<prefix>-tram`, `-stationery`, `-posters`, `-materials`, `-flag`, `-linkedin-header` |
| Exports | `exports/isotype/<prefix>-isotype-{color}.svg` |
| Logotype | `exports/logotype/<prefix>-logotype-{color}.svg` |
| PFP | `exports/profile-pictures/<prefix>-pfp-on-{color}.svg` |
| App icons | `exports/app-icons/...` |
| Application PNGs | `exports/applications/<prefix>-{scene}.png` (+ `.avif`) |
| Previews | `previews/<hash>-{400,800,1600}.webp` |
| Fonts | `brand-fonts.css` + `preview-fonts/` |

---

## New brand checklist (engineering)

- [ ] `public/branding/<slug>/` tree complete
- [ ] Download script updated or duplicated for source URL
- [ ] `src/lib/branding/brands/<slug>.ts` filled
- [ ] `brands/index.ts` registers slug
- [ ] `brandAssetUrl` / `brandPreviewUrl` take `slug` (required for multi-brand)
- [ ] `src/app/branding/layout.tsx` loads `/branding/<slug>/brand-fonts.css` dynamically or per active brand
- [ ] `BrandingPickerPage` lists new brand automatically via `listBrands()`
- [ ] Admin → Brand access: invite client emails
- [ ] `npm run typecheck && npm test && npm run lint`
- [ ] Manual: admin `/branding` bento → slug page → exports; client login; asset URLs blocked without session

---

## Manual QA flow (sign-off)

1. Admin logged in → `/branding` shows bento card for new brand → open guidelines.
2. Sidebar scroll-spy highlights correct section while scrolling.
3. Theme toggle dark/light persists on refresh.
4. Color palette copy buttons; proportion bar matches data.
5. Social mockup: banner, avatar colors, download actions.
6. Application stacks: download PNG/AVIF on each frame.
7. Exports: Social media + Applications wallpaper grid; previews load; downloads work.
8. Sign out / incognito: `/branding/<slug>` redirects to login; assets 302 to login.
9. Client portal account: only their slug; cannot open other brands.

---

## Opsis as visual reference

When the client system was authored by Kargul or similar studio, use their hosted guidelines page as the pixel reference for layout density, export toolbar sketch lines, and section order. Opsis in-repo is the **technical** reference for how Stackwise wires data to UI.

Stackwise-specific layers on top:
- Footer credit line (client + “developed by Stackwise Technologies”).
- Admin bento picker (Stackwise black, accent glow, sketch boxes).
- Brand portal login (Stackwise colors, boxed sketch fields, email resolves brand).

---

## Related docs

- Repo agents: `AGENTS.md`
- Integrations scope (do not expand branding into unrelated phases): `docs/INTEGRATIONS_BUILD_PLAN.md`
