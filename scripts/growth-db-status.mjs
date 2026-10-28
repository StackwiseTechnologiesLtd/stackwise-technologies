#!/usr/bin/env node
/**
 * Read growth session status + lead counts from Neon (no HTTP admin cookie needed).
 */
import { neon } from "@neondatabase/serverless";
import { loadEnvLocal } from "./lib/load-env-local.mjs";

loadEnvLocal();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const sql = neon(url);

const creds = await sql`
  SELECT platform, session_status, connected_account_label, last_sync_at
  FROM growth_platform_credentials
  ORDER BY platform
`;

const leadStats = await sql`
  SELECT
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE lead_source = 'harvest')::int AS harvest,
    COUNT(*) FILTER (WHERE lead_source = 'huginn')::int AS huginn,
    COUNT(*) FILTER (WHERE lead_source = 'freehire')::int AS freehire,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::int AS last_24h
  FROM growth_leads
  WHERE pipeline_status <> 'not_a_fit'
`;

const recentReal = await sql`
  SELECT l.id, l.full_name, l.platform, l.lead_source, l.composite_score,
         s.source_url, l.created_at
  FROM growth_leads l
  LEFT JOIN growth_signals s ON s.id = l.signal_id
  WHERE l.pipeline_status <> 'not_a_fit'
    AND (s.source_url IS NULL OR s.source_url NOT LIKE '%example.com%')
  ORDER BY l.created_at DESC
  LIMIT 8
`;

console.log("Platform sessions:");
for (const row of creds) {
  console.log(
    `  ${row.platform}: ${row.session_status} ${row.connected_account_label ?? ""} sync=${row.last_sync_at ?? "never"}`,
  );
}

const s = leadStats[0];
console.log("\nLeads:", s);

console.log("\nRecent non-demo leads:");
for (const r of recentReal) {
  console.log(
    `  ${r.composite_score}% ${r.lead_source} ${r.platform} ${r.full_name?.slice(0, 40)} ${r.source_url?.slice(0, 60) ?? ""}`,
  );
}
