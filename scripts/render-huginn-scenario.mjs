#!/usr/bin/env node
/**
 * Build a Huginn import file with your ingest URL + bearer secret filled in.
 * Output is gitignored under deploy/integrations/huginn/scenarios/generated/
 */
import fs from "node:fs";
import path from "node:path";
import {
  defaultIngestUrl,
  loadEnvLocal,
  requireIngestSecret,
} from "./lib/load-env-local.mjs";

loadEnvLocal();

const secret = requireIngestSecret();
let ingestUrl = process.env.INGEST_URL?.trim() || defaultIngestUrl();

/** Huginn Post Agent runs inside Docker; reach Stackwise on the host via host.docker.internal */
ingestUrl = ingestUrl
  .replace("://localhost:", "://host.docker.internal:")
  .replace("://127.0.0.1:", "://host.docker.internal:");

const templatePath = path.join(
  process.cwd(),
  "deploy/integrations/huginn/scenarios/stackwise-ingest.json",
);
const outDir = path.join(
  process.cwd(),
  "deploy/integrations/huginn/scenarios/generated",
);
const outPath = path.join(outDir, "stackwise-ingest.local.json");

const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));
for (const agent of template.agents) {
  if (agent.type !== "Agents::PostAgent") continue;
  agent.options.post_url = ingestUrl;
  agent.options.headers = {
    Authorization: `Bearer ${secret}`,
  };
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(template, null, 2)}\n`);

console.log(`Wrote ${path.relative(process.cwd(), outPath)}`);
console.log(`post_url: ${ingestUrl}`);
console.log("\nImport in Huginn → Scenarios → Import (do not commit this file).");
