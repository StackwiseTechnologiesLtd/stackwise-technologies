import { ensureSchema } from "@/lib/db/ensure-schema";
import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";
import type { PaymentAuditIpGeo } from "@/lib/ip-geo";
import { resolveIpGeo } from "@/lib/ip-geo";
import { getClientIp, getUserAgent } from "@/lib/request-client";

export type PaymentAuditEvent =
  | "PAY_PAGE_VIEW"
  | "PAYMENT_INIT"
  | "RECEIPT_VIEW"
  | "RETURN_CALLBACK"
  | "MANUAL_PAYMENT_RECORDED";

export type PaymentAuditLog = {
  id: string;
  paymentLinkId: string;
  event: PaymentAuditEvent;
  ipAddress: string | null;
  userAgent: string | null;
  ipGeo: PaymentAuditIpGeo | null;
  metadata: Record<string, unknown> | null;
  createdAt: number;
};

type PaymentAuditRow = {
  id: string;
  payment_link_id: string;
  event: string;
  ip_address: string | null;
  user_agent: string | null;
  ip_geo: PaymentAuditIpGeo | string | null;
  metadata: Record<string, unknown> | string | null;
  created_at: Date | string;
};

const memoryStore: PaymentAuditRow[] = [];

function parseJsonColumn<T>(value: T | string | null): T | null {
  if (value == null) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return value;
}

function rowToLog(row: PaymentAuditRow): PaymentAuditLog {
  return {
    id: row.id,
    paymentLinkId: row.payment_link_id,
    event: row.event as PaymentAuditEvent,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    ipGeo: parseJsonColumn<PaymentAuditIpGeo>(row.ip_geo),
    metadata: parseJsonColumn<Record<string, unknown>>(row.metadata),
    createdAt: new Date(row.created_at).getTime(),
  };
}

export async function logPaymentAudit(input: {
  paymentLinkId: string;
  event: PaymentAuditEvent;
  ip?: string | null;
  userAgent?: string | null;
  headers?: Headers;
  ipGeo?: PaymentAuditIpGeo | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  const ip =
    input.ip ?? (input.headers ? getClientIp(input.headers) : null) ?? null;
  const userAgent =
    input.userAgent ??
    (input.headers ? getUserAgent(input.headers) : null) ??
    null;

  let ipGeo = input.ipGeo ?? null;
  if (!ipGeo && input.headers && ip) {
    ipGeo = await resolveIpGeo(input.headers, ip);
  }

  const row: PaymentAuditRow = {
    id: crypto.randomUUID(),
    payment_link_id: input.paymentLinkId,
    event: input.event,
    ip_address: ip,
    user_agent: userAgent,
    ip_geo: ipGeo,
    metadata: input.metadata ?? null,
    created_at: new Date().toISOString(),
  };

  if (isDatabaseConfigured()) {
    await ensureSchema();
    const sql = getSql();
    await sql`
      INSERT INTO payment_audit_logs (
        id, payment_link_id, event, ip_address, user_agent, ip_geo, metadata, created_at
      ) VALUES (
        ${row.id},
        ${row.payment_link_id},
        ${row.event},
        ${row.ip_address},
        ${row.user_agent},
        ${row.ip_geo ? JSON.stringify(row.ip_geo) : null}::jsonb,
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
  void logPaymentAudit({
    paymentLinkId,
    event,
    headers,
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
  limit = 1000,
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
