#!/usr/bin/env node
/**
 * Full personal job search on X: harvest → CRM → post replies → optional ATS assist.
 *
 *   npm run growth:x-hiring:run
 *   npm run growth:x-hiring:run -- --dry
 *   npm run growth:x-hiring:run -- --skip-harvest
 *   npm run growth:x-hiring:run -- --ats
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const cwd = process.cwd();
const pass = process.argv.slice(2);
const dry = pass.includes("--dry");
const skipHarvest = pass.includes("--skip-harvest");
const skipApply = pass.includes("--skip-apply");
const withAts = pass.includes("--ats");

const env = {
  ...process.env,
  NODE_ENV: "development",
  GROWTH_HARVEST_JOB_MODE: "1",
  PLAYWRIGHT_BROWSERS_PATH:
    process.env.PLAYWRIGHT_BROWSERS_PATH ??
    path.join(cwd, ".playwright-browsers"),
};

function run(label, scriptRel, extraArgs = []) {
  console.log(`\n=== ${label} ===\n`);
  const script = path.join(cwd, scriptRel);
  const r = spawnSync("npx", ["tsx", script, ...extraArgs], {
    cwd,
    env,
    stdio: "inherit",
  });
  if (r.status !== 0) {
    console.error(`\n${label} failed (exit ${r.status ?? 1}).`);
    process.exit(r.status ?? 1);
  }
}

if (!skipHarvest) {
  run("Harvest + CRM", "scripts/x-hiring-to-crm.ts");
}

if (!skipApply) {
  const applyArgs = dry ? ["--dry"] : [];
  run("Apply on X", "scripts/x-hiring-apply.ts", applyArgs);
}

if (withAts && !dry) {
  run("ATS assist", "scripts/x-hiring-ats-apply.ts");
}

console.log("\nX hiring run complete. Review /admin/growth/jobs and Overview → Job applications.");