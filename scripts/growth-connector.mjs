#!/usr/bin/env node
/**
 * Local growth connector CLI (session-cookie workflow).
 *
 * Env:
 *   GROWTH_CONNECTOR_SECRET  (required, 32+ chars)
 *   GROWTH_API_BASE          (default http://localhost:3000)
 *
 * Usage:
 *   node scripts/growth-connector.mjs push signals.json
 *   node scripts/growth-connector.mjs upload-cookies linkedin cookies.json
 *   node scripts/growth-connector.mjs pull-cookies linkedin -o cookies.json
 */

import fs from "node:fs";

const base = process.env.GROWTH_API_BASE ?? "http://localhost:3000";
const secret = process.env.GROWTH_CONNECTOR_SECRET;

function usage() {
  console.error(`
Usage:
  growth-connector.mjs push <signals.json>
  growth-connector.mjs upload-cookies <linkedin|x> <cookies.json>
  growth-connector.mjs pull-cookies <linkedin|x> [-o outfile.json]
`);
  process.exit(1);
}

function authHeaders() {
  if (!secret || secret.length < 32) {
    console.error("Set GROWTH_CONNECTOR_SECRET (32+ characters) in the environment.");
    process.exit(1);
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${secret}`,
  };
}

async function push(file) {
  const raw = fs.readFileSync(file, "utf8");
  const parsed = JSON.parse(raw);
  const signals = Array.isArray(parsed) ? parsed : parsed.signals;
  if (!Array.isArray(signals) || signals.length === 0) {
    throw new Error("File must be a signals array or { signals: [...] }");
  }

  const res = await fetch(`${base}/api/admin/growth/connector/ingest`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ signals }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? `HTTP ${res.status}`);
  }
  console.log(`Ingested ${json.ingested ?? 0} signal(s).`);
}

async function uploadCookies(platform, file) {
  const cookies = JSON.parse(fs.readFileSync(file, "utf8"));
  const res = await fetch(`${base}/api/admin/growth/credentials`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ platform, cookies }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? `HTTP ${res.status}`);
  }
  console.log(`Stored encrypted ${platform} session cookies.`);
}

async function pullCookies(platform, outFile) {
  const res = await fetch(
    `${base}/api/admin/growth/connector/credentials?platform=${encodeURIComponent(platform)}`,
    { headers: authHeaders() },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? `HTTP ${res.status}`);
  }
  const payload = JSON.stringify(
    { userAgent: json.userAgent, cookies: json.cookies },
    null,
    2,
  );
  if (outFile) {
    fs.writeFileSync(outFile, payload);
    console.log(`Wrote ${outFile}`);
  } else {
    process.stdout.write(`${payload}\n`);
  }
}

const [cmd, arg1, arg2, ...rest] = process.argv.slice(2);

try {
  if (cmd === "push" && arg1) {
    await push(arg1);
  } else if (cmd === "upload-cookies" && arg1 && arg2) {
    await uploadCookies(arg1, arg2);
  } else if (cmd === "pull-cookies" && arg1) {
    const outIdx = rest.indexOf("-o");
    const outFile =
      outIdx >= 0 ? rest[outIdx + 1] : arg2 && !arg2.startsWith("-") ? arg2 : null;
    await pullCookies(arg1, outFile);
  } else {
    usage();
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
