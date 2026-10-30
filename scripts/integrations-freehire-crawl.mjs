#!/usr/bin/env node
/**
 * Seed a few Greenhouse boards and crawl → index for local freehire.
 * Requires: npm run integrations:freehire:up
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const freehireDir = path.join(root, "vendor/freehire");
const composeEnv = path.join(root, "deploy/integrations/freehire/compose.env");
const boardsFile = path.join(root, "deploy/integrations/freehire/boards.seed.json");

if (!fs.existsSync(path.join(freehireDir, "docker-compose.yml"))) {
  console.error("Run: npm run integrations:freehire:clone");
  process.exit(1);
}

function compose(args, opts = {}) {
  const r = spawnSync(
    "docker",
    ["compose", "--env-file", composeEnv, ...args],
    { stdio: opts.quiet ? "pipe" : "inherit", cwd: freehireDir, encoding: "utf8" },
  );
  if (r.status !== 0) {
    if (opts.quiet) console.error(r.stderr || r.stdout);
    process.exit(r.status ?? 1);
  }
  return r.stdout;
}

const boards = JSON.parse(fs.readFileSync(boardsFile, "utf8"));

console.log("Seeding active Greenhouse boards…");
for (const b of boards) {
  const sql = `
    INSERT INTO boards (provider, board, company, status, surface)
    SELECT '${b.provider}', '${b.board}', '${b.company.replace(/'/g, "''")}', 'active', 'curator'
    WHERE NOT EXISTS (
      SELECT 1 FROM boards
      WHERE provider = '${b.provider}' AND lower(board) = lower('${b.board}') AND status IN ('pending','active')
    );
  `;
  compose(["exec", "-T", "db", "psql", "-U", "hire", "-d", "hire", "-c", sql.trim()]);
}

console.log("\nCrawling greenhouse (network; may take 1–3 min)…");
compose(["exec", "-T", "app", "/app/ingest", "greenhouse"]);

console.log("\nReindexing Meilisearch (includes queued writes)…");
compose(["exec", "-T", "app", "/app/reindex"]);

const count = compose(
  ["exec", "-T", "db", "psql", "-U", "hire", "-d", "hire", "-t", "-c", "SELECT COUNT(*) FROM jobs WHERE closed_at IS NULL;"],
  { quiet: true },
).trim();

console.log(`\nOpen jobs in DB: ${count}`);
console.log("Search: http://localhost:8090/jobs  (or API /api/v1/jobs/search?q=developer)");
console.log("\nPush into Stackwise (dev server + .env.local secret):");
console.log("  npm run dev");
console.log("  FREEHIRE_API_BASE=http://localhost:8088 npm run integrations:freehire:export -- --ingest -n 25");
