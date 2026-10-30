#!/usr/bin/env node
/**
 * Discover leads via local Firecrawl (vendor/firecrawl Docker).
 *
 * Usage:
 *   npm run growth:firecrawl:discover -- -q "founder MVP need developer" -n 10
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const args = process.argv.slice(2);
function flag(name, short) {
  const i = args.indexOf(name);
  if (i !== -1) return args[i + 1];
  if (short) {
    const j = args.indexOf(short);
    if (j !== -1) return args[j + 1];
  }
  return undefined;
}

const query = flag("--query", "-q");
const limit = flag("--limit", "-n") ?? "10";

if (!query) {
  console.error("Usage: npm run growth:firecrawl:discover -- -q \"search query\" [-n 10]");
  process.exit(1);
}

const runner = path.join(process.cwd(), "scripts/run-growth-firecrawl-discover.ts");
const r = spawnSync(
  "npx",
  ["--yes", "tsx", runner, "--query", query, "--limit", limit],
  { stdio: "inherit", env: process.env, cwd: process.cwd() },
);
process.exit(r.status ?? 1);
