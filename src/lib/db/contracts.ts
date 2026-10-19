import { ensureSchema } from "@/lib/db/ensure-schema";
import { createId, createSlug } from "@/lib/db/payment-links";
import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";
import type {
  ContractEngagement,
  ContractEngagementRow,
  ContractStatus,
} from "@/lib/contracts/types";
import { rowToContractEngagement } from "@/lib/contracts/types";

const memoryStore = new Map<string, ContractEngagementRow>();

async function dbReady() {
  await ensureSchema();
}

const REF_PREFIX = "SWA-";
const REF_SUFFIX_CHARS = "0123456789ABCDEF";

function randomRefSuffix(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => REF_SUFFIX_CHARS[b % REF_SUFFIX_CHARS.length]).join(
    "",
  );
}

export function nextContractReference(): string {
  return `${REF_PREFIX}${randomRefSuffix(8)}`;
}

function engagementToRow(e: ContractEngagement): ContractEngagementRow {
  return {
    id: e.id,
    slug: e.slug,
    reference: e.reference,
    title: e.title,
    document_kind: e.documentKind,
    customer_name: e.customerName,
    customer_email: e.customerEmail,
    company_name: e.companyName,
    lead_id: e.leadId,
    services_brief: e.servicesBrief,
    commercial_notes: e.commercialNotes,
    body_markdown: e.bodyMarkdown,
    status: e.status,
    generation_error: e.generationError,
    client_feedback: e.clientFeedback,
    client_feedback_at: e.clientFeedbackAt
      ? new Date(e.clientFeedbackAt).toISOString()
      : null,
    sent_at: e.sentAt ? new Date(e.sentAt).toISOString() : null,
    accepted_at: e.acceptedAt ? new Date(e.acceptedAt).toISOString() : null,
    accepted_by_name: e.acceptedByName,
    delivery_phase: e.deliveryPhase,
    progress_headline: e.progressHeadline,
    progress_detail: e.progressDetail,
    milestones: JSON.stringify(e.milestones),
    created_at: new Date(e.createdAt).toISOString(),
    updated_at: new Date(e.updatedAt).toISOString(),
  };
}

async function upsertRow(row: ContractEngagementRow): Promise<void> {
  if (isDatabaseConfigured()) {
    await dbReady();
    const sql = getSql();
    await sql`
      INSERT INTO contract_engagements (
        id, slug, reference, title, document_kind,
        customer_name, customer_email, company_name, lead_id,
        services_brief, commercial_notes, body_markdown,
        status, generation_error, client_feedback, client_feedback_at,
        sent_at, accepted_at, accepted_by_name, delivery_phase,
        progress_headline, progress_detail, milestones,
        created_at, updated_at
      ) VALUES (
        ${row.id}::uuid,
        ${row.slug},
        ${row.reference},
        ${row.title},
        ${row.document_kind},
        ${row.customer_name},
        ${row.customer_email},
        ${row.company_name},
        ${row.lead_id},
        ${row.services_brief},
        ${row.commercial_notes},
        ${row.body_markdown},
        ${row.status},
        ${row.generation_error},
        ${row.client_feedback},
        ${row.client_feedback_at},
        ${row.sent_at},
        ${row.accepted_at},
        ${row.accepted_by_name},
        ${row.delivery_phase},
        ${row.progress_headline},
        ${row.progress_detail},
        ${row.milestones}::jsonb,
        ${row.created_at},
        ${row.updated_at}
      )
      ON CONFLICT (id) DO UPDATE SET
        slug = EXCLUDED.slug,
        reference = EXCLUDED.reference,
        title = EXCLUDED.title,
        document_kind = EXCLUDED.document_kind,
        customer_name = EXCLUDED.customer_name,
        customer_email = EXCLUDED.customer_email,
        company_name = EXCLUDED.company_name,
        lead_id = EXCLUDED.lead_id,
        services_brief = EXCLUDED.services_brief,
        commercial_notes = EXCLUDED.commercial_notes,
        body_markdown = EXCLUDED.body_markdown,
        status = EXCLUDED.status,
        generation_error = EXCLUDED.generation_error,
        client_feedback = EXCLUDED.client_feedback,
        client_feedback_at = EXCLUDED.client_feedback_at,
        sent_at = EXCLUDED.sent_at,
        accepted_at = EXCLUDED.accepted_at,
        accepted_by_name = EXCLUDED.accepted_by_name,
        delivery_phase = EXCLUDED.delivery_phase,
        progress_headline = EXCLUDED.progress_headline,
        progress_detail = EXCLUDED.progress_detail,
        milestones = EXCLUDED.milestones,
        updated_at = EXCLUDED.updated_at
    `;
    return;
  }

  memoryStore.set(row.id, row);
}

export async function saveContractEngagement(
  engagement: ContractEngagement,
): Promise<ContractEngagement> {
  await upsertRow(engagementToRow(engagement));
  return engagement;
}

export async function getContractEngagementById(
  id: string,
): Promise<ContractEngagement | null> {
  if (isDatabaseConfigured()) {
    await dbReady();
    const sql = getSql();
    const rows = asRows<ContractEngagementRow>(await sql`
      SELECT * FROM contract_engagements WHERE id = ${id}::uuid LIMIT 1
    `);
    return rows[0] ? rowToContractEngagement(rows[0]) : null;
  }
  const row = memoryStore.get(id);
  return row ? rowToContractEngagement(row) : null;
}

export async function getContractEngagementBySlug(
  slug: string,
): Promise<ContractEngagement | null> {
  if (isDatabaseConfigured()) {
    await dbReady();
    const sql = getSql();
    const rows = asRows<ContractEngagementRow>(await sql`
      SELECT * FROM contract_engagements WHERE slug = ${slug} LIMIT 1
    `);
    return rows[0] ? rowToContractEngagement(rows[0]) : null;
  }
  for (const row of memoryStore.values()) {
    if (row.slug === slug) return rowToContractEngagement(row);
  }
  return null;
}

export async function listContractEngagements(): Promise<ContractEngagement[]> {
  if (isDatabaseConfigured()) {
    await dbReady();
    const sql = getSql();
    const rows = asRows<ContractEngagementRow>(await sql`
      SELECT * FROM contract_engagements
      ORDER BY created_at DESC
      LIMIT 500
    `);
    return rows.map(rowToContractEngagement);
  }
  return Array.from(memoryStore.values())
    .map(rowToContractEngagement)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export type CreateContractEngagementSeed = {
  documentKind: ContractEngagement["documentKind"];
  customerName: string;
  customerEmail: string;
  companyName?: string | null;
  leadId?: string | null;
  servicesBrief: string;
  commercialNotes?: string | null;
};

export function createContractEngagementSeed(
  input: CreateContractEngagementSeed,
): ContractEngagement {
  const now = Date.now();
  return {
    id: createId(),
    slug: createSlug(),
    reference: nextContractReference(),
    title: "",
    documentKind: input.documentKind,
    customerName: input.customerName.trim(),
    customerEmail: input.customerEmail.trim().toLowerCase(),
    companyName: input.companyName?.trim() ?? null,
    leadId: input.leadId ?? null,
    servicesBrief: input.servicesBrief.trim(),
    commercialNotes: input.commercialNotes?.trim() ?? null,
    bodyMarkdown: "",
    status: "GENERATING",
    generationError: null,
    clientFeedback: null,
    clientFeedbackAt: null,
    sentAt: null,
    acceptedAt: null,
    acceptedByName: null,
    deliveryPhase: "agreement",
    progressHeadline: null,
    progressDetail: null,
    milestones: [],
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateContractStatus(
  id: string,
  status: ContractStatus,
  patch: Partial<
    Pick<
      ContractEngagement,
      | "title"
      | "bodyMarkdown"
      | "generationError"
      | "clientFeedback"
      | "clientFeedbackAt"
      | "sentAt"
    >
  > = {},
): Promise<ContractEngagement | null> {
  const existing = await getContractEngagementById(id);
  if (!existing) return null;

  const updated: ContractEngagement = {
    ...existing,
    ...patch,
    status,
    updatedAt: Date.now(),
  };
  await saveContractEngagement(updated);
  return updated;
}
