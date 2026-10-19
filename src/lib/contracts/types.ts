export const CONTRACT_DOCUMENT_KINDS = [
  "sow",
  "msa",
  "nda",
  "maintenance",
  "combined",
] as const;

export type ContractDocumentKind = (typeof CONTRACT_DOCUMENT_KINDS)[number];

export const CONTRACT_STATUSES = [
  "GENERATING",
  "GENERATION_FAILED",
  "PENDING_REVIEW",
  "SENT",
  "FEEDBACK_RECEIVED",
] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export type ContractEngagement = {
  id: string;
  slug: string;
  reference: string;
  title: string;
  documentKind: ContractDocumentKind;
  customerName: string;
  customerEmail: string;
  companyName: string | null;
  leadId: string | null;
  servicesBrief: string;
  commercialNotes: string | null;
  bodyMarkdown: string;
  status: ContractStatus;
  generationError: string | null;
  clientFeedback: string | null;
  clientFeedbackAt: number | null;
  sentAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export type ContractEngagementRow = {
  id: string;
  slug: string;
  reference: string;
  title: string;
  document_kind: string;
  customer_name: string;
  customer_email: string;
  company_name: string | null;
  lead_id: string | null;
  services_brief: string;
  commercial_notes: string | null;
  body_markdown: string;
  status: string;
  generation_error: string | null;
  client_feedback: string | null;
  client_feedback_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export function rowToContractEngagement(
  row: ContractEngagementRow,
): ContractEngagement {
  return {
    id: row.id,
    slug: row.slug,
    reference: row.reference,
    title: row.title,
    documentKind: row.document_kind as ContractDocumentKind,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    companyName: row.company_name,
    leadId: row.lead_id,
    servicesBrief: row.services_brief,
    commercialNotes: row.commercial_notes,
    bodyMarkdown: row.body_markdown,
    status: row.status as ContractStatus,
    generationError: row.generation_error,
    clientFeedback: row.client_feedback,
    clientFeedbackAt: row.client_feedback_at
      ? new Date(row.client_feedback_at).getTime()
      : null,
    sentAt: row.sent_at ? new Date(row.sent_at).getTime() : null,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export function contractDocumentKindLabel(kind: ContractDocumentKind): string {
  switch (kind) {
    case "sow":
      return "Statement of Work";
    case "msa":
      return "Master Services Agreement";
    case "nda":
      return "Non-Disclosure Agreement";
    case "maintenance":
      return "Maintenance & Support Agreement";
    case "combined":
      return "MSA + Statement of Work";
    default:
      return kind;
  }
}

export function contractStatusLabel(status: ContractStatus): string {
  switch (status) {
    case "GENERATING":
      return "Generating";
    case "GENERATION_FAILED":
      return "Generation failed";
    case "PENDING_REVIEW":
      return "Pending your review";
    case "SENT":
      return "Sent to client";
    case "FEEDBACK_RECEIVED":
      return "Client feedback";
    default:
      return status;
  }
}
