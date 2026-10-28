#!/usr/bin/env node
/**
 * Run freehire sample ingest from Docker (hits Stackwise on host via host.docker.internal).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { loadEnvLocal, requireIngestSecret } from "./lib/load-env-local.mjs";

loadEnvLocal();
requireIngestSecret();

const composeFile = path.join(
  process.cwd(),
  "deploy/integrations/docker-compose.yml",
);

if (!fs.existsSync(path.join(process.cwd(), ".env.local"))) {
  console.error("Missing .env.local — npm run integrations:secret");
  process.exit(1);
}

const r = spawnSync(
  "docker",
  [
    "compose",
    "-f",
    composeFile,
    "--profile",
    "jobs",
    "run",
    "--rm",
    "job-ingest-demo",
  ],
  { stdio: "inherit" },
);

process.exit(r.status ?? 1);
