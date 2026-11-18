#!/usr/bin/env npx tsx
import { loadEnvLocal } from "./lib/load-env-local.mjs";

loadEnvLocal();

async function main() {
  const { backfillJobApplicationsFromDrafts } = await import(
    "../src/lib/jobs/applications"
  );
  const n = await backfillJobApplicationsFromDrafts();
  console.log(`Backfilled ${n} application record(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});