import fs from "node:fs";
import path from "node:path";
import { sendEmail } from "@/lib/emails/sendEmail";
import { formatOutreachCsv, formatOutreachMarkdown } from "@/lib/growth/outreach-export";
import { buildPersonalizedEmailDraft } from "@/lib/growth/personalized-email-draft";
import type {
  GrowthOutreachItem,
  GrowthOutreachRun,
  OutreachTotals,
  RunOutreachOptions,
} from "@/lib/growth/outreach-types";
import type { GrowthPlatform } from "@/lib/growth/types";
import { ensureSchema } from "@/lib/db/ensure-schema";
import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";
import { getIcpConfig } from "@/lib/growth/repository";

async function ready() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required for the growth engine");
  }
  await ensureSchema();
}

function parseReasons(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

type LeadOutreachRow = {
  id: string;
  full_name: string;
  role_title: string | null;
  company_name: string | null;
  profile_url: string | null;
  email: string | null;
  platform: string | null;
  composite_score: number;
  score_reasons: unknown;
  profile_summary: string | null;
  body_text: string | null;
  context_summary: string | null;
  crm_email: string | null;
};

type RunRow = {
  id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  totals: OutreachTotals;
  created_by: string | null;
};

type ItemRow = {
  id: string;
  run_id: string;
  lead_id: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  company_name: string | null;
  profile_url: string | null;
  subject_line: string;
  body_text: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  used_ai: boolean;
  created_at: string;
};

function mapRun(row: RunRow): GrowthOutreachRun {
  return {
    id: row.id,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    totals: row.totals ?? {
      processed: 0,
      sent: 0,
      no_email: 0,
      failed: 0,
      used_ai: 0,
    },
    createdBy: row.created_by,
  };
}

function mapItem(row: ItemRow): GrowthOutreachItem {
  return {
    id: row.id,
    runId: row.run_id,
    leadId: row.lead_id,
    recipientName: row.recipient_name,
    recipientEmail: row.recipient_email,
    companyName: row.company_name,
    profileUrl: row.profile_url,
    subjectLine: row.subject_line,
    bodyText: row.body_text,
    status: row.status,
    errorMessage: row.error_message,
    sentAt: row.sent_at,
    usedAi: row.used_ai,
    createdAt: row.created_at,
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textToHtmlParagraphs(text: string): string {
  return text
    .trim()
    .split(/\n\n+/)
    .map((p) => `<p style="margin:0 0 12px;font-size:14px;line-height:22px;">${escapeHtml(p).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export async function listOutreachRuns(limit = 10): Promise<GrowthOutreachRun[]> {
  await ready();
  const sql = getSql();
  const rows = asRows<RunRow>(
    await sql`
      SELECT id, status, started_at, completed_at, totals, created_by
      FROM growth_outreach_runs
      ORDER BY started_at DESC
      LIMIT ${limit}
    `,
  );
  return rows.map(mapRun);
}

export async function getOutreachRun(runId: string): Promise<{
  run: GrowthOutreachRun;
  items: GrowthOutreachItem[];
} | null> {
  await ready();
  const sql = getSql();
  const runRows = asRows<RunRow>(
    await sql`
      SELECT id, status, started_at, completed_at, totals, created_by
      FROM growth_outreach_runs
      WHERE id = ${runId}::uuid
      LIMIT 1
    `,
  );
  const runRow = runRows[0];
  if (!runRow) return null;
  const itemRows = asRows<ItemRow>(
    await sql`
      SELECT *
      FROM growth_outreach_items
      WHERE run_id = ${runId}::uuid
      ORDER BY created_at ASC
    `,
  );
  return { run: mapRun(runRow), items: itemRows.map(mapItem) };
}

export async function runOutreachCampaign(
  options: RunOutreachOptions = {},
): Promise<{ run: GrowthOutreachRun; items: GrowthOutreachItem[] }> {
  await ready();
  const sql = getSql();
  const limit = Math.min(500, Math.max(1, options.limit ?? 200));
  const send = options.send !== false;
  const config = await getIcpConfig();

  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  await sql`
    INSERT INTO growth_outreach_runs (id, status, started_at, totals, created_by)
    VALUES (
      ${runId}::uuid,
      'running',
      ${startedAt}::timestamptz,
      ${JSON.stringify({
        processed: 0,
        sent: 0,
        no_email: 0,
        failed: 0,
        used_ai: 0,
      })}::jsonb,
      ${options.createdBy ?? null}
    )
  `;

  const leadRows = asRows<LeadOutreachRow>(
    await sql`
      SELECT
        l.id,
        l.full_name,
        l.role_title,
        l.company_name,
        l.profile_url,
        l.email,
        l.platform,
        l.composite_score,
        l.score_reasons,
        l.profile_summary,
        s.body_text,
        s.context_summary,
        p.email AS crm_email
      FROM growth_leads l
      LEFT JOIN growth_signals s ON s.id = l.signal_id
      LEFT JOIN crm_people p ON p.growth_lead_id = l.id
      WHERE l.profile_url IS NOT NULL AND trim(l.profile_url) <> ''
      ORDER BY l.composite_score DESC, l.created_at DESC
      LIMIT ${limit}
    `,
  );

  const totals: OutreachTotals = {
    processed: 0,
    sent: 0,
    no_email: 0,
    failed: 0,
    used_ai: 0,
  };
  const items: GrowthOutreachItem[] = [];

  for (const lead of leadRows) {
    totals.processed += 1;
    const itemId = crypto.randomUUID();
    const recipientEmail = (lead.email?.trim() || lead.crm_email?.trim() || "") || null;
    const platform = (lead.platform ?? "linkedin") as GrowthPlatform;

    let subjectLine = "";
    let bodyText = "";
    let usedAi = false;
    let status = "draft_ready";
    let errorMessage: string | null = null;
    let sentAt: string | null = null;

    try {
      const draft = await buildPersonalizedEmailDraft({
        platform,
        authorName: lead.full_name,
        roleTitle: lead.role_title,
        companyName: lead.company_name,
        bodyText: lead.body_text ?? lead.role_title ?? "",
        contextSummary: lead.context_summary,
        profileSummary: lead.profile_summary,
        compositeScore: lead.composite_score,
        scoreReasons: parseReasons(lead.score_reasons),
        config,
      });
      subjectLine = draft.subject;
      bodyText = draft.body;
      usedAi = draft.usedAi;
      if (draft.usedAi) totals.used_ai += 1;

      if (!recipientEmail) {
        status = "no_email";
        totals.no_email += 1;
      } else if (!send) {
        status = "dry_run";
      } else {
        const bodyHtml = textToHtmlParagraphs(bodyText);
        const result = await sendEmail({
          to: recipientEmail,
          template: "growth-outreach",
          version: "0.0.1",
          metadata: {
            displayName: lead.full_name.split(/\s+/)[0] || "there",
            subjectLine,
            bodyText,
            bodyHtml,
          },
        });
        if (result) {
          status = "sent";
          sentAt = new Date().toISOString();
          totals.sent += 1;
          await sql`
            UPDATE growth_leads
            SET pipeline_status = 'outreach', updated_at = NOW()
            WHERE id = ${lead.id}::uuid
          `;
        } else {
          status = "smtp_dev_log";
          totals.no_email += 1;
          errorMessage = "SMTP not configured — draft logged in dev console only";
        }
      }
    } catch (error) {
      status = "failed";
      totals.failed += 1;
      errorMessage = error instanceof Error ? error.message : "Outreach failed";
    }

    const now = new Date().toISOString();
    await sql`
      INSERT INTO growth_outreach_items (
        id, run_id, lead_id, recipient_name, recipient_email, company_name,
        profile_url, subject_line, body_text, status, error_message, sent_at,
        used_ai, created_at
      ) VALUES (
        ${itemId}::uuid,
        ${runId}::uuid,
        ${lead.id}::uuid,
        ${lead.full_name},
        ${recipientEmail},
        ${lead.company_name},
        ${lead.profile_url},
        ${subjectLine || "(no subject)"},
        ${bodyText || ""},
        ${status},
        ${errorMessage},
        ${sentAt}::timestamptz,
        ${usedAi},
        ${now}::timestamptz
      )
    `;
    items.push(
      mapItem({
        id: itemId,
        run_id: runId,
        lead_id: lead.id,
        recipient_name: lead.full_name,
        recipient_email: recipientEmail,
        company_name: lead.company_name,
        profile_url: lead.profile_url,
        subject_line: subjectLine || "(no subject)",
        body_text: bodyText,
        status,
        error_message: errorMessage,
        sent_at: sentAt,
        used_ai: usedAi,
        created_at: now,
      }),
    );

    await new Promise((r) => setTimeout(r, 250));
  }

  const completedAt = new Date().toISOString();
  await sql`
    UPDATE growth_outreach_runs
    SET status = 'completed', completed_at = ${completedAt}::timestamptz, totals = ${JSON.stringify(totals)}::jsonb
    WHERE id = ${runId}::uuid
  `;

  const run = mapRun({
    id: runId,
    status: "completed",
    started_at: startedAt,
    completed_at: completedAt,
    totals,
    created_by: options.createdBy ?? null,
  });

  if (options.writeExportFiles) {
    const exportsDir = path.join(process.cwd(), "exports");
    fs.mkdirSync(exportsDir, { recursive: true });
    const stamp = completedAt.slice(0, 10);
    fs.writeFileSync(
      path.join(exportsDir, `growth-outreach-report-${stamp}.md`),
      formatOutreachMarkdown(run, items),
    );
    fs.writeFileSync(
      path.join(exportsDir, `growth-outreach-report-${stamp}.csv`),
      formatOutreachCsv(run, items),
    );
  }

  return { run, items };
}
