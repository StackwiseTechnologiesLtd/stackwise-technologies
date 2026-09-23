import { ensureSchema } from "@/lib/db/ensure-schema";
import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";

async function dbReady() {
  await ensureSchema();
}
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
    kpay_is_test: link.kpayIsTest,
    gateway_url: link.gatewayUrl,
    allowed_payment_methods: link.allowedPaymentMethods,
    invoice_number: link.invoiceNumber,
    sent_at: link.sentAt ? new Date(link.sentAt).toISOString() : null,
    paid_at: link.paidAt ? new Date(link.paidAt).toISOString() : null,
    receipt_sent_at: link.receiptSentAt
      ? new Date(link.receiptSentAt).toISOString()
      : null,
    payment_source: link.paymentSource,
    payment_method: link.paymentMethod,
    amount_received_usd: link.amountReceivedUsd,
    amount_received_local: link.amountReceivedLocal,
    collected_at: link.collectedAt ? new Date(link.collectedAt).toISOString() : null,
    payment_reference: link.paymentReference,
    payment_notes: link.paymentNotes,
    created_at: new Date(link.createdAt).toISOString(),
    updated_at: new Date(link.updatedAt).toISOString(),
  };
}

async function upsertRow(row: PaymentLinkRow): Promise<void> {
  if (isDatabaseConfigured()) {
    await dbReady();
    const sql = getSql();
    const lineItems =
      typeof row.line_items === "string"
        ? row.line_items
        : JSON.stringify(row.line_items);

    await sql`
      INSERT INTO payment_links (
        id, slug, customer_name, customer_email, currency,
        amount_usd, amount_local, exchange_rate, status, line_items,
        notes, kpay_payment_id, kpay_reference, kpay_is_test, gateway_url,
        allowed_payment_methods, invoice_number, sent_at, paid_at, receipt_sent_at,
        payment_source, payment_method, amount_received_usd, amount_received_local,
        collected_at, payment_reference, payment_notes,
        created_at, updated_at
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
        ${row.kpay_is_test},
        ${row.gateway_url},
        ${row.allowed_payment_methods ?? "BOTH"},
        ${row.invoice_number},
        ${row.sent_at},
        ${row.paid_at},
        ${row.receipt_sent_at},
        ${row.payment_source},
        ${row.payment_method},
        ${row.amount_received_usd},
        ${row.amount_received_local},
        ${row.collected_at},
        ${row.payment_reference},
        ${row.payment_notes},
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
        kpay_is_test = EXCLUDED.kpay_is_test,
        gateway_url = EXCLUDED.gateway_url,
        allowed_payment_methods = EXCLUDED.allowed_payment_methods,
        invoice_number = EXCLUDED.invoice_number,
        sent_at = EXCLUDED.sent_at,
        paid_at = EXCLUDED.paid_at,
        receipt_sent_at = EXCLUDED.receipt_sent_at,
        payment_source = EXCLUDED.payment_source,
        payment_method = EXCLUDED.payment_method,
        amount_received_usd = EXCLUDED.amount_received_usd,
        amount_received_local = EXCLUDED.amount_received_local,
        collected_at = EXCLUDED.collected_at,
        payment_reference = EXCLUDED.payment_reference,
        payment_notes = EXCLUDED.payment_notes,
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
    await dbReady();
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
    await dbReady();
    const sql = getSql();
    const rows = asRows<PaymentLinkRow>(await sql`
      SELECT * FROM payment_links WHERE id = ${id}::uuid LIMIT 1
    `);
    return rows[0] ?? null;
  }
  return memoryStore.get(id) ?? null;
}

export type ListPaymentLinksFilter = "production" | "test" | "all";

export async function listPaymentLinks(
  filter: ListPaymentLinksFilter = "all",
): Promise<PaymentLink[]> {
  if (isDatabaseConfigured()) {
    await dbReady();
    const sql = getSql();
    const rows = asRows<PaymentLinkRow>(
      filter === "production"
        ? await sql`
            SELECT * FROM payment_links
            WHERE kpay_is_test = false
            ORDER BY created_at DESC
          `
        : filter === "test"
          ? await sql`
              SELECT * FROM payment_links
              WHERE kpay_is_test IS DISTINCT FROM false
              ORDER BY created_at DESC
            `
          : await sql`
              SELECT * FROM payment_links
              ORDER BY created_at DESC
            `,
    );
    return rows.map(rowToPaymentLink);
  }

  const all = Array.from(memoryStore.values())
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .map(rowToPaymentLink);

  if (filter === "production") {
    return all.filter((link) => link.kpayIsTest === false);
  }
  if (filter === "test") {
    return all.filter((link) => link.kpayIsTest !== false);
  }
  return all;
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

const INVOICE_NUMBER_PREFIX = "STL-";
const INVOICE_NUMBER_LENGTH = 12;
const INVOICE_SUFFIX_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function randomInvoiceSuffix(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => INVOICE_SUFFIX_CHARS[b % INVOICE_SUFFIX_CHARS.length]).join("");
}

export async function nextInvoiceNumber(): Promise<string> {
  const suffixLength = INVOICE_NUMBER_LENGTH - INVOICE_NUMBER_PREFIX.length;
  return `${INVOICE_NUMBER_PREFIX}${randomInvoiceSuffix(suffixLength)}`;
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
