#!/usr/bin/env npx tsx
/**
 * Disqualify job-board noise and stale low-fit "new" leads; sync CRM stages.
 *
 *   npx tsx scripts/pipeline-cleanup.ts           # dry-run
 *   PIPELINE_CLEANUP_APPLY=1 npx tsx scripts/pipeline-cleanup.ts
 */
import { loadEnvLocal } from "./lib/load-env-local.mjs";
import { isXJobAggregator } from "../src/lib/growth/x-job-aggregator";

loadEnvLocal();

const APPLY = process.env.PIPELINE_CLEANUP_APPLY === "1";
const LOW_SCORE = Number(process.env.PIPELINE_CLEANUP_MIN_SCORE ?? "32");
const STALE_DAYS = Number(process.env.PIPELINE_CLEANUP_STALE_DAYS ?? "21");

async function main() {
  const { ensureSchema } = await import("../src/lib/db/ensure-schema");
  const { getSql, asRows } = await import("../src/lib/db/postgres");
  await ensureSchema();
  const sql = getSql();

  type LeadRow = {
    id: string;
    full_name: string;
    composite_score: number;
    pipeline_status: string;
    body_text: string | null;
    source_url: string | null;
    opportunity_id: string | null;
  };

  const rows = asRows<LeadRow>(
    await sql`
      SELECT
        l.id,
        l.full_name,
        l.composite_score,
        l.pipeline_status,
        s.body_text,
        s.source_url,
        o.id AS opportunity_id
      FROM growth_leads l
      LEFT JOIN growth_signals s ON s.id = l.signal_id
      LEFT JOIN crm_opportunities o ON o.growth_lead_id = l.id
      WHERE l.pipeline_status NOT IN ('not_a_fit', 'lost', 'won')
      ORDER BY l.created_at DESC
    `,
  );

  const targets: { id: string; reason: string; opportunityId: string | null }[] =
    [];

  for (const row of rows) {
    if (row.source_url?.includes("example.com")) {
      targets.push({ id: row.id, reason: "demo url", opportunityId: row.opportunity_id });
      continue;
    }
    if (isXJobAggregator(row.full_name, row.body_text)) {
      targets.push({
        id: row.id,
        reason: "x job aggregator",
        opportunityId: row.opportunity_id,
      });
      continue;
    }
  }

  const targetIds = new Set(targets.map((t) => t.id));
  const stale = asRows<{ id: string; opportunity_id: string | null }>(
    await sql`
      SELECT l.id, o.id AS opportunity_id
      FROM growth_leads l
      LEFT JOIN crm_opportunities o ON o.growth_lead_id = l.id
      WHERE l.pipeline_status = 'new'
        AND l.composite_score < ${LOW_SCORE}
        AND l.created_at < NOW() - (${STALE_DAYS}::int || ' days')::interval
    `,
  );

  for (const row of stale) {
    if (targetIds.has(row.id)) continue;
    targets.push({
      id: row.id,
      reason: `stale new · score < ${LOW_SCORE} · ${STALE_DAYS}d`,
      opportunityId: row.opportunity_id,
    });
  }

  console.log(
    APPLY ? "APPLY — updating pipeline" : "DRY RUN — set PIPELINE_CLEANUP_APPLY=1 to write",
  );
  console.log(`Candidates: ${targets.length} of ${rows.length} active leads\n`);

  const byReason = new Map<string, number>();
  for (const t of targets) {
    byReason.set(t.reason.split(" ·")[0], (byReason.get(t.reason.split(" ·")[0]) ?? 0) + 1);
  }
  for (const [reason, count] of byReason) {
    console.log(`  ${reason}: ${count}`);
  }

  if (!APPLY || targets.length === 0) {
    if (!APPLY && targets.length > 0) {
      console.log("\nSample:");
      for (const t of targets.slice(0, 8)) {
        const row = rows.find((r) => r.id === t.id);
        console.log(`  ${t.reason} — ${row?.full_name?.slice(0, 50)}`);
      }
    }
    return;
  }

  const now = new Date().toISOString();
  let leads = 0;
  let opps = 0;
  for (const t of targets) {
    await sql`
      UPDATE growth_leads
      SET pipeline_status = 'not_a_fit', updated_at = ${now}::timestamptz
      WHERE id = ${t.id}::uuid
    `;
    leads += 1;
    if (t.opportunityId) {
      await sql`
        UPDATE crm_opportunities
        SET stage = 'not_a_fit', updated_at = ${now}::timestamptz
        WHERE id = ${t.opportunityId}::uuid
      `;
      opps += 1;
    }
  }

  console.log(`\nUpdated ${leads} lead(s), ${opps} opportunit${opps === 1 ? "y" : "ies"}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});