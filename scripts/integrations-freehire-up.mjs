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

const withUi = process.argv.includes("--with-ui");

const services = withUi
  ? []
  : ["db", "redis", "meilisearch", "s3", "s3-init", "app"];

console.log(
  withUi
    ? "Building full freehire stack including web UI (slow; may fail on pnpm policy in Docker)…\n"
    : "Starting freehire API + data services (no web container — use --with-ui to build UI)…\n",
);

const upArgs = [
  "compose",
  "--env-file",
  composeEnv,
  "up",
  "--build",
  "-d",
  ...services,
];

run("docker", upArgs, { cwd: freehireDir });

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
freehire API is up.

  API: http://localhost:8088
${withUi ? "  UI:  http://localhost:8090\n" : `  UI:  run \`npm run integrations:freehire:ui\` → http://localhost:8090 (Vite; proxies to API)\n`}
Local DB starts empty. To crawl jobs: see vendor/freehire/README.md (cmd/ingest, search-drain).
Or export from the public catalogue into Stackwise:

  FREEHIRE_API_BASE=https://freehire.me npm run integrations:freehire:export -- --ingest

Stop:
  npm run integrations:freehire:down
`);
