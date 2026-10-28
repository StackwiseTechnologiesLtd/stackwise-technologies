#!/usr/bin/env node
/**
 * Start freehire via Docker Compose (vendor/freehire).
 * Uses deploy/integrations/freehire/compose.env for host ports.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const freehireDir = path.join(root, "vendor/freehire");
const composeEnv = path.join(
  root,
  "deploy/integrations/freehire/compose.env",
);

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    cwd: opts.cwd ?? root,
    env: { ...process.env, ...opts.env },
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function dockerOk() {
  return spawnSync("docker", ["info"], { stdio: "ignore" }).status === 0;
}

if (!fs.existsSync(path.join(freehireDir, "docker-compose.yml"))) {
  console.error("Missing vendor/freehire — run: npm run integrations:freehire:clone");
  process.exit(1);
}

if (!dockerOk()) {
  console.error("Docker is not running.");
  process.exit(1);
}

if (!fs.existsSync(composeEnv)) {
  console.error("Missing", composeEnv);
  process.exit(1);
}

console.log("Building and starting freehire (first run can take several minutes)…\n");

run("docker", [
  "compose",
  "--env-file",
  composeEnv,
  "up",
  "--build",
  "-d",
], { cwd: freehireDir });

async function waitFor(url, maxMs = 900_000) {
  const start = Date.now();
  process.stdout.write(`Waiting for ${url} …`);
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        console.log(" ready");
        return;
      }
    } catch {
      /* retry */
    }
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, 5000));
  }
  console.error(`\nTimed out waiting for ${url}`);
  console.error("Check: docker compose -f vendor/freehire/docker-compose.yml logs app");
  process.exit(1);
}

await waitFor("http://localhost:8088/health");

console.log(`
freehire is up.

  UI:  http://localhost:8090
  API: http://localhost:8088

Local DB starts empty. To crawl jobs: see vendor/freehire/README.md (cmd/ingest, search-drain).
Or export from the public catalogue into Stackwise:

  FREEHIRE_API_BASE=https://freehire.me npm run integrations:freehire:export -- --ingest

Stop:
  npm run integrations:freehire:down
`);
