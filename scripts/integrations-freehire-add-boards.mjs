#!/usr/bin/env node
/**
 * Add boards from deploy/integrations/freehire/boards.seed.json (or a custom JSON file).
 * Does not crawl — run integrations:freehire:crawl after.
 *
 * Usage: node scripts/integrations-freehire-add-boards.mjs [boards.json]
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const freehireDir = path.join(root, "vendor/freehire");
const composeEnv = path.join(root, "deploy/integrations/freehire/compose.env");
const defaultFile = path.join(
  root,
  "deploy/integrations/freehire/boards.seed.json",
);

const fileArg = process.argv[2] ?? defaultFile;
if (!fs.existsSync(fileArg)) {
  console.error("Missing", fileArg);
  process.exit(1);
}

const boards = JSON.parse(fs.readFileSync(fileArg, "utf8"));
if (!Array.isArray(boards)) {
  console.error("JSON must be an array of { provider, board, company }");
  process.exit(1);
}

function sqlEscape(s) {
  return s.replace(/'/g, "''");
}

let added = 0;
for (const b of boards) {
  if (!b.provider?.trim() || !b.board?.trim() || !b.company?.trim()) {
    console.warn("Skip invalid row", b);
    continue;
  }
  const sql = `
    INSERT INTO boards (provider, board, company, status, surface)
    SELECT '${sqlEscape(b.provider.trim())}', '${sqlEscape(b.board.trim())}', '${sqlEscape(b.company.trim())}', 'active', 'curator'
    WHERE NOT EXISTS (
      SELECT 1 FROM boards
      WHERE provider = '${sqlEscape(b.provider.trim())}'
        AND lower(board) = lower('${sqlEscape(b.board.trim())}')
        AND status IN ('pending','active')
    );
  `;
  const r = spawnSync(
    "docker",
    [
      "compose",
      "--env-file",
      composeEnv,
      "exec",
      "-T",
      "db",
      "psql",
      "-U",
      "hire",
      "-d",
      "hire",
      "-c",
      sql.trim(),
    ],
    { cwd: freehireDir, encoding: "utf8" },
  );
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    process.exit(r.status ?? 1);
  }
  if (r.stdout.includes("INSERT 0 1")) added += 1;
}

console.log(`Boards in file: ${boards.length}, newly inserted: ${added}`);
console.log("Next: npm run integrations:freehire:crawl");
