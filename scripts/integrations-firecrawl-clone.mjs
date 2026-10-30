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
const tarballUrl = `https://github.com/firecrawl/firecrawl/archive/refs/tags/${FIRECRAWL_GIT_TAG}.tar.gz`;

if (fs.existsSync(path.join(target, "docker-compose.yaml"))) {
  console.log(`vendor/firecrawl ready (tag ${FIRECRAWL_GIT_TAG}).`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(target), { recursive: true });

console.log(`Fetching ${FIRECRAWL_GIT_TAG} source archive (faster than full git clone)…`);
const tmp = path.join(process.cwd(), "vendor/.firecrawl-src.tar.gz");
let r = spawnSync("curl", ["-fsSL", "--retry", "3", "-o", tmp, tarballUrl], {
  stdio: "inherit",
});
if (r.status === 0) {
  spawnSync("rm", ["-rf", target], { stdio: "ignore" });
  r = spawnSync("tar", ["xzf", tmp, "-C", path.dirname(target)], { stdio: "inherit" });
  const extracted = path.join(path.dirname(target), `firecrawl-${FIRECRAWL_GIT_TAG.replace(/^v/, "")}`);
  const alt = path.join(path.dirname(target), `firecrawl-${FIRECRAWL_GIT_TAG}`);
  if (fs.existsSync(extracted)) fs.renameSync(extracted, target);
  else if (fs.existsSync(alt)) fs.renameSync(alt, target);
  try {
    fs.unlinkSync(tmp);
  } catch {
    /* ignore */
  }
  if (fs.existsSync(path.join(target, "docker-compose.yaml"))) {
    console.log("Extracted to vendor/firecrawl");
    process.exit(0);
  }
}

console.log("Archive extract failed; falling back to git clone…");
r = spawnSync("git", ["clone", "--depth", "1", "--branch", FIRECRAWL_GIT_TAG, repo, target], {
  stdio: "inherit",
});
process.exit(r.status ?? 1);
