#!/usr/bin/env node
/**
 * Clone self-hosted Firecrawl into vendor/firecrawl (gitignored).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export const FIRECRAWL_GIT_TAG = "v2.11.162";

const target = path.join(process.cwd(), "vendor/firecrawl");
const repo = "https://github.com/firecrawl/firecrawl.git";

if (fs.existsSync(path.join(target, ".git"))) {
  console.log(`vendor/firecrawl already cloned (expected tag ${FIRECRAWL_GIT_TAG}).`);
  console.log("  cd vendor/firecrawl && git fetch --tags && git checkout", FIRECRAWL_GIT_TAG);
  process.exit(0);
}

fs.mkdirSync(path.dirname(target), { recursive: true });
let r = spawnSync("git", ["clone", "--depth", "1", "--branch", FIRECRAWL_GIT_TAG, repo, target], {
  stdio: "inherit",
});
if (r.status !== 0) {
  r = spawnSync("git", ["clone", repo, target], { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
  r = spawnSync("git", ["checkout", FIRECRAWL_GIT_TAG], { stdio: "inherit", cwd: target });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log("Cloned firecrawl at", FIRECRAWL_GIT_TAG);
