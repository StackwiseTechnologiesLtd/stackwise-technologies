#!/usr/bin/env node
/**
 * Fail if tracked files contain common secret patterns.
 * Used in CI and Phase 0 manual tests (INTEGRATIONS_BUILD_PLAN.md).
 */
import { execSync } from "node:child_process";
import fs from "node:fs";

const PATTERNS = [
  { name: "OpenRouter API key", re: /sk-or-v1-[a-zA-Z0-9]{20,}/ },
  { name: "Stripe secret key", re: /sk_live_[a-zA-Z0-9]{20,}/ },
  { name: "Paystack live secret", re: /sk_live_[a-f0-9]{32,}/ },
  { name: "Generic AWS key", re: /AKIA[0-9A-Z]{16}/ },
];

const SKIP = new Set([
  "scripts/check-no-secrets.mjs",
  "docs/INTEGRATIONS_BUILD_PLAN.md",
]);

function listTrackedFiles() {
  const out = execSync("git ls-files", { encoding: "utf8" });
  return out.split("\n").filter(Boolean);
}

let failed = false;
for (const file of listTrackedFiles()) {
  if (SKIP.has(file)) continue;
  if (!fs.existsSync(file)) continue;
  const stat = fs.statSync(file);
  if (stat.size > 2_000_000) continue;
  const text = fs.readFileSync(file, "utf8");
  for (const { name, re } of PATTERNS) {
    if (re.test(text)) {
      console.error(`Secret pattern (${name}) found in: ${file}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log("No common secret patterns in tracked files.");
