#!/usr/bin/env node
/**
 * Upload production env vars from .env.prod to the Cloudflare Worker as secrets.
 * Usage: node scripts/sync-cloudflare-env.mjs [.env.prod]
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const WORKER_NAME = "stackwise-technologies";
const envFile = process.argv[2] ?? ".env.prod";
const envPath = path.join(process.cwd(), envFile);

if (!fs.existsSync(envPath)) {
  console.error(`Missing env file: ${envPath}`);
  process.exit(1);
}

const secrets = {};
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const value = trimmed.slice(eq + 1).trim();
  if (key) secrets[key] = value;
}

if (Object.keys(secrets).length === 0) {
  console.error("No variables found in env file");
  process.exit(1);
}

const tmpPath = path.join(process.cwd(), ".wrangler-secrets.tmp.json");
fs.writeFileSync(tmpPath, JSON.stringify(secrets, null, 2));

console.log(`Uploading ${Object.keys(secrets).length} secrets to Worker "${WORKER_NAME}" from ${envFile}…`);
console.log(`Keys: ${Object.keys(secrets).join(", ")}`);

const result = spawnSync(
  "npx",
  ["wrangler", "secret", "bulk", tmpPath, "--name", WORKER_NAME],
  { stdio: "inherit", cwd: process.cwd() },
);

fs.unlinkSync(tmpPath);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("Cloudflare secrets updated.");
