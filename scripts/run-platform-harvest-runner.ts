import { loadEnvLocal } from "./lib/load-env-local.mjs";

loadEnvLocal();

const platform = process.argv[2];
if (platform !== "linkedin" && platform !== "x") {
  console.error("Usage: tsx scripts/run-platform-harvest-runner.ts <linkedin|x>");
  process.exit(1);
}

const { runPlatformHarvest } = await import("../src/lib/growth/run-harvest");

const result = await runPlatformHarvest(platform, (phase, message) => {
  console.log(`[${phase}] ${message}`);
});

console.log(
  `\nDone — captured ${result.captured}, ingested ${result.ingested} new lead(s).`,
);
