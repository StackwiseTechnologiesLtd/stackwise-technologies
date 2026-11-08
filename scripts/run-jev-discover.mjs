#!/usr/bin/env node
/**
 * Run jev-job-search discover using OPENROUTER_API_KEY from .env.local (not copied to JEV repo).
 *
 *   JEV_HOME=~/jev-job-search npm run growth:jev:discover -- --limit 25
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadEnvLocal } from "./lib/load-env-local.mjs";

loadEnvLocal();

const jevHome =
  process.env.JEV_HOME?.trim() ||
  path.join(os.homedir(), "jev-job-search");

const profilePath = path.join(jevHome, "data", "profile.json");
if (!fs.existsSync(profilePath)) {
  const example = path.join(jevHome, "data", "profile.example.json");
  if (fs.existsSync(example)) {
    fs.copyFileSync(example, profilePath);
    console.warn("Copied profile.example.json → profile.json (replace with your real /setup profile).");
  } else {
    console.error("No JEV profile at", profilePath);
    process.exit(1);
  }
}

if (!process.env.OPENROUTER_API_KEY?.trim()) {
  console.error("OPENROUTER_API_KEY missing in .env.local");
  process.exit(1);
}

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
      ...process.env,
      OPENROUTER_SITE_NAME: process.env.OPENROUTER_SITE_NAME ?? "stackwise-jev-discover",
    },
    stdio: "inherit",
  },
);

process.exit(child.status ?? 1);
