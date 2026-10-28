#!/usr/bin/env node
/**
 * Push freehire job JSON to Stackwise integrations ingest.
 * Loads .env.local (INTEGRATIONS_INGEST_SECRET, optional INGEST_URL).
 */
import fs from "node:fs";
import path from "node:path";
import { defaultIngestUrl, loadEnvLocal, requireIngestSecret } from "./lib/load-env-local.mjs";

loadEnvLocal();

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const fileArg = args.find((a) => !a.startsWith("-"));

if (!fileArg) {
  console.error("Usage: node scripts/freehire-ingest.mjs [--dry-run] <jobs.json>");
  process.exit(1);
}

const secret = dryRun ? null : requireIngestSecret();
const url = process.env.INGEST_URL?.trim() || defaultIngestUrl();

if (!dryRun && !secret) {
  process.exit(1);
}

const raw = fs.readFileSync(path.resolve(fileArg), "utf8");
const jobs = JSON.parse(raw);
if (!Array.isArray(jobs)) {
  console.error("JSON root must be an array of jobs");
  process.exit(1);
}

function toPayload(job) {
  const title = job.title?.trim();
  const company = job.company?.trim();
  const description = job.description?.trim();
  const sourceUrl = job.url?.trim();
  if (!title || !company || !description || !sourceUrl) {
    return { error: "title, company, description, and url are required" };
  }
  const platform = job.platform === "x" ? "x" : "linkedin";
  return {
    source: "freehire",
    platform,
    authorName: company,
    roleTitle: title,
    companyName: company,
    bodyText: description,
    sourceUrl,
    postedAt: job.postedAt?.trim() || new Date().toISOString(),
  };
}

const summary = { total: jobs.length, ingested: 0, skipped: 0, rejected: 0, failed: 0 };

for (const job of jobs) {
  const payload = toPayload(job);
  if (payload.error) {
    console.warn("Skip invalid job:", payload.error, job);
    summary.failed += 1;
    continue;
  }

  if (dryRun) {
    console.log("DRY", payload.sourceUrl, payload.roleTitle);
    summary.ingested += 1;
    continue;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let body;
  try {
    body = await res.json();
  } catch {
    body = await res.text();
  }

  if (res.status === 200 || res.status === 201) {
    summary.ingested += 1;
    console.log("OK", payload.sourceUrl, body.compositeScore ?? "");
  } else if (res.status === 409) {
    summary.skipped += 1;
    console.log("SKIP duplicate", payload.sourceUrl);
  } else if (res.status === 422) {
    summary.rejected += 1;
    console.log("REJECT", payload.sourceUrl, body.reason ?? body);
  } else {
    summary.failed += 1;
    console.error("FAIL", res.status, payload.sourceUrl, body);
  }
}

console.log(summary);
if (summary.failed > 0) process.exit(1);
