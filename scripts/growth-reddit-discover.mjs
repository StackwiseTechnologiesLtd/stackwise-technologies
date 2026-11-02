#!/usr/bin/env node
/**
 * Discover leads on Reddit via local Firecrawl (valid MX emails only). Does not send email.
 *
 *   npm run growth:reddit:discover
 *   npm run growth:reddit:discover -- --limit=15
 *   npm run growth:reddit:discover -- -q="need loyalty program software"
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const runner = path.join(process.cwd(), "scripts/run-growth-reddit-discover.ts");
const r = spawnSync("npx", ["--yes", "tsx", runner, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
  cwd: process.cwd(),
});
process.exit(r.status ?? 1);
