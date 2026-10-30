#!/usr/bin/env node
import { loadEnvLocal } from "./lib/load-env-local.mjs";
import { spawnSync } from "node:child_process";
import path from "node:path";

loadEnvLocal();

const runner = path.join(process.cwd(), "scripts/run-growth-outreach.ts");
const r = spawnSync("npx", ["--yes", "tsx", runner, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
  cwd: process.cwd(),
});
process.exit(r.status ?? 1);
