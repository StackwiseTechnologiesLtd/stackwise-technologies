import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";
import {
  rowToPaymentLink,
  type PaymentLink,
  type PaymentLinkRow,
} from "@/lib/payments/types";

const memoryStore = new Map<string, PaymentLinkRow>();

function paymentLinkToRow(link: PaymentLink): PaymentLinkRow {
  return {
    id: link.id,
    slug: link.slug,
    customer_name: link.customerName,
    customer_email: link.customerEmail,
    currency: link.currency,
    amount_usd: link.amountUsd,
    amount_local: link.amountLocal,
    exchange_rate: link.exchangeRate,
    status: link.status,
    line_items: link.lineItems,
    notes: link.notes,
    kpay_payment_id: link.kpayPaymentId,
    kpay_reference: link.kpayReference,
    gateway_url: link.gatewayUrl,
    invoice_number: link.invoiceNumber,
    sent_at: link.sentAt ? new Date(link.sentAt).toISOString() : null,
    paid_at: link.paidAt ? new Date(link.paidAt).toISOString() : null,
    receipt_sent_at: link.receiptSentAt
      ? new Date(link.receiptSentAt).toISOString()
      : null,
    created_at: new Date(link.createdAt).toISOString(),
    updated_at: new Date(link.updatedAt).toISOString(),
  };
}

async function upsertRow(row: PaymentLinkRow): Promise<void> {
  if (isDatabaseConfigured()) {
    const sql = getSql();
    const lineItems =
      typeof row.line_items === "string"
        ? row.line_items
        : JSON.stringify(row.line_items);

    await sql`
      INSERT INTO payment_links (
        id, slug, customer_name, customer_email, currency,
        amount_usd, amount_local, exchange_rate, status, line_items,
        notes, kpay_payment_id, kpay_reference, gateway_url,
        invoice_number, sent_at, paid_at, receipt_sent_at, created_at, updated_at
      ) VALUES (
        ${row.id}::uuid,
        ${row.slug},
        ${row.customer_name},
        ${row.customer_email},
        ${row.currency},
        ${row.amount_usd},
        ${row.amount_local},
        ${row.exchange_rate},
        ${row.status},
        ${lineItems}::jsonb,
        ${row.notes},
        ${row.kpay_payment_id},
        ${row.kpay_reference},
        ${row.gateway_url},
        ${row.invoice_number},
        ${row.sent_at},
        ${row.paid_at},
        ${row.receipt_sent_at},
        ${row.created_at},
        ${row.updated_at}
      )
      ON CONFLICT (id) DO UPDATE SET
        slug = EXCLUDED.slug,
        customer_name = EXCLUDED.customer_name,
        customer_email = EXCLUDED.customer_email,
        currency = EXCLUDED.currency,
        amount_usd = EXCLUDED.amount_usd,
        amount_local = EXCLUDED.amount_local,
        exchange_rate = EXCLUDED.exchange_rate,
        status = EXCLUDED.status,
        line_items = EXCLUDED.line_items,
        notes = EXCLUDED.notes,
        kpay_payment_id = EXCLUDED.kpay_payment_id,
        kpay_reference = EXCLUDED.kpay_reference,
        gateway_url = EXCLUDED.gateway_url,
        invoice_number = EXCLUDED.invoice_number,
        sent_at = EXCLUDED.sent_at,
        paid_at = EXCLUDED.paid_at,
        receipt_sent_at = EXCLUDED.receipt_sent_at,
        updated_at = EXCLUDED.updated_at
    `;
    return;
  }

  memoryStore.set(row.id, {
    ...row,
    line_items:
      typeof row.line_items === "string"
        ? row.line_items
        : JSON.stringify(row.line_items),
  });
}

async function findRowBySlug(slug: string): Promise<PaymentLinkRow | null> {
  if (isDatabaseConfigured()) {
    const sql = getSql();
    const rows = asRows<PaymentLinkRow>(await sql`
      SELECT * FROM payment_links WHERE slug = ${slug} LIMIT 1
    `);
    return rows[0] ?? null;
  }

  for (const row of memoryStore.values()) {
    if (row.slug === slug) return row;
  }
  return null;
}

async function findRowById(id: string): Promise<PaymentLinkRow | null> {
  if (isDatabaseConfigured()) {
    const sql = getSql();
    const rows = asRows<PaymentLinkRow>(await sql`
      SELECT * FROM payment_links WHERE id = ${id}::uuid LIMIT 1
    `);
    return rows[0] ?? null;
  }
  return memoryStore.get(id) ?? null;
}

export async function listPaymentLinks(): Promise<PaymentLink[]> {
  if (isDatabaseConfigured()) {
    const sql = getSql();
    const rows = asRows<PaymentLinkRow>(await sql`
      SELECT * FROM payment_links ORDER BY created_at DESC
    `);
    return rows.map(rowToPaymentLink);
  }

  return Array.from(memoryStore.values())
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .map(rowToPaymentLink);
}

export async function getPaymentLinkBySlug(slug: string): Promise<PaymentLink | null> {
  const row = await findRowBySlug(slug);
  return row ? rowToPaymentLink(row) : null;
}

export async function getPaymentLinkById(id: string): Promise<PaymentLink | null> {
  const row = await findRowById(id);
  return row ? rowToPaymentLink(row) : null;
}

export async function getPaymentLinkByExternalId(
  externalId: string,
): Promise<PaymentLink | null> {
  return getPaymentLinkById(externalId);
}

export async function savePaymentLink(link: PaymentLink): Promise<PaymentLink> {
  await upsertRow(paymentLinkToRow(link));
  return link;
}

export async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SW-${year}-`;

  if (isDatabaseConfigured()) {
    const sql = getSql();
    const rows = asRows<{ invoice_number: string }>(await sql`
      SELECT invoice_number FROM payment_links
      WHERE invoice_number LIKE ${`${prefix}%`}
      ORDER BY invoice_number DESC
      LIMIT 1
    `);
    const last = rows[0]?.invoice_number
      ? Number.parseInt(String(rows[0].invoice_number).replace(prefix, ""), 10)
      : 0;
    return `${prefix}${String(last + 1).padStart(4, "0")}`;
  }

  const memCount = Array.from(memoryStore.values()).filter((r) =>
    String(r.invoice_number).startsWith(prefix),
  ).length;
  return `${prefix}${String(memCount + 1).padStart(4, "0")}`;
}

export function createSlug(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function createId(): string {
  return crypto.randomUUID();
}
