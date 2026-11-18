#!/usr/bin/env npx tsx
/**
 * Open ATS/career URLs from X hiring CRM rows (Playwright, optional form prefill).
 *
 *   npm run growth:x-hiring:ats
 */
import { loadEnvLocal } from "./lib/load-env-local.mjs";

loadEnvLocal();

const APPLICANT = {
  name: "Daniel Tshikomba",
  email: "tshikombadaniel@gmail.com",
  phone: process.env.JEV_PHONE?.trim() || "",
  linkedin: process.env.JEV_LINKEDIN_URL?.trim() || "",
};

function extractHttpUrls(text: string): string[] {
  const urls: string[] = [];
  const re =
    /https?:\/\/[^\s<>"')}\]]+/gi;
  for (const match of text.matchAll(re)) {
    let u = match[0].replace(/[.,;:!?)]+$/, "");
  if (u.includes("t.me/") || u.includes("twitter.com") || u.includes("x.com")) {
      continue;
    }
    urls.push(u);
  }
  return [...new Set(urls)];
}

async function main() {
  const { ensureSchema } = await import("../src/lib/db/ensure-schema");
  const { getSql, asRows } = await import("../src/lib/db/postgres");
  const { addOpportunityActivity, updateOpportunityStage } = await import(
    "../src/lib/crm/repository"
  );
  const { recordJobApplication } = await import("../src/lib/jobs/applications");
  const { buildPersonalizedApplyNote } = await import(
    "../src/lib/growth/personalized-apply-draft"
  );
  const { loadPlaywrightModule } = await import(
    "../src/lib/growth/playwright-loader"
  );

  await ensureSchema();
  const sql = getSql();

  type Row = {
    opportunity_id: string;
    growth_lead_id: string;
    opp_name: string;
    body_text: string;
    source_post_url: string | null;
  };

  const rows = asRows<Row>(
    await sql`
      SELECT
        o.id AS opportunity_id,
        l.id AS growth_lead_id,
        o.name AS opp_name,
        s.body_text,
        s.source_url AS source_post_url
      FROM crm_opportunities o
      JOIN growth_leads l ON l.id = o.growth_lead_id
      JOIN growth_signals s ON s.id = l.signal_id
      WHERE o.platform = 'x'
        AND EXISTS (
          SELECT 1 FROM crm_activities a
          WHERE a.opportunity_id = o.id AND a.body ILIKE '%X hiring post%'
        )
      ORDER BY o.created_at DESC
    `,
  );

  const { chromium } = await loadPlaywrightModule();
  const browser = await chromium.launch({ headless: false, slowMo: 60 });

  try {
    for (const row of rows) {
      const urls = extractHttpUrls(row.body_text);
      if (urls.length === 0) continue;

      const { body: coverNote } = await buildPersonalizedApplyNote({
        roleTitle: null,
        companyName: row.opp_name.split("@")[0]?.trim() ?? null,
        bodyText: row.body_text,
      });

      for (const url of urls) {
        console.log(`\n→ ${row.opp_name}\n  ATS: ${url}`);
        const page = await browser.newPage();
        try {
          await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 120_000,
          });
          await page.waitForTimeout(2500);

          const email = page.locator('input[type="email"], input[name*="email" i]').first();
          if (await email.isVisible({ timeout: 3000 }).catch(() => false)) {
            await email.fill(APPLICANT.email);
          }
          const name = page
            .locator(
              'input[name*="name" i], input[autocomplete="name"], input[placeholder*="name" i]',
            )
            .first();
          if (await name.isVisible({ timeout: 2000 }).catch(() => false)) {
            await name.fill(APPLICANT.name);
          }
          const phone = page.locator('input[type="tel"], input[name*="phone" i]').first();
          if (APPLICANT.phone && (await phone.isVisible({ timeout: 1500 }).catch(() => false))) {
            await phone.fill(APPLICANT.phone);
          }

          const textarea = page.locator("textarea").first();
          if (await textarea.isVisible({ timeout: 2000 }).catch(() => false)) {
            await textarea.fill(coverNote.slice(0, 2000));
          }

          console.log(
            "  Prefilled visible fields (review tab, upload resume, submit manually if needed).",
          );
          await page.waitForTimeout(8000);
          await recordJobApplication({
            opportunityId: row.opportunity_id,
            growthLeadId: row.growth_lead_id,
            channel: "ats",
            status: "partial",
            employerLabel: row.opp_name,
            sourcePostUrl: row.source_post_url,
            applyUrl: url,
            outcomeNotes: "Assisted prefill — confirm submit in browser",
          });
          await addOpportunityActivity(row.opportunity_id, {
            activityType: "note",
            body: `Opened ATS apply page: ${url} (assisted prefill — confirm submit in browser).`,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn(`  ✗ ${msg}`);
        } finally {
          await page.close();
        }
      }

      await updateOpportunityStage(row.opportunity_id, "outreach");
    }
  } finally {
    await browser.close();
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});