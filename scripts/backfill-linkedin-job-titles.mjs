#!/usr/bin/env node
/**
 * One-shot: reparse mangled linkedin_jobs role/company from growth_signals.body_text
 * (or role_title) and rescore with job ICP keywords.
 *
 *   node --import tsx scripts/backfill-linkedin-job-titles.mjs
 */
import { loadEnvLocal } from "./lib/load-env-local.mjs";
import { neon } from "@neondatabase/serverless";
import { parseLinkedInJobCardText } from "../src/lib/growth/harvest-extract-jobs.ts";
import { icpConfigForJobIngest } from "../src/lib/growth/job-ingest-quality.ts";
import { scoreLead } from "../src/lib/growth/scoring.ts";
import { DEFAULT_ICP_CONFIG } from "../src/lib/growth/icp-default.ts";

loadEnvLocal();
const sql = neon(process.env.DATABASE_URL);
const jobConfig = icpConfigForJobIngest(DEFAULT_ICP_CONFIG);

const rows = await sql`
  SELECT l.id::text AS lead_id, s.id::text AS signal_id,
         s.body_text, s.role_title AS signal_role, s.company_name AS signal_company,
         s.raw_payload, l.role_title, l.company_name
  FROM growth_leads l
  JOIN growth_signals s ON s.id = l.signal_id
  WHERE l.lead_source = 'linkedin_jobs'
`;

let updated = 0;
for (const row of rows) {
  const cardText =
    (row.raw_payload && typeof row.raw_payload === "object"
      ? row.raw_payload.cardText
      : null) ||
    row.signal_role ||
    row.role_title ||
    row.body_text ||
    "";
  const parsed = parseLinkedInJobCardText(String(cardText));
  if (!parsed.title || parsed.title.length < 3) continue;
  const company =
    parsed.company && parsed.company !== "Unknown"
      ? parsed.company
      : row.company_name && row.company_name !== "Unknown company"
        ? row.company_name
        : "Unknown company";
  const locationBit = parsed.location ? ` Location: ${parsed.location}.` : "";
  const snippetBit = parsed.snippet ? ` ${parsed.snippet}` : "";
  const bodyText =
    `${parsed.title} at ${company}.${locationBit}${snippetBit}`.trim();
  const scored = scoreLead({
    roleTitle: parsed.title,
    companyName: company,
    bodyText,
    config: jobConfig,
  });

  await sql`
    UPDATE growth_signals SET
      role_title = ${parsed.title},
      company_name = ${company},
      author_name = ${company},
      body_text = ${bodyText}
    WHERE id = ${row.signal_id}::uuid
  `;
  await sql`
    UPDATE growth_leads SET
      role_title = ${parsed.title},
      company_name = ${company},
      full_name = ${company},
      icp_score = ${scored.icpScore},
      intent_score = ${scored.intentScore},
      composite_score = ${scored.compositeScore},
      score_reasons = ${JSON.stringify(scored.reasons)}::jsonb,
      updated_at = now()
    WHERE id = ${row.lead_id}::uuid
  `;
  updated += 1;
}

const top = await sql`
  SELECT role_title, company_name, composite_score
  FROM growth_leads
  WHERE lead_source = 'linkedin_jobs'
  ORDER BY composite_score DESC
  LIMIT 5
`;
console.log(`Updated ${updated} / ${rows.length} linkedin_jobs leads`);
console.log(JSON.stringify(top, null, 2));
