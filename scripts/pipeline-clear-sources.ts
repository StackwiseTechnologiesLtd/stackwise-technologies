#!/usr/bin/env npx tsx
/**
 * Remove non-social ingest from the active pipeline (huginn, freehire, firecrawl, linkedin_jobs).
 * Keeps X/LinkedIn harvest leads with reference URLs.
 *
 *   npx tsx scripts/pipeline-clear-sources.ts
 *   PIPELINE_CLEANUP_APPLY=1 npx tsx scripts/pipeline-clear-sources.ts
 */
import { loadEnvLocal } from "./lib/load-env-local.mjs";
import { DEPRECATED_PIPELINE_SOURCES } from "../src/lib/growth/social-pipeline-sources";

loadEnvLocal();

const APPLY = process.env.PIPELINE_CLEANUP_APPLY === "1";

async function main() {
  const { ensureSchema } = await import("../src/lib/db/ensure-schema");
  const { getSql, asRows } = await import("../src/lib/db/postgres");
  await ensureSchema();
  const sql = getSql();

  const summary = asRows<{ lead_source: string; active: number; total: number }>(
    await sql`
      SELECT
        lead_source,
        COUNT(*) FILTER (WHERE pipeline_status NOT IN ('not_a_fit', 'lost', 'won'))::int AS active,
        COUNT(*)::int AS total
      FROM growth_leads
      WHERE lead_source = ANY(${DEPRECATED_PIPELINE_SOURCES as unknown as string[]})
      GROUP BY lead_source
      ORDER BY total DESC
    `,
  );

  console.log(
    APPLY ? "APPLY — clearing deprecated sources" : "DRY RUN — PIPELINE_CLEANUP_APPLY=1 to write",
  );
  console.log("Deprecated sources:", DEPRECATED_PIPELINE_SOURCES.join(", "));
  for (const row of summary) {
    console.log(`  ${row.lead_source}: ${row.active} active / ${row.total} total`);
  }

  const activeCount = asRows<{ n: number }>(
    await sql`
      SELECT COUNT(*)::int AS n
      FROM growth_leads
      WHERE lead_source = ANY(${DEPRECATED_PIPELINE_SOURCES as unknown as string[]})
        AND pipeline_status NOT IN ('not_a_fit', 'lost', 'won')
    `,
  );

  const n = activeCount[0]?.n ?? 0;
  if (n === 0) {
    console.log("\nNo active leads on deprecated sources.");
    return;
  }

  if (!APPLY) {
    const sample = await sql`
      SELECT l.full_name, l.lead_source, l.platform, s.source_url
      FROM growth_leads l
      LEFT JOIN growth_signals s ON s.id = l.signal_id
      WHERE l.lead_source = ANY(${DEPRECATED_PIPELINE_SOURCES as unknown as string[]})
        AND l.pipeline_status NOT IN ('not_a_fit', 'lost', 'won')
      ORDER BY l.created_at DESC
      LIMIT 6
    `;
    console.log(`\nWould disqualify ${n} active lead(s). Sample:`);
    for (const row of sample as {
      full_name: string;
      lead_source: string;
      platform: string;
      source_url: string | null;
    }[]) {
      console.log(
        `  [${row.lead_source}/${row.platform}] ${row.full_name?.slice(0, 44)} ${row.source_url?.slice(0, 48) ?? ""}`,
      );
    }
    return;
  }

  const now = new Date().toISOString();
  const leadRows = asRows<{ id: string; opportunity_id: string | null }>(
    await sql`
      SELECT l.id, o.id AS opportunity_id
      FROM growth_leads l
      LEFT JOIN crm_opportunities o ON o.growth_lead_id = l.id
      WHERE l.lead_source = ANY(${DEPRECATED_PIPELINE_SOURCES as unknown as string[]})
        AND l.pipeline_status NOT IN ('not_a_fit', 'lost', 'won')
    `,
  );

  await sql`
    UPDATE growth_leads
    SET pipeline_status = 'not_a_fit', updated_at = ${now}::timestamptz
    WHERE lead_source = ANY(${DEPRECATED_PIPELINE_SOURCES as unknown as string[]})
      AND pipeline_status NOT IN ('not_a_fit', 'lost', 'won')
  `;

  let opps = 0;
  for (const row of leadRows) {
    if (!row.opportunity_id) continue;
    await sql`
      UPDATE crm_opportunities
      SET stage = 'not_a_fit', updated_at = ${now}::timestamptz
      WHERE id = ${row.opportunity_id}::uuid
    `;
    opps += 1;
  }

  await sql`
    UPDATE crm_opportunities
    SET stage = 'not_a_fit', updated_at = ${now}::timestamptz
    WHERE lead_source = ANY(${DEPRECATED_PIPELINE_SOURCES as unknown as string[]})
      AND stage NOT IN ('not_a_fit', 'lost', 'won')
  `;

  console.log(`\nDisqualified ${leadRows.length} lead(s), synced ${opps}+ CRM rows.`);
  console.log("Active pipeline is harvest on X/LinkedIn (source_url on each signal).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});