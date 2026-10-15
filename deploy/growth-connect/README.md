# Hosted growth connect (optional)

Use this when you **cannot** use Cloudflare Browser Rendering on the main Worker but still want connect **without a local terminal**.

1. Deploy this container (Fly.io, Render, Railway, etc.).
2. Set secrets on the container:
   - `GROWTH_CONNECTOR_SECRET` (same as production Worker)
   - `GROWTH_API_BASE` (e.g. `https://stackwise-technologies.com`)
3. On the **Cloudflare Worker**, set:
   - `GROWTH_CONNECT_VIEWER_BASE` = public URL of this service (e.g. `https://growth-connect.fly.dev`)

The admin UI will proxy connect traffic through `/api/admin/growth/connect/relay` (same-origin iframe). No terminal on your laptop.

Build from repo root:

```bash
docker build -f deploy/growth-connect/Dockerfile -t growth-connect .
```
