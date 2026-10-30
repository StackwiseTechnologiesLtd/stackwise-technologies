#!/usr/bin/env node
/**
 * POST a sample Huginn-shaped payload to local/staging ingest.
 * Loads .env.local (INTEGRATIONS_INGEST_SECRET, optional INGEST_URL).
 */
import { defaultIngestUrl, loadEnvLocal, requireIngestSecret } from "./lib/load-env-local.mjs";

loadEnvLocal();

const secret = requireIngestSecret();
const url = process.env.INGEST_URL?.trim() || defaultIngestUrl();

const payload = {
  source: "huginn",
  platform: "linkedin",
  authorName: "Huginn smoke test",
  bodyText: `Huginn smoke ${Date.now()} — we need a developer to harden our MVP before production launch.`,
  sourceUrl: `https://example.com/huginn-smoke-${Date.now()}`,
  postedAt: new Date().toISOString(),
};

const res = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const text = await res.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  json = text;
}

console.log(res.status, json);
if (res.ok) process.exit(0);
if (res.status === 409) {
  console.log("OK (duplicate skipped — ingest auth and API working)");
  process.exit(0);
}
process.exit(1);
