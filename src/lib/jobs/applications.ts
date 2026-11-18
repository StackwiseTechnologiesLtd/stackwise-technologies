import { ensureSchema } from "@/lib/db/ensure-schema";
import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";

export function firstApplyUrlFromPostBody(bodyText: string): string | null {
  const { resolveApplyUrlFromPostBody } =
    require("@/lib/growth/x-apply-urls") as typeof import("@/lib/growth/x-apply-urls");
  return resolveApplyUrlFromPostBody(bodyText);
}

export const jobApplicationChannels = ["x_reply", "ats", "manual"] as const;
export type JobApplicationChannel = (typeof jobApplicationChannels)[number];

export const jobApplicationStatuses = [
  "submitted",
  "partial",
  "failed",
  "skipped",
] as const;
export type JobApplicationStatus = (typeof jobApplicationStatuses)[number];

export const jobApplicationResponseStatuses = [
  "pending",
  "replied",
  "interview",
  "rejected",
  "offer",
] as const;
export type JobApplicationResponseStatus =
  (typeof jobApplicationResponseStatuses)[number];

export type JobApplication = {
  id: string;
  opportunityId: string | null;
  growthLeadId: string | null;
  channel: JobApplicationChannel;
  status: JobApplicationStatus;
  responseStatus: JobApplicationResponseStatus;
  employerLabel: string | null;
  roleTitle: string | null;
  sourcePostUrl: string | null;
  applyUrl: string | null;
  replyPreview: string | null;
  outcomeNotes: string | null;
  appliedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type JobApplicationStats = {
  submittedLast7Days: number;
  submittedLast30Days: number;
  xReplyCount: number;
  atsCount: number;
  pendingResponse: number;
};

type Row = {
  id: string;
  opportunity_id: string | null;
  growth_lead_id: string | null;
  channel: string;
  status: string;
  response_status: string;
  employer_label: string | null;
  role_title: string | null;
  source_post_url: string | null;
  apply_url: string | null;
  reply_preview: string | null;
  outcome_notes: string | null;
  applied_at: string;
  created_at: string;
  updated_at: string;
};

async function ready() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required");
  }
  await ensureSchema();
}

function mapRow(row: Row): JobApplication {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    growthLeadId: row.growth_lead_id,
    channel: row.channel as JobApplicationChannel,
    status: row.status as JobApplicationStatus,
    responseStatus: row.response_status as JobApplicationResponseStatus,
    employerLabel: row.employer_label,
    roleTitle: row.role_title,
    sourcePostUrl: row.source_post_url,
    applyUrl: row.apply_url,
    replyPreview: row.reply_preview,
    outcomeNotes: row.outcome_notes,
    appliedAt: row.applied_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function recordJobApplication(input: {
  opportunityId?: string | null;
  growthLeadId?: string | null;
  channel: JobApplicationChannel;
  status: JobApplicationStatus;
  employerLabel?: string | null;
  roleTitle?: string | null;
  sourcePostUrl?: string | null;
  applyUrl?: string | null;
  replyPreview?: string | null;
  outcomeNotes?: string | null;
  appliedAt?: string;
}): Promise<JobApplication> {
  await ready();
  const sql = getSql();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const appliedAt = input.appliedAt ?? now;

  const oppId = input.opportunityId?.trim() || null;
  const postUrl = input.sourcePostUrl?.trim() || null;

  const existing = asRows<Row>(
    oppId && postUrl
      ? await sql`
          SELECT * FROM crm_job_applications
          WHERE opportunity_id = ${oppId}::uuid
            AND channel = ${input.channel}
            AND source_post_url = ${postUrl}
          LIMIT 1
        `
      : postUrl
        ? await sql`
            SELECT * FROM crm_job_applications
            WHERE opportunity_id IS NULL
              AND channel = ${input.channel}
              AND source_post_url = ${postUrl}
            LIMIT 1
          `
        : [],
  );

  if (existing[0]) {
    await sql`
      UPDATE crm_job_applications
      SET
        status = ${input.status},
        employer_label = COALESCE(${input.employerLabel ?? null}, employer_label),
        role_title = COALESCE(${input.roleTitle ?? null}, role_title),
        apply_url = COALESCE(${input.applyUrl ?? null}, apply_url),
        reply_preview = COALESCE(${input.replyPreview ?? null}, reply_preview),
        outcome_notes = COALESCE(${input.outcomeNotes ?? null}, outcome_notes),
        applied_at = ${appliedAt}::timestamptz,
        updated_at = ${now}::timestamptz
      WHERE id = ${existing[0].id}::uuid
    `;
    const rows = asRows<Row>(
      await sql`SELECT * FROM crm_job_applications WHERE id = ${existing[0].id}::uuid`,
    );
    return mapRow(rows[0]);
  }

  await sql`
    INSERT INTO crm_job_applications (
      id, opportunity_id, growth_lead_id, channel, status,
      employer_label, role_title, source_post_url, apply_url,
      reply_preview, outcome_notes, applied_at, created_at, updated_at
    ) VALUES (
      ${id}::uuid,
      ${oppId}::uuid,
      ${input.growthLeadId ?? null}::uuid,
      ${input.channel},
      ${input.status},
      ${input.employerLabel ?? null},
      ${input.roleTitle ?? null},
      ${postUrl},
      ${input.applyUrl?.trim() || null},
      ${input.replyPreview?.trim() || null},
      ${input.outcomeNotes?.trim() || null},
      ${appliedAt}::timestamptz,
      ${now}::timestamptz,
      ${now}::timestamptz
    )
  `;

  const rows = asRows<Row>(
    await sql`SELECT * FROM crm_job_applications WHERE id = ${id}::uuid`,
  );
  return mapRow(rows[0]);
}

export async function listJobApplications(options?: {
  limit?: number;
  sinceDays?: number;
}): Promise<JobApplication[]> {
  await ready();
  const sql = getSql();
  const limit = options?.limit ?? 50;
  const days = options?.sinceDays ?? 90;

  const rows = asRows<Row>(
    await sql`
      SELECT * FROM crm_job_applications
      WHERE applied_at >= NOW() - (${days}::int * INTERVAL '1 day')
      ORDER BY applied_at DESC
      LIMIT ${limit}
    `,
  );
  return rows.map(mapRow);
}

export async function getJobApplicationStats(): Promise<JobApplicationStats> {
  await ready();
  const sql = getSql();
  const rows = asRows<{
    submitted_7d: number;
    submitted_30d: number;
    x_replies: number;
    ats: number;
    pending_resp: number;
  }>(
    await sql`
      SELECT
        COUNT(*) FILTER (
          WHERE status = 'submitted'
            AND applied_at >= NOW() - INTERVAL '7 days'
        )::int AS submitted_7d,
        COUNT(*) FILTER (
          WHERE status = 'submitted'
            AND applied_at >= NOW() - INTERVAL '30 days'
        )::int AS submitted_30d,
        COUNT(*) FILTER (WHERE channel = 'x_reply' AND status = 'submitted')::int AS x_replies,
        COUNT(*) FILTER (
          WHERE channel = 'ats' AND status IN ('submitted', 'partial')
        )::int AS ats,
        COUNT(*) FILTER (
          WHERE status = 'submitted' AND response_status = 'pending'
        )::int AS pending_resp
      FROM crm_job_applications
    `,
  );
  const r = rows[0];
  return {
    submittedLast7Days: r?.submitted_7d ?? 0,
    submittedLast30Days: r?.submitted_30d ?? 0,
    xReplyCount: r?.x_replies ?? 0,
    atsCount: r?.ats ?? 0,
    pendingResponse: r?.pending_resp ?? 0,
  };
}

/** Backfill from published X job-apply drafts + known CRM X hiring rows. */
export async function backfillJobApplicationsFromDrafts(): Promise<number> {
  await ready();
  const sql = getSql();
  const rows = asRows<{
    opportunity_id: string | null;
    growth_lead_id: string;
    source_url: string | null;
    body_text: string;
    opp_name: string;
    role_title: string | null;
    published_at: string;
    reply_text: string;
  }>(
    await sql`
      SELECT
        o.id AS opportunity_id,
        l.id AS growth_lead_id,
        s.source_url,
        s.body_text,
        o.name AS opp_name,
        l.role_title,
        d.updated_at AS published_at,
        d.body_text AS reply_text
      FROM growth_drafts d
      JOIN growth_leads l ON l.id = d.lead_id
      JOIN growth_signals s ON s.id = d.signal_id
      LEFT JOIN crm_opportunities o ON o.growth_lead_id = l.id
      WHERE d.draft_kind = 'x_job_apply'
        AND d.status = 'published'
    `,
  );

  let n = 0;
  for (const row of rows) {
    await recordJobApplication({
      opportunityId: row.opportunity_id,
      growthLeadId: row.growth_lead_id,
      channel: "x_reply",
      status: "submitted",
      employerLabel: row.opp_name?.slice(0, 120) ?? null,
      roleTitle: row.role_title,
      sourcePostUrl: row.source_url,
      replyPreview: row.reply_text?.slice(0, 280) ?? null,
      appliedAt: row.published_at,
    });
    n += 1;
  }
  return n;
}