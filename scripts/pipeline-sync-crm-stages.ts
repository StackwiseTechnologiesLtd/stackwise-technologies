#!/usr/bin/env npx tsx
/**
 * Align CRM opportunity stage with linked growth_leads.pipeline_status when lead is not_a_fit.
 */
import { loadEnvLocal } from "./lib/load-env-local.mjs";

loadEnvLocal();

const APPLY = process.env.PIPELINE_CLEANUP_APPLY === "1";

async function main() {
  const { ensureSchema } = await import("../src/lib/db/ensure-schema");
  const { getSql, asRows } = await import("../src/lib/db/postgres");
  await ensureSchema();
  const sql = getSql();

  const pending = asRows<{ n: number }>(
    await sql`
      SELECT COUNT(*)::int AS n
      FROM crm_opportunities o
      INNER JOIN growth_leads l ON l.id = o.growth_lead_id
      WHERE l.pipeline_status = 'not_a_fit'
        AND o.stage NOT IN ('not_a_fit', 'lost', 'won')
    `,
  );

  const n = pending[0]?.n ?? 0;
  console.log(
    APPLY ? "APPLY" : "DRY RUN",
    `— ${n} opportunit${n === 1 ? "y" : "ies"} out of sync with disqualified leads`,
  );

  if (!APPLY || n === 0) return;

  const now = new Date().toISOString();
  await sql`
    UPDATE crm_opportunities o
    SET stage = 'not_a_fit', updated_at = ${now}::timestamptz
    FROM growth_leads l
    WHERE l.id = o.growth_lead_id
      AND l.pipeline_status = 'not_a_fit'
      AND o.stage NOT IN ('not_a_fit', 'lost', 'won')
  `;
  console.log(`Updated ${n} row(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});