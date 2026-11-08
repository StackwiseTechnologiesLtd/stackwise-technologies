#!/usr/bin/env node
/**
 * JEV doctor from Stackwise (Cursor terminal). Secrets from .env.local only.
 *
 *   npm run growth:jev:doctor
 *   npm run growth:jev:doctor -- --online
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareJevContext, runJevCli, syncJevProfile } from "./lib/jev-run.mjs";

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const { jevHome } = prepareJevContext(repoRoot);
syncJevProfile(repoRoot, jevHome);

const passthrough = process.argv.slice(2);
process.exit(runJevCli(jevHome, ["doctor", ...passthrough]));
