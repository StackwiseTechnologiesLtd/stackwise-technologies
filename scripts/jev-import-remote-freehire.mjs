#!/usr/bin/env node
/**
 * Pull remote full-time / intern-style roles from exports/freehire-jobs-bulk.json
 * into JEV sheet import CSV (discover picks up data/imports/*.csv).
 *
 *   npm run growth:jev:import-remote-freehire
 *   npm run growth:jev:discover -- --limit 80
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareJevContext } from "./lib/jev-run.mjs";

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const REMOTE_RE =
  /\b(remote|work from home|wfh|distributed|anywhere|worldwide|100%\s*remote)\b/i;
const NO_REMOTE_RE = /\bno remote\b/i;
const ROLE_RE =
  /\b(intern|internship|co-?op|engineer|developer|full[- ]stack|backend|frontend|software|devops|sre)\b/i;

function escCsv(value) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function locationFromDescription(text) {
  if (NO_REMOTE_RE.test(text)) return "On-site";
  if (REMOTE_RE.test(text)) return "Remote";
  return "";
}

const bulkPath =
  process.env.FREEHIRE_BULK_JSON ??
  path.join(repoRoot, "exports", "freehire-jobs-bulk.json");
if (!fs.existsSync(bulkPath)) {
  console.error("Missing", bulkPath);
  process.exit(1);
}

const rows = JSON.parse(fs.readFileSync(bulkPath, "utf8"));
const { jevHome } = prepareJevContext(repoRoot);
const importsDir = path.join(jevHome, "data", "imports");
fs.mkdirSync(importsDir, { recursive: true });
const outPath = path.join(importsDir, "stackwise-remote-freehire.csv");

const picked = rows.filter((r) => {
  const blob = `${r.title} ${r.description ?? ""} ${r.company ?? ""}`;
  if (!ROLE_RE.test(blob)) return false;
  if (NO_REMOTE_RE.test(blob)) return false;
  return REMOTE_RE.test(blob);
});

const header = ["Company", "Role", "Location", "Job Link", "Status"];
const lines = [header.map(escCsv).join(",")];
for (const r of picked) {
  lines.push(
    [
      r.company ?? "",
      r.title ?? "",
      locationFromDescription(r.description ?? "") || "Remote",
      r.url ?? "",
      "discover",
    ]
      .map(escCsv)
      .join(","),
  );
}

fs.writeFileSync(outPath, `${lines.join("\n")}\n`);
console.log(`Wrote ${picked.length} remote rows → ${outPath}`);
console.log("Next: npm run growth:jev:discover -- --limit 80");
