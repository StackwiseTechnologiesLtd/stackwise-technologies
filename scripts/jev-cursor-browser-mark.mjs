#!/usr/bin/env node
/**
 * Record outcome after Cursor browser apply (updates JEV queue + CSV records).
 *
 *   npm run growth:jev:browser:mark -- <jobId> applied
 *   npm run growth:jev:browser:mark -- <jobId> skipped
 *   npm run growth:jev:browser:mark -- <jobId> manual
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareJevContext, runJevCli } from "./lib/jev-run.mjs";

const allowed = new Set([
  "applied",
  "skipped",
  "failed",
  "blocked",
  "needs_review",
  "queued",
]);

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const [jobId, status] = process.argv.slice(2);

if (!jobId || !status) {
  console.error("Usage: npm run growth:jev:browser:mark -- <jobId> <status>");
  console.error("Status:", [...allowed].join(" | "));
  process.exit(1);
}

if (!allowed.has(status)) {
  console.error("Invalid status:", status);
  process.exit(1);
}

const { jevHome } = prepareJevContext(repoRoot);
process.exit(runJevCli(jevHome, ["mark", jobId, "--status", status]));
