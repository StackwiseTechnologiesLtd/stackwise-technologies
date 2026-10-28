#!/usr/bin/env node
/**
 * Verify local integration wiring before Huginn / freehire.
 * Loads .env.local automatically.
 */
import { loadEnvLocal, defaultIngestUrl, requireIngestSecret } from "./lib/load-env-local.mjs";

loadEnvLocal();

const ingestUrl = process.env.INGEST_URL?.trim() || defaultIngestUrl();
const secret = requireIngestSecret();

console.log("Stackwise integrations — local check\n");
console.log(`Ingest URL: ${ingestUrl}`);
console.log(`Secret:     ${secret.slice(0, 6)}… (${secret.length} chars)\n`);

let ok = true;

try {
  const base = ingestUrl.replace(/\/api\/admin\/integrations\/ingest\/?$/, "");
  const health = await fetch(base, { redirect: "manual" });
  if (health.status >= 200 && health.status < 500) {
    console.log("✓ App reachable at", base);
  } else {
    console.warn(`? App returned ${health.status} (is npm run dev running?)`);
  }
} catch (error) {
  console.error("✗ Cannot reach app — start: npm run dev");
  console.error(`  ${error instanceof Error ? error.message : error}`);
  ok = false;
}

const payload = {
  source: "huginn",
  platform: "linkedin",
  authorName: "Local integration check",
  bodyText:
    "We need a developer team to ship our MVP before production — integration check.",
  sourceUrl: `https://example.com/local-check-${Date.now()}`,
  postedAt: new Date().toISOString(),
};

try {
  const res = await fetch(ingestUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (res.ok) {
    console.log(`✓ Ingest OK — lead ${body.leadId ?? ""} score ${body.compositeScore ?? ""}%`);
    console.log("  Growth → Inbox → Channel: Huginn");
  } else if (res.status === 422) {
    console.log(`✓ Auth OK — body rejected by ICP (${body.reason ?? "422"})`);
  } else {
    console.error(`✗ Ingest failed ${res.status}`, body);
    ok = false;
  }
} catch (error) {
  console.error("✗ Ingest request failed");
  console.error(`  ${error instanceof Error ? error.message : error}`);
  ok = false;
}

console.log("\nNext steps:");
console.log("  Huginn:  npm run integrations:huginn:up");
console.log("           npm run integrations:huginn:scenario  → import generated JSON in UI");
console.log("  Jobs:    npm run integrations:freehire:sample");
console.log("\nDocs: docs/INTEGRATIONS_LOCAL.md");

process.exit(ok ? 0 : 1);
