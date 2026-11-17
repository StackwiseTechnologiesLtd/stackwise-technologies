#!/usr/bin/env node
/**
 * Run the agency attention digest (email owners when overview flags items).
 * Usage:
 *   node scripts/agency-alerts.mjs [.env.prod]
 * Env: AGENCY_ALERT_CRON_SECRET or INTEGRATIONS_INGEST_SECRET, NEXT_PUBLIC_SITE_URL
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const envFile = process.argv[2] ?? ".env.prod";
const envPath = path.join(process.cwd(), envFile);
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function cronSecret() {
  const candidates = [
    process.env.AGENCY_ALERT_CRON_SECRET,
    process.env.INTEGRATIONS_INGEST_SECRET,
    process.env.GROWTH_CONNECTOR_SECRET,
  ];
  for (const s of candidates) {
    const t = s?.trim();
    if (t && t.length >= 32) return t;
  }
  console.error(
    "Set AGENCY_ALERT_CRON_SECRET or INTEGRATIONS_INGEST_SECRET (32+ chars) in",
    envFile,
  );
  process.exit(1);
}

const base =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
  "https://stackwisetechnologies.com";
const url = `${base}/api/cron/agency-alerts`;
const secret = cronSecret();

const res = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  },
});
const text = await res.text();
let body;
try {
  body = JSON.parse(text);
} catch {
  body = { raw: text };
}
if (!res.ok) {
  console.error("Agency alerts failed:", res.status, body);
  process.exit(1);
}
console.log(JSON.stringify(body, null, 2));