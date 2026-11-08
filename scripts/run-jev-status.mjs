#!/usr/bin/env node
/**
 * Queue + application status from ~/jev-job-search (Cursor-friendly).
 *
 *   npm run growth:jev:status
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareJevContext, runJevCli } from "./lib/jev-run.mjs";

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const { jevHome } = prepareJevContext(repoRoot);

process.exit(runJevCli(jevHome, ["status", ...process.argv.slice(2)]));
