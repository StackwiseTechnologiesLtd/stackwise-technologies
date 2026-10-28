#!/usr/bin/env node
/**
 * Export jobs from freehire search API → Stackwise ingest JSON shape.
 *
 * FREEHIRE_API_BASE  default http://localhost:8088 (local Docker) or https://freehire.me
 * --query / -q       search query (default: full stack developer)
 * --limit / -n       max jobs (default 25)
 * -o / --out         write JSON file (default stdout)
 * --ingest           pipe through scripts/freehire-ingest.mjs (needs .env.local secret)
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { loadEnvLocal } from "./lib/load-env-local.mjs";

loadEnvLocal();

const args = process.argv.slice(2);
function flag(name, short) {
  const i = args.indexOf(name);
  if (i !== -1) return args[i + 1];
  if (short) {
    const j = args.indexOf(short);
    if (j !== -1) return args[j + 1];
  }
  return undefined;
}

const ingest = args.includes("--ingest");
const query = flag("--query", "-q") ?? "full stack developer";
const limit = Math.min(
  100,
  Math.max(1, Number.parseInt(flag("--limit", "-n") ?? "25", 10) || 25),
);
const outPath = flag("-o", "--out");

const base = (
  process.env.FREEHIRE_API_BASE ?? "http://localhost:8088"
).replace(/\/$/, "");

const url = new URL(`${base}/api/v1/jobs/search`);
url.searchParams.set("q", query);
url.searchParams.set("limit", String(limit));

const res = await fetch(url);
if (!res.ok) {
  console.error("Search failed:", res.status, await res.text());
  process.exit(1);
}

const json = await res.json();
const rows = Array.isArray(json.data) ? json.data : [];

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);
}

const jobs = [];
for (const row of rows) {
  const title = row.title?.trim();
  const company = row.company?.trim();
  const sourceUrl = row.url?.trim();
  const description =
    stripHtml(row.enrichment?.summary) ||
    stripHtml(row.description) ||
    title;
  if (!title || !company || !sourceUrl) continue;
  jobs.push({
    title,
    company,
    description,
    url: sourceUrl,
    postedAt: row.posted_at ?? row.created_at ?? new Date().toISOString(),
    platform: "linkedin",
  });
}

const payload = JSON.stringify(jobs, null, 2);

if (outPath) {
  fs.writeFileSync(path.resolve(outPath), payload);
  console.error(`Wrote ${jobs.length} jobs to ${outPath}`);
} else if (!ingest) {
  console.log(payload);
}

if (ingest) {
  const tmp =
    outPath ??
    path.join(process.cwd(), "deploy/integrations/freehire/.export-last.json");
  if (!outPath) fs.writeFileSync(tmp, payload);
  const r = spawnSync("node", ["scripts/freehire-ingest.mjs", tmp], {
    stdio: "inherit",
    cwd: process.cwd(),
  });
  process.exit(r.status ?? 1);
}

if (jobs.length === 0) {
  console.error(
    "No jobs returned. Local freehire DB may be empty — set FREEHIRE_API_BASE=https://freehire.me or run ingest workers in vendor/freehire.",
  );
  process.exit(1);
}
