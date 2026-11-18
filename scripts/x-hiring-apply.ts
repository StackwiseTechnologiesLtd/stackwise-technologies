#!/usr/bin/env npx tsx
/**
 * Post public X replies for CRM "X hiring" opportunities + ensure CRM tasks exist.
 *
 *   npx tsx scripts/x-hiring-apply.ts           # post replies
 *   npx tsx scripts/x-hiring-apply.ts --dry       # draft only, no post
 *   npx tsx scripts/x-hiring-apply.ts --tasks-only
 */
import { loadEnvLocal } from "./lib/load-env-local.mjs";

loadEnvLocal();

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry");
const tasksOnly = args.has("--tasks-only");

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const { ensureSchema } = await import("../src/lib/db/ensure-schema");
  const { getSql, asRows } = await import("../src/lib/db/postgres");
  const {
    generateXJobApplyReplyForLead,
    getPlatformSession,
  } = await import("../src/lib/growth/repository");
  const { sessionCookieName } = await import(
    "../src/lib/growth/connect-platform"
  );
  const {
    createOpportunityTask,
    listOpportunityTasks,
    updateCrmTask,
    addOpportunityActivity,
    updateOpportunityStage,
  } = await import("../src/lib/crm/repository");
  const { publishDraftReply } = await import(
    "../src/lib/growth/publish-draft-reply"
  );
  const {
    backfillJobApplicationsFromDrafts,
    recordJobApplication,
    firstApplyUrlFromPostBody,
  } = await import("../src/lib/jobs/applications");

  await ensureSchema();
  const backfilled = await backfillJobApplicationsFromDrafts();
  if (backfilled > 0) {
    console.log(`Backfilled ${backfilled} application record(s) from published drafts.\n`);
  }
  const sql = getSql();

  type Row = {
    opportunity_id: string;
    growth_lead_id: string;
    source_post_url: string | null;
    opp_name: string;
    body_text: string;
    already_published: boolean;
  };

  const rows = asRows<Row>(
    await sql`
      SELECT
        o.id AS opportunity_id,
        o.growth_lead_id,
        o.source_post_url,
        o.name AS opp_name,
        s.body_text,
        EXISTS (
          SELECT 1 FROM growth_drafts d
          WHERE d.lead_id = o.growth_lead_id
            AND d.draft_kind = 'x_job_apply'
            AND d.status = 'published'
        ) AS already_published
      FROM crm_opportunities o
      JOIN growth_leads l ON l.id = o.growth_lead_id
      JOIN growth_signals s ON s.id = l.signal_id
      WHERE o.platform = 'x'
        AND o.growth_lead_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM crm_activities a
          WHERE a.opportunity_id = o.id
            AND a.body ILIKE '%X hiring post%'
        )
      ORDER BY o.created_at DESC
    `,
  );

  if (rows.length === 0) {
    console.log("No X hiring CRM opportunities found.");
    return;
  }

  console.log(`Found ${rows.length} X hiring opportunit${rows.length === 1 ? "y" : "ies"}.\n`);

  const today = new Date().toISOString().slice(0, 10);

  for (const row of rows) {
    let tasks;
    try {
      tasks = await listOpportunityTasks(row.opportunity_id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`  ✗ DB error for ${row.opp_name}: ${msg}`);
      continue;
    }
    const hasApplyTask = tasks.some((t) => t.title === "Apply on X");
    if (!hasApplyTask) {
      await createOpportunityTask(row.opportunity_id, {
        title: "Apply on X",
        dueAt: `${today}T12:00:00.000Z`,
      });
      console.log(`  + Task "Apply on X" — ${row.opp_name}`);
    }
    const hasAtsTask = tasks.some((t) => t.title.startsWith("Apply on ATS"));
    if (
      !hasAtsTask &&
      /jobs\.(jobvite|smartrecruiters)|\/careers\//i.test(row.body_text)
    ) {
      await createOpportunityTask(row.opportunity_id, {
        title: "Apply on ATS (link in post)",
        dueAt: `${today}T12:00:00.000Z`,
      });
      console.log(`  + Task "Apply on ATS" — ${row.opp_name}`);
    }

    if (tasksOnly) continue;

    if (row.already_published) {
      console.log(`  · Already replied — ${row.opp_name}`);
      const open = await listOpportunityTasks(row.opportunity_id);
      for (const t of open) {
        if (t.title === "Apply on X" && !t.completedAt) {
          await updateCrmTask(t.id, { completed: true });
        }
      }
      continue;
    }

    const pack = await generateXJobApplyReplyForLead(row.growth_lead_id);
    if (!pack) {
      console.warn(`  ✗ No draft — ${row.opp_name}`);
      continue;
    }

    if (pack.aiError === "not_a_job_post" || !pack.draft.bodyText.trim()) {
      console.log(`  · Skipped (not a job post) — ${row.opp_name}`);
      await recordJobApplication({
        opportunityId: row.opportunity_id,
        growthLeadId: row.growth_lead_id,
        channel: "x_reply",
        status: "skipped",
        employerLabel: row.opp_name,
        sourcePostUrl: row.source_post_url,
        applyUrl: firstApplyUrlFromPostBody(row.body_text),
        outcomeNotes: "Not a direct job listing",
      });
      await addOpportunityActivity(row.opportunity_id, {
        activityType: "note",
        body: "Skipped X apply — post is not a direct job listing.",
      });
      const open = await listOpportunityTasks(row.opportunity_id);
      for (const t of open) {
        if (t.title === "Apply on X" && !t.completedAt) {
          await updateCrmTask(t.id, { completed: true });
        }
      }
      continue;
    }

    const { draft, tweetUrl } = pack;
    const url = tweetUrl ?? row.source_post_url;
    console.log(`\n→ ${row.opp_name}`);
    console.log(`  Tweet: ${url ?? "(missing URL)"}`);
    console.log(`  Reply (${draft.bodyText.length} chars): ${draft.bodyText}`);

    if (dryRun) {
      console.log("  (dry — not posted)");
      continue;
    }

    if (!url) {
      console.warn("  ✗ Skipped post: no tweet URL");
      continue;
    }

    const session = await getPlatformSession("x");
    const cookieName = sessionCookieName.x;
    if (
      !session?.cookies ||
      !Array.isArray(session.cookies) ||
      !session.cookies.some(
        (c: { name?: string; value?: string }) =>
          c.name === cookieName && c.value,
      )
    ) {
      throw new Error("Connect X in Growth Settings before posting.");
    }

    try {
      await publishDraftReply(draft.id, draft.bodyText);
      await recordJobApplication({
        opportunityId: row.opportunity_id,
        growthLeadId: row.growth_lead_id,
        channel: "x_reply",
        status: "submitted",
        employerLabel: row.opp_name,
        sourcePostUrl: url,
        applyUrl: firstApplyUrlFromPostBody(row.body_text),
        replyPreview: draft.bodyText,
      });
      await addOpportunityActivity(row.opportunity_id, {
        activityType: "note",
        body: `Posted X job-application reply on ${url}`,
      });
      await updateOpportunityStage(row.opportunity_id, "replied");

      const open = await listOpportunityTasks(row.opportunity_id);
      for (const t of open) {
        if (t.title === "Apply on X" && !t.completedAt) {
          await updateCrmTask(t.id, { completed: true });
        }
      }
      console.log("  ✓ Posted reply");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`  ✗ Post failed: ${msg}`);
      await recordJobApplication({
        opportunityId: row.opportunity_id,
        growthLeadId: row.growth_lead_id,
        channel: "x_reply",
        status: "failed",
        employerLabel: row.opp_name,
        sourcePostUrl: url,
        applyUrl: firstApplyUrlFromPostBody(row.body_text),
        replyPreview: draft.bodyText,
        outcomeNotes: msg,
      });
      await addOpportunityActivity(row.opportunity_id, {
        activityType: "note",
        body: `X apply reply failed: ${msg}`,
      });
    }

    await sleep(12_000 + Math.floor(Math.random() * 8000));
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});