#!/usr/bin/env node
/**
 * Start local integration Docker stack (Huginn + Postgres).
 * Requires Docker Desktop / docker compose v2.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  defaultIngestUrl,
  loadEnvLocal,
  requireIngestSecret,
} from "./lib/load-env-local.mjs";

loadEnvLocal();

const composeFile = path.join(
  process.cwd(),
  "deploy/integrations/docker-compose.yml",
);

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    cwd: process.cwd(),
    ...opts,
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

async function waitForHttp(url, maxMs = 600_000) {
  const start = Date.now();
  process.stdout.write(`Waiting for ${url} …`);
  while Date.now() - start < maxMs) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status >= 200 && res.status < 500) {
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
  console.error("Check: docker logs integrations-huginn-1");
  process.exit(1);
}

function dockerOk() {
  const r = spawnSync("docker", ["info"], { stdio: "ignore" });
  return r.status === 0;
}

if (!fs.existsSync(composeFile)) {
  console.error("Missing", composeFile);
  process.exit(1);
}

if (!dockerOk()) {
  console.error("Docker is not running. Start Docker Desktop and retry.");
  console.error("  npm run integrations:up");
  process.exit(1);
}

const envLocal = path.join(process.cwd(), ".env.local");
if (!fs.existsSync(envLocal)) {
  console.error("Create .env.local first:");
  console.error("  npm run integrations:secret");
  console.error("Paste the output into .env.local, then re-run integrations:up");
  process.exit(1);
}

requireIngestSecret();

console.log("Starting Huginn stack (Postgres + Huginn)…\n");

run("docker", ["compose", "-f", composeFile, "up", "-d"]);

await waitForHttp("http://localhost:3001/");

console.log("\nRendering Huginn scenario for import…");
run("node", ["scripts/render-huginn-scenario.mjs"]);

const ingestUrl = process.env.INGEST_URL?.trim() || defaultIngestUrl();

console.log(`
Stackwise integrations (Docker) is up.

  Huginn UI:     http://localhost:3001
  Invite code:   stackwise-local
  Stackwise app: ${ingestUrl.replace(/\/api\/admin\/integrations\/ingest\/?$/, "")}
                 (run npm run dev in another terminal if not already)

Next:
  1. Import scenario in Huginn:
     deploy/integrations/huginn/scenarios/generated/stackwise-ingest.local.json
  2. npm run integrations:check   — test ingest to the app
  3. npm run integrations:smoke   — Huginn-shaped POST without UI

Optional sample jobs (app must be running):
  npm run integrations:jobs:demo

Stop:
  npm run integrations:down
`);
