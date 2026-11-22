#!/usr/bin/env npx tsx
/**
 * Harvest X for hiring posts, then promote developer-relevant leads into CRM.
 *
 * Usage: npx tsx scripts/x-hiring-to-crm.ts
 */
import { loadEnvLocal } from "./lib/load-env-local.mjs";

loadEnvLocal();

const HIRING_SEARCH_PHRASES = [
  "we're hiring",
  "hiring remote developer",
  "hiring full stack",
  "hiring software engineer",
  "looking for developer",
  "need a developer",
  "seeking software engineer",
  "freelance developer needed",
] as const;

async function main() {
  const { getIcpConfig, saveIcpConfig } = await import(
    "../src/lib/growth/repository"
  );
  const { runPlatformHarvest } = await import("../src/lib/growth/run-harvest");
  const { isDeveloperHiringSignal } = await import(
    "../src/lib/growth/job-ingest-quality"
  );
  const { promoteGrowthLeadToCrm } = await import("../src/lib/crm/repository");
  const { ensureSchema } = await import("../src/lib/db/ensure-schema");
  const { getSql, asRows } = await import("../src/lib/db/postgres");

  const config = await getIcpConfig();
  const intentPhrases = [
    ...new Set([...HIRING_SEARCH_PHRASES, ...config.intentPhrases]),
  ];
  await saveIcpConfig({ ...config, intentPhrases });

  console.log("ICP search phrases (first 4):", intentPhrases.slice(0, 4).join(", "));

  const harvest = await runPlatformHarvest("x", (phase, message) => {
    console.log(`[${phase}] ${message}`);
  });
  console.log(
    `\nHarvest: ${harvest.captured} posts seen, ${harvest.ingested} new inbox lead(s).`,
  );

  await ensureSchema();
  const sql = getSql();
  type Row = {
    id: string;
    full_name: string;
    composite_score: number;
    body_text: string;
    source_url: string | null;
  };
  const rows = asRows<Row>(
    await sql`
      SELECT l.id, l.full_name, l.composite_score, s.body_text, s.source_url
      FROM growth_leads l
      INNER JOIN growth_signals s ON s.id = l.signal_id
      WHERE (l.platform = 'x' OR s.platform = 'x')
        AND l.created_at > NOW() - INTERVAL '3 days'
        AND NOT EXISTS (
          SELECT 1 FROM crm_opportunities o
          WHERE o.growth_lead_id = l.id
        )
      ORDER BY l.created_at DESC
      LIMIT 200
    `,
  );

  const fits = rows.filter((r) =>
    isDeveloperHiringSignal(r.full_name, r.body_text),
  );
  console.log(
    `\nDeveloper hiring posts (not yet in CRM): ${fits.length} of ${rows.length} recent X leads.`,
  );

  let promoted = 0;
  for (const row of fits) {
    try {
      await promoteGrowthLeadToCrm(row.id, {
        force: true,
        activityNote:
          "X hiring post — queued to apply as developer (auto-promoted from x-hiring-to-crm).",
      });
      promoted += 1;
      console.log(
        `  ✓ CRM: ${row.full_name} (${row.composite_score}%) — ${row.source_url ?? "no url"}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`  ✗ Skip ${row.full_name}: ${msg}`);
    }
  }

  console.log(`\nDone — promoted ${promoted} opportunit${promoted === 1 ? "y" : "ies"} to CRM.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});