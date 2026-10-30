import fs from "node:fs";
import path from "node:path";

function loadEnv() {
  for (const filename of [".env.local", ".env"]) {
    const envPath = path.join(process.cwd(), filename);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!process.env[key]) process.env[key] = trimmed.slice(eq + 1).trim();
    }
  }
}

loadEnv();

import { discoverFirecrawlLeads } from "../src/lib/growth/firecrawl-leads";
import { firecrawlHealth } from "../src/lib/integrations/firecrawl-client";

const qIdx = process.argv.indexOf("--query");
const nIdx = process.argv.indexOf("--limit");
const query = qIdx !== -1 ? process.argv[qIdx + 1] : "";
const limit = nIdx !== -1 ? Number.parseInt(process.argv[nIdx + 1], 10) : 10;

async function main() {
  if (!(await firecrawlHealth())) {
    console.error("Local Firecrawl down. Run: npm run integrations:firecrawl:up");
    process.exit(1);
  }
  const result = await discoverFirecrawlLeads({ query, limit });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
