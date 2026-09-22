#!/usr/bin/env node
/**
 * Remove sandbox/test payment links from production Neon and mark remaining drafts as live.
 *
 * Usage:
 *   node scripts/db-reset-prod-payments.mjs           # dry run (default)
 *   node scripts/db-reset-prod-payments.mjs --confirm # apply changes
 *
 * Requires DATABASE_URL in .env.prod (MIGRATE_ENV=prod).
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { neon } from "@neondatabase/serverless";

function loadEnvFile(filename, { override = false } = {}) {
  const envPath = path.join(process.cwd(), filename);
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (override || !process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.prod", { override: true });

const confirm = process.argv.includes("--confirm");
const url = process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL is not set (.env.prod)");
  process.exit(1);
}

const sql = neon(url);

const flaggedTest = await sql`
  SELECT id, invoice_number, status, kpay_is_test
  FROM payment_links
  WHERE kpay_is_test = true
  ORDER BY created_at DESC
`;

const legacySandbox = await sql`
  SELECT id, invoice_number, status, kpay_is_test
  FROM payment_links
  WHERE kpay_is_test IS NULL AND kpay_payment_id IS NOT NULL
  ORDER BY created_at DESC
`;

const draftsToMarkLive = await sql`
  SELECT id, invoice_number, status, kpay_is_test
  FROM payment_links
  WHERE kpay_is_test IS NULL AND kpay_payment_id IS NULL
  ORDER BY created_at DESC
`;

const toDelete = [...flaggedTest, ...legacySandbox];

console.log("Production payment link cleanup");
console.log("================================");
console.log(`Mode: ${confirm ? "APPLY" : "DRY RUN (pass --confirm to apply)"}`);
console.log("");
console.log(`Delete (test / legacy sandbox): ${toDelete.length}`);
for (const row of toDelete) {
  console.log(`  - ${row.invoice_number} (${row.status}, kpay_is_test=${row.kpay_is_test})`);
}
console.log("");
console.log(`Mark as live (drafts with no KPay id): ${draftsToMarkLive.length}`);
for (const row of draftsToMarkLive) {
  console.log(`  - ${row.invoice_number} (${row.status}) → kpay_is_test = false`);
}

if (!confirm) {
  console.log("");
  console.log("No changes made. Re-run with --confirm to apply.");
  process.exit(0);
}

if (toDelete.length > 0) {
  const ids = toDelete.map((row) => row.id);
  await sql`
    DELETE FROM payment_links
    WHERE id = ANY(${ids}::uuid[])
  `;
  console.log(`Deleted ${toDelete.length} payment link(s).`);
}

if (draftsToMarkLive.length > 0) {
  const draftIds = draftsToMarkLive.map((row) => row.id);
  await sql`
    UPDATE payment_links
    SET kpay_is_test = false, updated_at = NOW()
    WHERE id = ANY(${draftIds}::uuid[])
  `;
  console.log(`Marked ${draftsToMarkLive.length} draft link(s) as live.`);
}

const remaining = await sql`
  SELECT
    COUNT(*) FILTER (WHERE kpay_is_test = false) AS live_count,
    COUNT(*) FILTER (WHERE kpay_is_test = true) AS test_count,
    COUNT(*) FILTER (WHERE kpay_is_test IS NULL) AS unset_count
  FROM payment_links
`;

console.log("");
console.log("Remaining rows:", remaining[0]);
console.log("Done.");
