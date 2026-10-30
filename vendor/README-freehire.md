# freehire (local clone)

The full [freehire](https://github.com/strelov1/freehire) app is cloned here as **`vendor/freehire/`** (gitignored — not committed).

```bash
npm run integrations:freehire:clone   # once
npm run integrations:freehire:up      # Docker: API + UI + Postgres + Meilisearch
```

- **UI:** http://localhost:8090  
- **API:** http://localhost:8088 (`/health`, `/api/v1/jobs/search`)

Push jobs into Stackwise Growth:

```bash
npm run integrations:freehire:export -- --ingest
# or export only:
node scripts/freehire-export-stackwise.mjs -o /tmp/jobs.json
node scripts/freehire-ingest.mjs /tmp/jobs.json
```

See [deploy/integrations/freehire/README.md](../deploy/integrations/freehire/README.md).
