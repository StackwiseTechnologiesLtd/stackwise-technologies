#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const firecrawlDir = path.join(root, "vendor/firecrawl");
const composeEnvSrc = path.join(root, "deploy/integrations/firecrawl/compose.env");
const composeEnvDst = path.join(firecrawlDir, ".env");

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

if (!fs.existsSync(path.join(firecrawlDir, "docker-compose.yaml"))) {
  console.error("Missing vendor/firecrawl — run: npm run integrations:firecrawl:clone");
  process.exit(1);
}

if (!dockerOk()) {
  console.error("Docker is not running.");
  process.exit(1);
}

if (!fs.existsSync(composeEnvSrc)) {
  console.error("Missing", composeEnvSrc);
  process.exit(1);
}

if (!fs.existsSync(composeEnvDst)) {
  fs.copyFileSync(composeEnvSrc, composeEnvDst);
  console.log("Wrote vendor/firecrawl/.env from deploy/integrations/firecrawl/compose.env");
}

console.log("Building and starting local Firecrawl (this can take several minutes)…\n");
run("docker", ["compose", "up", "--build", "-d"], { cwd: firecrawlDir });

// API harness often needs a second start after deps are warm (slow first boot).
console.log("\nEnsuring API container is up…");
run("docker", ["compose", "up", "-d", "api"], { cwd: firecrawlDir });
await new Promise((r) => setTimeout(r, 90_000));

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
  console.error("Check: cd vendor/firecrawl && docker compose logs api");
  process.exit(1);
}

await waitFor("http://localhost:3002/v0/health/readiness");

console.log(`
Local Firecrawl is up.

  API: http://localhost:3002
  Discover leads: npm run growth:firecrawl:discover -- -q "your ICP query" -n 10
  Reddit emails only: npm run growth:reddit:discover
  Admin UI: Growth → Discover

Stop:
  npm run integrations:firecrawl:down
`);
