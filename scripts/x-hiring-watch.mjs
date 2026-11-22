#!/usr/bin/env node
/**
 * Monitor X for developer hiring posts (harvest + CRM promote, no auto-reply).
 *
 *   npm run growth:x-hiring:watch
 *
 * Schedule locally (every 2–4h while logged in):
 *   GROWTH_HARVEST_HEADED=1 npm run growth:x-hiring:watch
 */
import { spawnSync } from "node:child_process";
import { loadEnvLocal } from "./lib/load-env-local.mjs";

loadEnvLocal();

const env = {
  ...process.env,
  GROWTH_HARVEST_JOB_MODE: "1",
};

console.log("X hiring watch — harvest + CRM promote (no apply)\n");

const harvest = spawnSync(
  "npx",
  ["tsx", "scripts/x-hiring-to-crm.ts"],
  { stdio: "inherit", env, cwd: process.cwd() },
);

if (harvest.status !== 0) {
  process.exit(harvest.status ?? 1);
}

console.log("\nDone. Review /admin/growth/jobs and /admin/crm?view=x_hiring");