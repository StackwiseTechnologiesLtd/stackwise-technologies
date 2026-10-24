#!/usr/bin/env node
/**
 * POST a sample Huginn-shaped payload to local/staging ingest.
 * Usage: INTEGRATIONS_INGEST_SECRET=... node scripts/huginn-ingest-smoke.mjs
 * Optional: INGEST_URL=http://localhost:3000/api/admin/integrations/ingest
 */

const secret = process.env.INTEGRATIONS_INGEST_SECRET?.trim();
const url =
  process.env.INGEST_URL?.trim() ||
  "http://localhost:3000/api/admin/integrations/ingest";

if (!secret || secret.length < 32) {
  console.error("Set INTEGRATIONS_INGEST_SECRET (at least 32 characters).");
  process.exit(1);
}

const payload = {
  source: "huginn",
  platform: "linkedin",
  authorName: "Huginn smoke test",
  bodyText:
    "Founder here — we need a developer to harden our MVP before production launch.",
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
if (!res.ok) process.exit(1);
