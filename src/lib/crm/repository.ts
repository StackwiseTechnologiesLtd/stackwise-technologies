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
  type PipelineStatus,
} from "@/lib/growth/types";
import type {
  CrmActivity,
  CrmActivityType,
  CrmCompany,
  CrmOpportunity,
  CrmOpportunityDetail,
  CrmPerson,
} from "@/lib/crm/types";
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
  limit?: number;
}): Promise<CrmOpportunity[]> {
  await ready();
  const sql = getSql();
  const limit = options?.limit ?? 200;
  const stage = options?.stage ?? null;

  const rows = asRows<OpportunityRow>(
    stage
      ? await sql`
          SELECT * FROM crm_opportunities
          WHERE stage = ${stage}
          ORDER BY updated_at DESC
          LIMIT ${limit}
        `
      : await sql`
          SELECT * FROM crm_opportunities
          ORDER BY updated_at DESC
          LIMIT ${limit}
        `,
  );
  return rows.map(mapOpportunity);
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

  return {
    opportunity: mapOpportunity(opportunity),
    person: mapPerson(person),
    company,
    activities: activityRows.map(mapActivity),
  };
}

export async function promoteGrowthLeadToCrm(
  growthLeadId: string,
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

  const oppName =
    lead.companyName?.trim()
      ? `${lead.fullName} @ ${lead.companyName.trim()}`
      : lead.fullName;

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
      ${"Promoted from Growth inbox"},
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
