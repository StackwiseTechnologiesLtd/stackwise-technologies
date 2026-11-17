import { ensureSchema } from "@/lib/db/ensure-schema";
import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";
import {
  agencyProjectStatuses,
  agencyProjectStatusLabels,
  type AgencyDueMilestone,
  type AgencyProject,
  type AgencyProjectDetail,
  type AgencyProjectMilestone,
  type AgencyProjectStatus,
} from "@/lib/agency/types";
import { getOpportunityDetail } from "@/lib/crm/repository";

async function ready() {
  if (!isDatabaseConfigured()) throw new Error("DATABASE_URL is required");
  await ensureSchema();
}

type ProjectRow = {
  id: string;
  title: string;
  client_name: string;
  status: string;
  crm_opportunity_id: string | null;
  contract_engagement_id: string | null;
  payment_link_id: string | null;
  created_at: string;
  updated_at: string;
};

type MilestoneRow = {
  id: string;
  project_id: string;
  title: string;
  due_at: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function parseStatus(value: string): AgencyProjectStatus {
  if (agencyProjectStatuses.includes(value as AgencyProjectStatus)) {
    return value as AgencyProjectStatus;
  }
  return "active";
}

function mapProject(row: ProjectRow): AgencyProject {
  return {
    id: row.id,
    title: row.title,
    clientName: row.client_name,
    status: parseStatus(row.status),
    crmOpportunityId: row.crm_opportunity_id,
    contractEngagementId: row.contract_engagement_id,
    paymentLinkId: row.payment_link_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMilestone(row: MilestoneRow): AgencyProjectMilestone {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    dueAt: row.due_at,
    completedAt: row.completed_at,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAgencyProjects(options?: {
  status?: AgencyProjectStatus | null;
  limit?: number;
}): Promise<AgencyProject[]> {
  await ready();
  const sql = getSql();
  const limit = options?.limit ?? 100;
  const status = options?.status ?? null;

  const rows = asRows<ProjectRow>(
    status
      ? await sql`
          SELECT * FROM agency_projects
          WHERE status = ${status}
          ORDER BY updated_at DESC
          LIMIT ${limit}
        `
      : await sql`
          SELECT * FROM agency_projects
          WHERE status != 'archived'
          ORDER BY updated_at DESC
          LIMIT ${limit}
        `,
  );
  return rows.map(mapProject);
}

export async function getProjectByOpportunityId(
  opportunityId: string,
): Promise<AgencyProject | null> {
  await ready();
  const sql = getSql();
  const rows = asRows<ProjectRow>(
    await sql`
      SELECT * FROM agency_projects
      WHERE crm_opportunity_id = ${opportunityId}::uuid
      LIMIT 1
    `,
  );
  return rows[0] ? mapProject(rows[0]) : null;
}

export async function getAgencyProjectDetail(
  id: string,
): Promise<AgencyProjectDetail | null> {
  await ready();
  const sql = getSql();
  const projectRows = asRows<ProjectRow>(
    await sql`SELECT * FROM agency_projects WHERE id = ${id}::uuid`,
  );
  if (!projectRows[0]) return null;

  const milestoneRows = asRows<MilestoneRow>(
    await sql`
      SELECT * FROM agency_project_milestones
      WHERE project_id = ${id}::uuid
      ORDER BY sort_order ASC, due_at NULLS LAST, created_at ASC
    `,
  );

  return {
    project: mapProject(projectRows[0]),
    milestones: milestoneRows.map(mapMilestone),
  };
}

export async function ensureProjectFromOpportunity(
  opportunityId: string,
): Promise<AgencyProjectDetail> {
  const existing = await getProjectByOpportunityId(opportunityId);
  if (existing) {
    const detail = await getAgencyProjectDetail(existing.id);
    if (detail) return detail;
  }

  const opp = await getOpportunityDetail(opportunityId);
  if (!opp) throw new Error("Opportunity not found");

  await ready();
  const sql = getSql();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const clientName =
    opp.company?.name?.trim() ||
    opp.person.fullName?.trim() ||
    "Client";
  const status: AgencyProjectStatus =
    opp.opportunity.stage === "won" ? "active" : "planned";

  await sql`
    INSERT INTO agency_projects (
      id, title, client_name, status, crm_opportunity_id, created_at, updated_at
    ) VALUES (
      ${id}::uuid,
      ${opp.opportunity.name},
      ${clientName},
      ${status},
      ${opportunityId}::uuid,
      ${now}::timestamptz,
      ${now}::timestamptz
    )
  `;

  const detail = await getAgencyProjectDetail(id);
  if (!detail) throw new Error("Project create failed");
  return detail;
}

export async function updateAgencyProject(
  id: string,
  input: {
    status?: AgencyProjectStatus;
    title?: string;
    contractEngagementId?: string | null;
    paymentLinkId?: string | null;
  },
): Promise<AgencyProject | null> {
  await ready();
  const sql = getSql();
  const rows = asRows<ProjectRow>(
    await sql`SELECT * FROM agency_projects WHERE id = ${id}::uuid`,
  );
  const row = rows[0];
  if (!row) return null;

  const now = new Date().toISOString();
  const status = input.status ?? parseStatus(row.status);
  const title = input.title?.trim() || row.title;
  if (!agencyProjectStatuses.includes(status)) {
    throw new Error("Invalid status");
  }

  const contractId =
    input.contractEngagementId !== undefined
      ? input.contractEngagementId
      : row.contract_engagement_id;
  const paymentId =
    input.paymentLinkId !== undefined ? input.paymentLinkId : row.payment_link_id;

  await sql`
    UPDATE agency_projects
    SET
      title = ${title},
      status = ${status},
      contract_engagement_id = ${contractId},
      payment_link_id = ${paymentId},
      updated_at = ${now}::timestamptz
    WHERE id = ${id}::uuid
  `;

  const updated = asRows<ProjectRow>(
    await sql`SELECT * FROM agency_projects WHERE id = ${id}::uuid`,
  );
  return updated[0] ? mapProject(updated[0]) : null;
}

export async function createProjectMilestone(
  projectId: string,
  input: { title: string; dueAt?: string | null; sortOrder?: number },
): Promise<AgencyProjectMilestone | null> {
  const title = input.title.trim();
  if (!title) throw new Error("Title is required");

  await ready();
  const sql = getSql();
  const exists = asRows<{ id: string }>(
    await sql`SELECT id FROM agency_projects WHERE id = ${projectId}::uuid`,
  );
  if (!exists[0]) return null;

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const dueAt = input.dueAt?.trim() ? input.dueAt.trim() : null;
  const sortOrder = input.sortOrder ?? 0;

  await sql`
    INSERT INTO agency_project_milestones (
      id, project_id, title, due_at, sort_order, created_at, updated_at
    ) VALUES (
      ${id}::uuid,
      ${projectId}::uuid,
      ${title},
      ${dueAt}::timestamptz,
      ${sortOrder},
      ${now}::timestamptz,
      ${now}::timestamptz
    )
  `;

  const rows = asRows<MilestoneRow>(
    await sql`SELECT * FROM agency_project_milestones WHERE id = ${id}::uuid`,
  );
  return rows[0] ? mapMilestone(rows[0]) : null;
}

export async function updateProjectMilestone(
  milestoneId: string,
  input: {
    title?: string;
    dueAt?: string | null;
    completed?: boolean;
  },
): Promise<AgencyProjectMilestone | null> {
  await ready();
  const sql = getSql();
  const rows = asRows<MilestoneRow>(
    await sql`SELECT * FROM agency_project_milestones WHERE id = ${milestoneId}::uuid`,
  );
  const existing = rows[0];
  if (!existing) return null;

  const now = new Date().toISOString();
  const title = input.title !== undefined ? input.title.trim() : existing.title;
  if (!title) throw new Error("Title is required");

  let dueAt = existing.due_at;
  if (input.dueAt !== undefined) {
    dueAt = input.dueAt?.trim() ? input.dueAt.trim() : null;
  }

  let completedAt = existing.completed_at;
  if (input.completed === true) completedAt = completedAt ?? now;
  else if (input.completed === false) completedAt = null;

  await sql`
    UPDATE agency_project_milestones
    SET
      title = ${title},
      due_at = ${dueAt}::timestamptz,
      completed_at = ${completedAt}::timestamptz,
      updated_at = ${now}::timestamptz
    WHERE id = ${milestoneId}::uuid
  `;

  const updated = asRows<MilestoneRow>(
    await sql`SELECT * FROM agency_project_milestones WHERE id = ${milestoneId}::uuid`,
  );
  return updated[0] ? mapMilestone(updated[0]) : null;
}

export async function listDueMilestones(options?: {
  withinDays?: number;
  limit?: number;
}): Promise<AgencyDueMilestone[]> {
  await ready();
  const sql = getSql();
  const days = options?.withinDays ?? 14;
  const limit = options?.limit ?? 20;

  const rows = asRows<{
    milestone_id: string;
    project_id: string;
    project_title: string;
    client_name: string;
    title: string;
    due_at: string | null;
  }>(
    await sql`
      SELECT
        m.id AS milestone_id,
        p.id AS project_id,
        p.title AS project_title,
        p.client_name,
        m.title,
        m.due_at
      FROM agency_project_milestones m
      INNER JOIN agency_projects p ON p.id = m.project_id
      WHERE m.completed_at IS NULL
        AND p.status NOT IN ('archived', 'delivered')
        AND m.due_at IS NOT NULL
        AND m.due_at <= NOW() + (${days}::text || ' days')::interval
      ORDER BY m.due_at NULLS LAST, p.updated_at DESC
      LIMIT ${limit}
    `,
  );

  return rows.map((r) => ({
    milestoneId: r.milestone_id,
    projectId: r.project_id,
    projectTitle: r.project_title,
    clientName: r.client_name,
    title: r.title,
    dueAt: r.due_at,
  }));
}

export { agencyProjectStatusLabels };