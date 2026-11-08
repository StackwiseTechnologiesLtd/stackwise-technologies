#!/usr/bin/env node
/**
 * Push jobs from qbeka/jev-job-search data/queue.json into Stackwise Growth (Jobs inbox).
 *
 * Agency: ingest hiring posts as leads (outreach in Growth, not /apply).
 * Personal: use JEV /apply in the jev repo; optional ingest of your shortlist for CRM tracking.
 *
 * Usage:
 *   node scripts/jev-queue-ingest.mjs [--dry-run] [--min-score 42] [--all-queued] <path/to/queue.json>
 *
 * Requires: npm run dev (or production), INTEGRATIONS_INGEST_SECRET in .env.local
 */
import fs from "node:fs";
import path from "node:path";
import { defaultIngestUrl, loadEnvLocal, requireIngestSecret } from "./lib/load-env-local.mjs";

loadEnvLocal();

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const allQueued = args.includes("--all-queued");
const minScoreArg = args.find((a) => a.startsWith("--min-score="));
const fileArg = args.find((a) => !a.startsWith("-"));

if (!fileArg) {
  console.error(
    "Usage: node scripts/jev-queue-ingest.mjs [--dry-run] [--min-score=0.28] [--all-queued] <queue.json>",
  );
  process.exit(1);
}

const queuePath = path.resolve(fileArg);
if (!fs.existsSync(queuePath)) {
  console.error("File not found:", queuePath);
  process.exit(1);
}

const secret = dryRun ? null : requireIngestSecret();
const url = process.env.INGEST_URL?.trim() || defaultIngestUrl();

const raw = JSON.parse(fs.readFileSync(queuePath, "utf8"));
const entries = Array.isArray(raw) ? raw : raw.entries;
if (!Array.isArray(entries)) {
  console.error("queue.json must be { entries: [...] } or an array");
  process.exit(1);
}

const maxFit = Math.max(0, ...entries.map((e) => e.fit?.score ?? 0));
const jevFractional = maxFit > 0 && maxFit <= 1;
const defaultMin = jevFractional
  ? Number.parseFloat(process.env.JEV_INGEST_MIN_SCORE ?? "0.28")
  : Number.parseFloat(process.env.JEV_INGEST_MIN_SCORE ?? "42");
const minScore = minScoreArg
  ? Number.parseFloat(minScoreArg.split("=")[1])
  : defaultMin;
if (!Number.isFinite(minScore)) {
  console.error("Invalid --min-score");
  process.exit(1);
}

function buildDescription(entry) {
  const { job, fit, preFilterReason } = entry;
  const parts = [];
  if (job.description?.trim()) {
    parts.push(job.description.trim());
  }
  if (fit?.reasons?.length) {
    parts.push("", "JEV fit notes:", ...fit.reasons.map((r) => `- ${r}`));
  }
  if (preFilterReason?.trim()) {
    parts.push("", `Pre-filter: ${preFilterReason.trim()}`);
  }
  if (fit?.score != null) {
    parts.push("", `JEV score: ${fit.score}`);
  }
  const text = parts.join("\n").trim();
  return text.length >= 15 ? text : `${job.title} at ${job.company}. Software role from JEV discover.`;
}

function entryToJob(entry) {
  const { job, fit } = entry;
  const title = job.title?.trim();
  const company = job.company?.trim();
  const sourceUrl = job.url?.trim();
  if (!title || !company || !sourceUrl) {
    return { error: "missing title, company, or url" };
  }
  return {
    title,
    company,
    description: buildDescription(entry),
    url: sourceUrl,
    postedAt: job.postedAt?.trim() || new Date().toISOString(),
    platform: "linkedin",
  };
}

function shouldInclude(entry) {
  const score = entry.fit?.score ?? -1;
  if (allQueued) {
    return entry.status === "queued" || entry.fit?.decision === "apply";
  }
  if (score < minScore) return false;
  if (entry.preFilterReason) return false;
  const blocked = ["blocked", "failed"];
  if (blocked.includes(entry.status)) return false;
  return Boolean(entry.job?.url);
}

const jobs = entries.filter(shouldInclude).map(entryToJob);
const summary = { queue: entries.length, selected: jobs.length, ingested: 0, skipped: 0, rejected: 0, failed: 0 };

function toPayload(job) {
  const title = job.title?.trim();
  const company = job.company?.trim();
  const description = job.description?.trim();
  const sourceUrl = job.url?.trim();
  if (!title || !company || !description || !sourceUrl) {
    return { error: "title, company, description, and url are required" };
  }
  if (/^https?:\/\/(www\.)?example\.(com|org|net)\//i.test(sourceUrl)) {
    return { error: "Refusing example.com URL" };
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
    contextSummary: "jev-job-search discover",
  };
}

console.log(
  `Selected ${summary.selected} / ${summary.queue} (min-score=${minScore}, scale=${jevFractional ? "jev-0-1" : "composite"}, all-queued=${allQueued})`,
);

for (const job of jobs) {
  const payload = toPayload(job);
  if (payload.error) {
    console.warn("Skip invalid job:", payload.error);
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
