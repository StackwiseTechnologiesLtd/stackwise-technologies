import { ensureSchema } from "@/lib/db/ensure-schema";
import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";
import { getRequestClientInfo } from "@/lib/request-client";

export type PaymentAuditEvent =
  | "PAY_PAGE_VIEW"
  | "PAYMENT_INIT"
  | "RECEIPT_VIEW"
  | "RETURN_CALLBACK";

export type PaymentAuditLog = {
  id: string;
  paymentLinkId: string;
  event: PaymentAuditEvent;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: number;
};

type PaymentAuditRow = {
  id: string;
  payment_link_id: string;
  event: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | string | null;
  created_at: Date | string;
};

const memoryStore: PaymentAuditRow[] = [];

function rowToLog(row: PaymentAuditRow): PaymentAuditLog {
  const metadata =
    row.metadata == null
      ? null
      : typeof row.metadata === "string"
        ? (JSON.parse(row.metadata) as Record<string, unknown>)
        : row.metadata;

  return {
    id: row.id,
    paymentLinkId: row.payment_link_id,
    event: row.event as PaymentAuditEvent,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    metadata,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export async function logPaymentAudit(input: {
  paymentLinkId: string;
  event: PaymentAuditEvent;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  const row: PaymentAuditRow = {
    id: crypto.randomUUID(),
    payment_link_id: input.paymentLinkId,
    event: input.event,
    ip_address: input.ip ?? null,
    user_agent: input.userAgent ?? null,
    metadata: input.metadata ?? null,
    created_at: new Date().toISOString(),
  };

  if (isDatabaseConfigured()) {
    await ensureSchema();
    const sql = getSql();
    await sql`
      INSERT INTO payment_audit_logs (
        id, payment_link_id, event, ip_address, user_agent, metadata, created_at
      ) VALUES (
        ${row.id},
        ${row.payment_link_id},
        ${row.event},
        ${row.ip_address},
        ${row.user_agent},
        ${row.metadata ? JSON.stringify(row.metadata) : null}::jsonb,
        ${row.created_at}
      )
    `;
    return;
  }

  memoryStore.unshift(row);
  if (memoryStore.length > 500) memoryStore.pop();
}

/** Fire-and-forget audit log from an incoming request. Never blocks the caller. */
export function recordPaymentAudit(
  paymentLinkId: string,
  event: PaymentAuditEvent,
  headers: Headers,
  metadata?: Record<string, unknown> | null,
): void {
  const { ip, userAgent } = getRequestClientInfo(headers);
  void logPaymentAudit({
    paymentLinkId,
    event,
    ip,
    userAgent,
    metadata,
  }).catch(() => {});
}

export type PaymentAuditLogWithLink = PaymentAuditLog & {
  invoiceNumber: string;
  customerName: string;
};

type PaymentAuditWithLinkRow = PaymentAuditRow & {
  invoice_number: string;
  customer_name: string;
};

function rowToLogWithLink(row: PaymentAuditWithLinkRow): PaymentAuditLogWithLink {
  return {
    ...rowToLog(row),
    invoiceNumber: row.invoice_number,
    customerName: row.customer_name,
  };
}

export async function listRecentPaymentAuditLogs(
  limit = 100,
): Promise<PaymentAuditLogWithLink[]> {
  if (isDatabaseConfigured()) {
    await ensureSchema();
    const sql = getSql();
    const rows = asRows<PaymentAuditWithLinkRow>(await sql`
      SELECT
        l.*,
        pl.invoice_number,
        pl.customer_name
      FROM payment_audit_logs l
      JOIN payment_links pl ON pl.id = l.payment_link_id
      ORDER BY l.created_at DESC
      LIMIT ${limit}
    `);
    return rows.map(rowToLogWithLink);
  }

  return memoryStore.slice(0, limit).map((row) => ({
    ...rowToLog(row),
    invoiceNumber: "—",
    customerName: "—",
  }));
}

export async function listPaymentAuditLogs(
  paymentLinkId: string,
  limit = 50,
): Promise<PaymentAuditLog[]> {
  if (isDatabaseConfigured()) {
    await ensureSchema();
    const sql = getSql();
    const rows = asRows<PaymentAuditRow>(await sql`
      SELECT * FROM payment_audit_logs
      WHERE payment_link_id = ${paymentLinkId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `);
    return rows.map(rowToLog);
  }

  return memoryStore
    .filter((row) => row.payment_link_id === paymentLinkId)
    .slice(0, limit)
    .map(rowToLog);
}
