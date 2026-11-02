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

import { discoverRedditFirecrawlBatch } from "../src/lib/growth/reddit-firecrawl-discover";
import { firecrawlHealth } from "../src/lib/integrations/firecrawl-client";

const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const limitPerQuery = limitArg ? Number.parseInt(limitArg.split("=")[1], 10) : 12;
const singleQuery = process.argv.find((a) => a.startsWith("-q="))?.split("=")[1];

async function main() {
  if (!(await firecrawlHealth())) {
    console.error("Local Firecrawl down. Run: npm run integrations:firecrawl:up");
    process.exit(1);
  }

  console.log(
    "Reddit discover (emails only — set GROWTH_OUTREACH_SEND=0 to block SMTP outreach)\n",
  );

  const result = await discoverRedditFirecrawlBatch({
    limitPerQuery: Number.isFinite(limitPerQuery) ? limitPerQuery : 12,
    queries: singleQuery ? [singleQuery] : undefined,
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
