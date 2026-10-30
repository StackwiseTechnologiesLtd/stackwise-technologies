import fs from "node:fs";
import path from "node:path";
import { formatOutreachCsv, formatOutreachMarkdown } from "../src/lib/growth/outreach-export";
import { getOutreachRun } from "../src/lib/growth/outreach-run";

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

async function main() {
  const runId = process.argv[2];
  if (!runId) {
    console.error("Usage: npx tsx scripts/export-growth-outreach-run.ts <run-id>");
    process.exit(1);
  }

  const data = await getOutreachRun(runId);
  if (!data) {
    console.error("Run not found:", runId);
    process.exit(1);
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const mdPath = path.join(process.cwd(), `exports/growth-outreach-report-${stamp}.md`);
  const csvPath = path.join(process.cwd(), `exports/growth-outreach-report-${stamp}.csv`);
  fs.mkdirSync(path.dirname(mdPath), { recursive: true });
  fs.writeFileSync(mdPath, formatOutreachMarkdown(data.run, data.items));
  fs.writeFileSync(csvPath, formatOutreachCsv(data.run, data.items));
  console.log("Wrote", mdPath, "and", csvPath, `(${data.items.length} rows)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
