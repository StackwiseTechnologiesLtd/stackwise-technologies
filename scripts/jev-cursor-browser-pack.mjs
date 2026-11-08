#!/usr/bin/env node
/**
 * Prepare JEV queue + profile for apply in Cursor's browser (not JEV's Chrome).
 *
 *   npm run growth:jev:browser:pack -- --count 3
 *
 * Writes .jev-cursor-apply/session.json (gitignored). Ask the Cursor agent to
 * apply using the browser panel — see docs/JEV_CURSOR_APPLY.md § Cursor browser.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareSession } from "./lib/jev-cursor-browser.mjs";

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const countArg = args.find((a) => a.startsWith("--count="));
const countFlag = args.indexOf("--count");
let count = 1;
if (countArg) {
  count = Number.parseInt(countArg.split("=")[1], 10);
} else if (countFlag !== -1 && args[countFlag + 1]) {
  count = Number.parseInt(args[countFlag + 1], 10);
}
if (!Number.isFinite(count) || count < 1) count = 1;

try {
  const { sessionPath, payload } = prepareSession(repoRoot, { count });
  console.log("Wrote", sessionPath);
  console.log(
    `Queued ${payload.jobs.length} job(s) for Cursor browser apply (newest pack wins).`,
  );
  for (const j of payload.jobs) {
    console.log(`  [${j.index}] ${j.company} — ${j.title}`);
    console.log(`      ${j.applyUrl}`);
    console.log(`      jobId: ${j.jobId}`);
  }
  console.log("");
  console.log(
    "In Cursor chat: “Apply job [1] from .jev-cursor-apply/session.json using the browser.”",
  );
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
