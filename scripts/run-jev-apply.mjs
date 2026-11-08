#!/usr/bin/env node
/**
 * Personal job applications via JEV — run from Cursor, no Claude Code /apply skill.
 *
 *   npm run growth:jev:doctor -- --online
 *   npm run growth:jev:apply -- --dry --count 3
 *   npm run growth:jev:apply -- --count 5 --submit
 *   npm run growth:jev:apply -- 'https://jobs.ashbyhq.com/...' --submit
 *
 * Submit is never implied; you must pass --submit or set JEV_APPLY_SUBMIT=1.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareJevContext, runJevCli, syncJevProfile } from "./lib/jev-run.mjs";

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const { jevHome } = prepareJevContext(repoRoot);
syncJevProfile(repoRoot, jevHome);

const passthrough = process.argv.slice(2);
const wantsSubmit =
  passthrough.includes("--submit") || process.env.JEV_APPLY_SUBMIT === "1";

if (
  passthrough.length > 0 &&
  !passthrough.includes("--dry") &&
  wantsSubmit
) {
  console.warn(
    "JEV will submit applications you approve in its Chrome window. Use --dry first on a new machine.",
  );
}

process.exit(runJevCli(jevHome, ["apply", ...passthrough]));
