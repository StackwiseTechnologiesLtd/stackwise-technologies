#!/usr/bin/env node
/**
 * Verify local integration wiring before Huginn / freehire.
 * Loads .env.local automatically.
 *
 * By default does NOT create demo leads (example.com blocked).
 * Set ALLOW_TEST_INGEST=1 to run a full smoke POST.
 */
import { loadEnvLocal, defaultIngestUrl, requireIngestSecret } from "./lib/load-env-local.mjs";

loadEnvLocal();

const ingestUrl = process.env.INGEST_URL?.trim() || defaultIngestUrl();
const secret = requireIngestSecret();
const allowTest = process.env.ALLOW_TEST_INGEST === "1";

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

if (!allowTest) {
  console.log(
    "✓ Ingest auth not exercised with a fake lead (example.com blocked for real data).",
  );
  console.log("  Set ALLOW_TEST_INGEST=1 in .env.local to run smoke POST, or use:");
  console.log("  npm run integrations:smoke");
} else {
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
      console.log(
        `✓ Ingest OK — lead ${body.leadId ?? ""} score ${body.compositeScore ?? ""}%`,
      );
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
}

console.log("\nReal data: docs/GROWTH_REAL_DATA.md");
console.log("Integrations: docs/INTEGRATIONS_LOCAL.md");

process.exit(ok ? 0 : 1);
