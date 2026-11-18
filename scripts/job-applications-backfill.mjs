#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";

const runner = path.join(process.cwd(), "scripts/job-applications-backfill.ts");
const code = spawnSync("npx", ["tsx", runner], {
  stdio: "inherit",
  cwd: process.cwd(),
  env: process.env,
}).status;

process.exit(code ?? 1);