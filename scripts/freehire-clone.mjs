#!/usr/bin/env node
/**
 * Clone freehire into vendor/freehire (gitignored).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const target = path.join(process.cwd(), "vendor/freehire");
const repo = "https://github.com/strelov1/freehire.git";

if (fs.existsSync(path.join(target, ".git"))) {
  console.log("vendor/freehire already cloned.");
  console.log("  cd vendor/freehire && git pull");
  process.exit(0);
}

fs.mkdirSync(path.dirname(target), { recursive: true });
const r = spawnSync("git", ["clone", "--depth", "1", repo, target], {
  stdio: "inherit",
});
process.exit(r.status ?? 1);
