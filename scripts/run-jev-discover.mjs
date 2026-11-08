#!/usr/bin/env node
/**
 * Run jev-job-search discover using OPENROUTER_API_KEY from .env.local (not copied to JEV repo).
 *
 *   JEV_HOME=~/jev-job-search npm run growth:jev:discover -- --limit 25
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { jevChildEnv, prepareJevContext, syncJevProfile } from "./lib/jev-run.mjs";

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const { jevHome } = prepareJevContext(repoRoot);
syncJevProfile(repoRoot, jevHome);

const passthrough = process.argv.slice(2);
const limit = passthrough.includes("--limit")
  ? []
  : ["--limit", process.env.JEV_DISCOVER_LIMIT ?? "30"];

const child = spawnSync(
  "npm",
  ["run", "discover", "--", ...limit, ...passthrough],
  {
    cwd: jevHome,
    env: {
      ...jevChildEnv(),
      OPENROUTER_SITE_NAME:
        process.env.OPENROUTER_SITE_NAME ?? "stackwise-jev-discover",
    },
    stdio: "inherit",
  },
);

process.exit(child.status ?? 1);
