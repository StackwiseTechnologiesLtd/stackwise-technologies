#!/usr/bin/env node
/**
 * Real ICP search harvest (same engine as Growth → Harvest in admin).
 *
 * Usage:
 *   npm run growth:harvest -- linkedin
 *   npm run growth:harvest -- x
 *
 * Requires: DATABASE_URL, connected platform session (Growth → Settings → Connect),
 * and ICP intent phrases in Growth → Settings.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const platform = process.argv[2];
if (platform !== "linkedin" && platform !== "x") {
  console.error("Usage: npm run growth:harvest -- <linkedin|x>");
  process.exit(1);
}

const runner = path.join(process.cwd(), "scripts/run-platform-harvest-runner.ts");
const r = spawnSync(
  "npx",
  ["--yes", "tsx", runner, platform],
  { stdio: "inherit", env: process.env, cwd: process.cwd() },
);
process.exit(r.status ?? 1);
