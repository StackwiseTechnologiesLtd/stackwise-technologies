/**
 * CRM ↔ Growth sync: `crm_opportunities.stage` uses the same values as
 * `growth_leads.pipeline_status`. Updating opportunity stage updates the linked lead.
 */
import { ensureSchema } from "@/lib/db/ensure-schema";
import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";
import { getLeadById } from "@/lib/growth/repository";
import {
  parseLeadSource,
  pipelineStatuses,
  type GrowthPlatform,
  type LeadSource,
  type PipelineStatus,
} from "@/lib/growth/types";
import type { CrmSavedViewId } from "@/lib/crm/saved-views";
import type {
  CrmActivity,
  CrmActivityType,
  CrmCompany,
  CrmOpportunity,
  CrmOpportunityDetail,
  CrmPerson,
  CrmTask,
} from "@/lib/crm/types";
import { crmAutoPipelineMinScore } from "@/lib/crm/auto-sync";
import { crmOpportunityDisplayName } from "@/lib/crm/opportunity-name";
import { crmActivityTypes, crmStageLabels } from "@/lib/crm/types";

async function ready() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required");
  }
  await ensureSchema();
}

type CompanyRow = {
  id: string;
  name: string;
  domain: string | null;
  growth_lead_id: string | null;
  created_at: string;
  updated_at: string;
};

type PersonRow = {
  id: string;
  full_name: string;
  email: string | null;
  role_title: string | null;
  linkedin_url: string | null;
  x_profile_url: string | null;
  company_id: string | null;
  growth_lead_id: string | null;
  created_at: string;
  updated_at: string;
};

type OpportunityRow = {
  id: string;
  name: string;
  stage: string;
  amount_cents: number | null;
  fit_score: number;
  source_post_url: string | null;
  platform: string | null;
  lead_source: string | null;
  person_id: string;
  company_id: string | null;
  growth_lead_id: string | null;
  created_at: string;
  updated_at: string;
};

type ActivityRow = {
  id: string;
  opportunity_id: string;
  activity_type: string;
  body: string;
  created_at: string;
};

type TaskRow = {
  id: string;
  opportunity_id: string;
  title: string;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapCompany(row: CompanyRow): CrmCompany {
  return {
    id: row.id,
    name: row.name,
    domain: row.domain,
    growthLeadId: row.growth_lead_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPerson(row: PersonRow): CrmPerson {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    roleTitle: row.role_title,
    linkedinUrl: row.linkedin_url,
    xProfileUrl: row.x_profile_url,
    companyId: row.company_id,
    growthLeadId: row.growth_lead_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseStage(value: string): PipelineStatus {
  if (pipelineStatuses.includes(value as PipelineStatus)) {
    return value as PipelineStatus;
  }
  return "new";
}

function mapOpportunity(row: OpportunityRow): CrmOpportunity {
  return {
    id: row.id,
    name: row.name,
    stage: parseStage(row.stage),
    amountCents: row.amount_cents,
    fitScore: row.fit_score,
    sourcePostUrl: row.source_post_url,
    platform: (row.platform as GrowthPlatform) ?? null,
    leadSource: row.lead_source ? parseLeadSource(row.lead_source) : null,
    personId: row.person_id,
    companyId: row.company_id,
    growthLeadId: row.growth_lead_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTask(row: TaskRow): CrmTask {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    title: row.title,
    dueAt: row.due_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapActivity(row: ActivityRow): CrmActivity {
  const activityType = crmActivityTypes.includes(row.activity_type as CrmActivityType)
    ? (row.activity_type as CrmActivityType)
    : "note";
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    activityType,
    body: row.body,
    createdAt: row.created_at,
  };
}

export async function getOpportunityByGrowthLeadId(
  growthLeadId: string,
): Promise<CrmOpportunity | null> {
  await ready();
  const sql = getSql();
  const rows = asRows<OpportunityRow>(
    await sql`
      SELECT * FROM crm_opportunities
      WHERE growth_lead_id = ${growthLeadId}::uuid
      LIMIT 1
    `,
  );
  return rows[0] ? mapOpportunity(rows[0]) : null;
}

export async function listOpportunities(options?: {
  stage?: PipelineStatus | null;
  view?: CrmSavedViewId | null;
  leadSource?: LeadSource | null;
  platform?: GrowthPlatform | null;
  limit?: number;
  /** When true, include opportunities below the CRM fit bar (default false). */
  includeBelowFitThreshold?: boolean;
}): Promise<CrmOpportunity[]> {
  await ready();
  const sql = getSql();
  const limit = options?.limit ?? 500;
  const stage = options?.stage ?? null;
  const view = options?.view ?? "all";
  const leadSource = options?.leadSource ?? null;
  const platform = options?.platform ?? null;
  const minFit = options?.includeBelowFitThreshold
    ? 0
    : crmAutoPipelineMinScore();

  const activeStages = pipelineStatuses.filter(
    (s) => s !== "lost" && s !== "not_a_fit",
  );

  let rows: OpportunityRow[];

  if (stage) {
    rows = asRows<OpportunityRow>(
      await sql`
        SELECT * FROM crm_opportunities
        WHERE fit_score >= ${minFit}
          AND stage = ${stage}
          ${leadSource ? sql`AND lead_source = ${leadSource}` : sql``}
        ORDER BY fit_score DESC, updated_at DESC
        LIMIT ${limit}
      `,
    );
  } else if (view === "new_this_week") {
    rows = asRows<OpportunityRow>(
      await sql`
        SELECT * FROM crm_opportunities
        WHERE fit_score >= ${minFit}
          AND created_at >= NOW() - INTERVAL '7 days'
          AND stage IN ('new', 'reviewed')
          ${leadSource ? sql`AND lead_source = ${leadSource}` : sql``}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `,
    );
  } else if (view === "high_fit") {
    rows = asRows<OpportunityRow>(
      await sql`
        SELECT * FROM crm_opportunities
        WHERE fit_score >= ${minFit}
          AND stage = ANY(${activeStages})
          ${leadSource ? sql`AND lead_source = ${leadSource}` : sql``}
        ORDER BY fit_score DESC, updated_at DESC
        LIMIT ${limit}
      `,
    );
  } else if (view === "needs_action") {
    rows = asRows<OpportunityRow>(
      await sql`
        SELECT o.*
        FROM crm_opportunities o
        WHERE o.fit_score >= ${minFit}
          ${leadSource ? sql`AND o.lead_source = ${leadSource}` : sql``}
          AND (
            o.stage IN ('outreach', 'replied')
            OR EXISTS (
              SELECT 1 FROM crm_tasks t
              WHERE t.opportunity_id = o.id
                AND t.completed_at IS NULL
                AND (t.due_at IS NULL OR t.due_at <= NOW() + INTERVAL '1 day')
            )
          )
        ORDER BY o.updated_at DESC
        LIMIT ${limit}
      `,
    );
  } else if (view === "linkedin" || platform) {
    const plat = platform ?? "linkedin";
    rows = asRows<OpportunityRow>(
      await sql`
        SELECT * FROM crm_opportunities
        WHERE fit_score >= ${minFit}
          AND platform = ${plat}
        ORDER BY fit_score DESC, updated_at DESC
        LIMIT ${limit}
      `,
    );
  } else if (leadSource) {
    rows = asRows<OpportunityRow>(
      await sql`
        SELECT * FROM crm_opportunities
        WHERE fit_score >= ${minFit}
          AND lead_source = ${leadSource}
        ORDER BY fit_score DESC, updated_at DESC
        LIMIT ${limit}
      `,
    );
  } else {
    rows = asRows<OpportunityRow>(
      await sql`
        SELECT * FROM crm_opportunities
        WHERE fit_score >= ${minFit}
        ORDER BY fit_score DESC, updated_at DESC
        LIMIT ${limit}
      `,
    );
  }

  return rows.map(mapOpportunity);
}

export async function countOpportunitiesBelowFitThreshold(): Promise<number> {
  await ready();
  const sql = getSql();
  const minFit = crmAutoPipelineMinScore();
  const rows = asRows<{ count: string }>(
    await sql`
      SELECT COUNT(*)::text AS count
      FROM crm_opportunities
      WHERE fit_score < ${minFit}
    `,
  );
  return Number(rows[0]?.count ?? 0);
}

/** Remove CRM rows that should not be in the operator pipeline (bad backfill / low fit). */
export async function pruneOpportunitiesBelowFitThreshold(): Promise<{
  removed: number;
  minFitScore: number;
}> {
  await ready();
  const sql = getSql();
  const minFit = crmAutoPipelineMinScore();

  const deleted = asRows<{ id: string }>(
    await sql`
      DELETE FROM crm_opportunities
      WHERE fit_score < ${minFit}
      RETURNING id
    `,
  );

  await sql`
    DELETE FROM crm_people p
    WHERE NOT EXISTS (
      SELECT 1 FROM crm_opportunities o WHERE o.person_id = p.id
    )
  `;
  await sql`
    DELETE FROM crm_companies c
    WHERE NOT EXISTS (
      SELECT 1 FROM crm_opportunities o WHERE o.company_id = c.id
    )
  `;

  return { removed: deleted.length, minFitScore: minFit };
}

export async function getOpportunityDetail(
  id: string,
): Promise<CrmOpportunityDetail | null> {
  await ready();
  const sql = getSql();
  const oppRows = asRows<OpportunityRow>(
    await sql`SELECT * FROM crm_opportunities WHERE id = ${id}::uuid`,
  );
  const opportunity = oppRows[0];
  if (!opportunity) return null;

  const personRows = asRows<PersonRow>(
    await sql`SELECT * FROM crm_people WHERE id = ${opportunity.person_id}::uuid`,
  );
  const person = personRows[0];
  if (!person) return null;

  let company: CrmCompany | null = null;
  if (opportunity.company_id) {
    const companyRows = asRows<CompanyRow>(
      await sql`SELECT * FROM crm_companies WHERE id = ${opportunity.company_id}::uuid`,
    );
    company = companyRows[0] ? mapCompany(companyRows[0]) : null;
  }

  const activityRows = asRows<ActivityRow>(
    await sql`
      SELECT * FROM crm_activities
      WHERE opportunity_id = ${id}::uuid
      ORDER BY created_at DESC
    `,
  );

  const taskRows = asRows<TaskRow>(
    await sql`
      SELECT * FROM crm_tasks
      WHERE opportunity_id = ${id}::uuid
      ORDER BY completed_at NULLS FIRST, due_at NULLS LAST, created_at DESC
    `,
  );

  return {
    opportunity: mapOpportunity(opportunity),
    person: mapPerson(person),
    company,
    activities: activityRows.map(mapActivity),
    tasks: taskRows.map(mapTask),
  };
}

export async function ensureGrowthLeadInCrm(
  growthLeadId: string,
  options?: { activityNote?: string; force?: boolean },
): Promise<CrmOpportunityDetail> {
  return promoteGrowthLeadToCrm(growthLeadId, options);
}

export async function promoteGrowthLeadToCrm(
  growthLeadId: string,
  options?: { activityNote?: string; force?: boolean },
): Promise<CrmOpportunityDetail> {
  const existing = await getOpportunityByGrowthLeadId(growthLeadId);
  if (existing) {
    const detail = await getOpportunityDetail(existing.id);
    if (detail) return detail;
  }

  const bundle = await getLeadById(growthLeadId);
  if (!bundle) {
    throw new Error("Growth lead not found");
  }
  const { lead, signal } = bundle;
  const minFit = crmAutoPipelineMinScore();
  if (!options?.force && lead.compositeScore < minFit) {
    throw new Error(
      `Lead fit ${lead.compositeScore}% is below the CRM minimum (${minFit}%)`,
    );
  }
  const now = new Date().toISOString();
  const platform = lead.platform ?? signal?.platform ?? null;
  const sourcePostUrl = lead.sourceUrl ?? signal?.sourceUrl ?? null;
  const profileUrl = lead.profileUrl ?? signal?.authorProfileUrl ?? null;

  await ready();
  const sql = getSql();

  const companyId = crypto.randomUUID();
  const personId = crypto.randomUUID();
  const opportunityId = crypto.randomUUID();
  let companyUuid: string | null = null;

  if (lead.companyName?.trim()) {
    companyUuid = companyId;
    await sql`
      INSERT INTO crm_companies (id, name, growth_lead_id, created_at, updated_at)
      VALUES (
        ${companyId}::uuid,
        ${lead.companyName.trim()},
        ${growthLeadId}::uuid,
        ${now}::timestamptz,
        ${now}::timestamptz
      )
    `;
  }

  const linkedinUrl = platform === "linkedin" ? profileUrl : null;
  const xProfileUrl = platform === "x" ? profileUrl : null;

  await sql`
    INSERT INTO crm_people (
      id, full_name, email, role_title, linkedin_url, x_profile_url,
      company_id, growth_lead_id, created_at, updated_at
    ) VALUES (
      ${personId}::uuid,
      ${lead.fullName},
      ${lead.email},
      ${lead.roleTitle},
      ${linkedinUrl},
      ${xProfileUrl},
      ${companyUuid}::uuid,
      ${growthLeadId}::uuid,
      ${now}::timestamptz,
      ${now}::timestamptz
    )
  `;

  const oppName = crmOpportunityDisplayName(lead);

  await sql`
    INSERT INTO crm_opportunities (
      id, name, stage, fit_score, source_post_url, platform, lead_source,
      person_id, company_id, growth_lead_id, created_at, updated_at
    ) VALUES (
      ${opportunityId}::uuid,
      ${oppName},
      ${lead.pipelineStatus},
      ${lead.compositeScore},
      ${sourcePostUrl},
      ${platform},
      ${lead.leadSource},
      ${personId}::uuid,
      ${companyUuid}::uuid,
      ${growthLeadId}::uuid,
      ${now}::timestamptz,
      ${now}::timestamptz
    )
  `;

  await sql`
    INSERT INTO crm_activities (id, opportunity_id, activity_type, body, created_at)
    VALUES (
      ${crypto.randomUUID()}::uuid,
      ${opportunityId}::uuid,
      'system',
      ${options?.activityNote ?? "Promoted from Growth"},
      ${now}::timestamptz
    )
  `;

  const detail = await getOpportunityDetail(opportunityId);
  if (!detail) {
    throw new Error("CRM promote failed");
  }
  return detail;
}

export async function updateOpportunityStage(
  opportunityId: string,
  stage: PipelineStatus,
): Promise<CrmOpportunityDetail | null> {
  if (!pipelineStatuses.includes(stage)) {
    throw new Error("Invalid stage");
  }

  await ready();
  const sql = getSql();
  const now = new Date().toISOString();

  const oppRows = asRows<OpportunityRow>(
    await sql`
      UPDATE crm_opportunities
      SET stage = ${stage}, updated_at = ${now}::timestamptz
      WHERE id = ${opportunityId}::uuid
      RETURNING *
    `,
  );
  const opp = oppRows[0];
  if (!opp) return null;

  const label = crmStageLabels[stage];
  await sql`
    INSERT INTO crm_activities (id, opportunity_id, activity_type, body, created_at)
    VALUES (
      ${crypto.randomUUID()}::uuid,
      ${opportunityId}::uuid,
      'stage_change',
      ${`Stage → ${label}`},
      ${now}::timestamptz
    )
  `;

  if (opp.growth_lead_id) {
    await sql`
      UPDATE growth_leads
      SET pipeline_status = ${stage}, updated_at = ${now}::timestamptz
      WHERE id = ${opp.growth_lead_id}::uuid
    `;
  }

  if (stage === "won") {
    try {
      const { ensureProjectFromOpportunity } = await import("@/lib/agency/projects");
      await ensureProjectFromOpportunity(opportunityId);
    } catch {
      // Stage change still succeeds if project bootstrap fails.
    }
  }

  return getOpportunityDetail(opportunityId);
}

export async function addOpportunityActivity(
  opportunityId: string,
  input: { activityType?: CrmActivityType; body: string },
): Promise<CrmActivity | null> {
  const body = input.body?.trim();
  if (!body) {
    throw new Error("body is required");
  }
  const activityType = input.activityType ?? "note";
  if (!crmActivityTypes.includes(activityType)) {
    throw new Error("Invalid activity type");
  }

  await ready();
  const sql = getSql();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const exists = asRows<{ id: string }>(
    await sql`
      SELECT id FROM crm_opportunities WHERE id = ${opportunityId}::uuid
    `,
  );
  if (!exists[0]) return null;

  await sql`
    INSERT INTO crm_activities (id, opportunity_id, activity_type, body, created_at)
    VALUES (
      ${id}::uuid,
      ${opportunityId}::uuid,
      ${activityType},
      ${body},
      ${now}::timestamptz
    )
  `;

  await sql`
    UPDATE crm_opportunities
    SET updated_at = ${now}::timestamptz
    WHERE id = ${opportunityId}::uuid
  `;

  return {
    id,
    opportunityId,
    activityType,
    body,
    createdAt: now,
  };
}

export async function backfillCrmFromGrowthLeads(options?: {
  limit?: number;
}): Promise<{ synced: number; skipped: number; failed: number }> {
  await ready();
  const sql = getSql();
  const limit = options?.limit ?? 500;
  const minScore = crmAutoPipelineMinScore();

  const rows = asRows<{ id: string; composite_score: number }>(
    await sql`
      SELECT l.id, l.composite_score
      FROM growth_leads l
      LEFT JOIN crm_opportunities o ON o.growth_lead_id = l.id
      WHERE o.id IS NULL
      ORDER BY l.created_at DESC
      LIMIT ${limit}
    `,
  );

  let synced = 0;
  let skipped = 0;
  let failed = 0;
  for (const row of rows) {
    if (row.composite_score < minScore) {
      skipped += 1;
      continue;
    }
    try {
      await ensureGrowthLeadInCrm(row.id, {
        activityNote: "Backfilled from Growth pipeline",
      });
      synced += 1;
    } catch {
      failed += 1;
    }
  }

  return { synced, skipped, failed };
}

export async function listOpportunityTasks(
  opportunityId: string,
): Promise<CrmTask[]> {
  await ready();
  const sql = getSql();
  const rows = asRows<TaskRow>(
    await sql`
      SELECT * FROM crm_tasks
      WHERE opportunity_id = ${opportunityId}::uuid
      ORDER BY completed_at NULLS FIRST, due_at NULLS LAST, created_at DESC
    `,
  );
  return rows.map(mapTask);
}

export async function createOpportunityTask(
  opportunityId: string,
  input: { title: string; dueAt?: string | null },
): Promise<CrmTask | null> {
  const title = input.title.trim();
  if (!title) throw new Error("Task title is required");

  await ready();
  const sql = getSql();
  const opp = asRows<{ id: string }>(
    await sql`SELECT id FROM crm_opportunities WHERE id = ${opportunityId}::uuid`,
  );
  if (!opp[0]) return null;

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const dueAt = input.dueAt?.trim() ? input.dueAt.trim() : null;

  await sql`
    INSERT INTO crm_tasks (id, opportunity_id, title, due_at, created_at, updated_at)
    VALUES (
      ${id}::uuid,
      ${opportunityId}::uuid,
      ${title},
      ${dueAt}::timestamptz,
      ${now}::timestamptz,
      ${now}::timestamptz
    )
  `;

  const rows = asRows<TaskRow>(
    await sql`SELECT * FROM crm_tasks WHERE id = ${id}::uuid`,
  );
  return rows[0] ? mapTask(rows[0]) : null;
}

export async function updateCrmTask(
  taskId: string,
  input: {
    title?: string;
    dueAt?: string | null;
    completed?: boolean;
  },
): Promise<CrmTask | null> {
  await ready();
  const sql = getSql();
  const rows = asRows<TaskRow>(
    await sql`SELECT * FROM crm_tasks WHERE id = ${taskId}::uuid`,
  );
  const existing = rows[0];
  if (!existing) return null;

  const now = new Date().toISOString();
  const title =
    input.title !== undefined ? input.title.trim() : existing.title;
  if (!title) throw new Error("Task title is required");

  let dueAt = existing.due_at;
  if (input.dueAt !== undefined) {
    dueAt = input.dueAt?.trim() ? input.dueAt.trim() : null;
  }

  let completedAt = existing.completed_at;
  if (input.completed === true) {
    completedAt = completedAt ?? now;
  } else if (input.completed === false) {
    completedAt = null;
  }

  await sql`
    UPDATE crm_tasks
    SET
      title = ${title},
      due_at = ${dueAt}::timestamptz,
      completed_at = ${completedAt}::timestamptz,
      updated_at = ${now}::timestamptz
    WHERE id = ${taskId}::uuid
  `;

  const updated = asRows<TaskRow>(
    await sql`SELECT * FROM crm_tasks WHERE id = ${taskId}::uuid`,
  );
  return updated[0] ? mapTask(updated[0]) : null;
}
