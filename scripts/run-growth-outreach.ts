import path from "node:path";
import fs from "node:fs";

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

import { runOutreachCampaign } from "../src/lib/growth/outreach-run";

const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const offsetArg = process.argv.find((a) => a.startsWith("--offset="));
const limit = limitArg ? Number.parseInt(limitArg.split("=")[1], 10) : 200;
const offset = offsetArg ? Number.parseInt(offsetArg.split("=")[1], 10) : 0;
const dryRun = process.argv.includes("--dry-run");

async function main() {
  console.log(
    `Starting outreach (limit=${limit}, send=${!dryRun}, exports=exports/growth-outreach-report-*)…`,
  );
  const { run, items } = await runOutreachCampaign({
    limit: Number.isFinite(limit) ? limit : 200,
    offset: Number.isFinite(offset) ? offset : 0,
    send: !dryRun,
    createdBy: "cli",
    writeExportFiles: true,
  });
  console.log("Run complete:", run.id);
  console.log("Totals:", run.totals);
  console.log(`Items: ${items.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
