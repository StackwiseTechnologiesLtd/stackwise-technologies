#!/usr/bin/env node
/**
 * Local freehire UI (Vite) → Docker API on :8088. Same-origin proxy as upstream dev.
 * Run in a dedicated terminal; API must be up (npm run integrations:freehire:up).
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const freehireDir = path.join(root, "vendor/freehire");
const dsDir = path.join(freehireDir, "design-system");
const webDir = path.join(freehireDir, "web");
const apiUrl = process.env.VITE_API_URL ?? "http://localhost:8088";
const uiPort = process.env.FREEHIRE_UI_PORT ?? "8090";

function needClone() {
  if (!fs.existsSync(path.join(freehireDir, "docker-compose.yml"))) {
    console.error("Run: npm run integrations:freehire:clone");
    process.exit(1);
  }
}

async function apiHealthy() {
  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, "")}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

function runSync(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd, env: process.env });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function ensurePnpm() {
  runSync("corepack", ["enable"], root);
  runSync("corepack", ["prepare", "pnpm@11.7.0", "--activate"], root);
}

needClone();

if (!(await apiHealthy())) {
  console.error(`freehire API not reachable at ${apiUrl}/health`);
  console.error("Start backend: npm run integrations:freehire:up");
  process.exit(1);
}

ensurePnpm();

console.log("Installing design-system…");
runSync("pnpm", ["install", "--frozen-lockfile"], dsDir);
runSync("pnpm", ["run", "build"], dsDir);

console.log("Installing web…");
runSync("pnpm", ["install", "--frozen-lockfile"], webDir);

console.log(`
Starting freehire UI (Vite) on http://localhost:${uiPort}
  API proxy target: ${apiUrl}
`);

const child = spawn(
  "pnpm",
  ["exec", "vite", "dev", "--port", uiPort, "--strictPort"],
  {
    cwd: webDir,
    stdio: "inherit",
    env: {
      ...process.env,
      VITE_API_URL: apiUrl,
      PUBLIC_FREEHIRE_DEV_AUTH: "1",
    },
  },
);

child.on("exit", (code) => process.exit(code ?? 0));
