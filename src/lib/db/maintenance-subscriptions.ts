import { ensureSchema } from "@/lib/db/ensure-schema";
import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";
import {
  rowToMaintenanceSubscription,
  type MaintenanceSubscription,
  type MaintenanceSubscriptionRow,
  type SubscriptionChargeEvent,
} from "@/lib/subscriptions/types";

const memorySubs = new Map<string, MaintenanceSubscriptionRow>();
const memoryCharges = new Map<string, SubscriptionChargeEvent>();

async function dbReady() {
  await ensureSchema();
}

function subscriptionToRow(sub: MaintenanceSubscription): MaintenanceSubscriptionRow {
  return {
    id: sub.id,
    slug: sub.slug,
    customer_name: sub.customerName,
    customer_email: sub.customerEmail,
    currency: sub.currency,
    amount_minor: sub.amountMinor,
    amount_usd: sub.amountUsd,
    exchange_rate: sub.exchangeRate,
    interval: sub.interval,
    description: sub.description,
    status: sub.status,
    paystack_plan_code: sub.paystackPlanCode,
    paystack_subscription_code: sub.paystackSubscriptionCode,
    paystack_customer_code: sub.paystackCustomerCode,
    paystack_reference: sub.paystackReference,
    gateway_url: sub.gatewayUrl,
    sent_at: sub.sentAt ? new Date(sub.sentAt).toISOString() : null,
    activated_at: sub.activatedAt ? new Date(sub.activatedAt).toISOString() : null,
    cancelled_at: sub.cancelledAt ? new Date(sub.cancelledAt).toISOString() : null,
    next_payment_at: sub.nextPaymentAt ? new Date(sub.nextPaymentAt).toISOString() : null,
    created_at: new Date(sub.createdAt).toISOString(),
    updated_at: new Date(sub.updatedAt).toISOString(),
  };
}

async function upsertSubscription(row: MaintenanceSubscriptionRow): Promise<void> {
  if (isDatabaseConfigured()) {
    await dbReady();
    const sql = getSql();
    await sql`
      INSERT INTO maintenance_subscriptions (
        id, slug, customer_name, customer_email, currency, amount_minor,
        amount_usd, exchange_rate, interval, description, status,
        paystack_plan_code, paystack_subscription_code, paystack_customer_code,
        paystack_reference, gateway_url, sent_at, activated_at, cancelled_at,
        next_payment_at, created_at, updated_at
      ) VALUES (
        ${row.id}::uuid,
        ${row.slug},
        ${row.customer_name},
        ${row.customer_email},
        ${row.currency},
        ${row.amount_minor},
        ${row.amount_usd},
        ${row.exchange_rate},
        ${row.interval},
        ${row.description},
        ${row.status},
        ${row.paystack_plan_code},
        ${row.paystack_subscription_code},
        ${row.paystack_customer_code},
        ${row.paystack_reference},
        ${row.gateway_url},
        ${row.sent_at},
        ${row.activated_at},
        ${row.cancelled_at},
        ${row.next_payment_at},
        ${row.created_at},
        ${row.updated_at}
      )
      ON CONFLICT (id) DO UPDATE SET
        slug = EXCLUDED.slug,
        customer_name = EXCLUDED.customer_name,
        customer_email = EXCLUDED.customer_email,
        currency = EXCLUDED.currency,
        amount_minor = EXCLUDED.amount_minor,
        amount_usd = EXCLUDED.amount_usd,
        exchange_rate = EXCLUDED.exchange_rate,
        interval = EXCLUDED.interval,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        paystack_plan_code = EXCLUDED.paystack_plan_code,
        paystack_subscription_code = EXCLUDED.paystack_subscription_code,
        paystack_customer_code = EXCLUDED.paystack_customer_code,
        paystack_reference = EXCLUDED.paystack_reference,
        gateway_url = EXCLUDED.gateway_url,
        sent_at = EXCLUDED.sent_at,
        activated_at = EXCLUDED.activated_at,
        cancelled_at = EXCLUDED.cancelled_at,
        next_payment_at = EXCLUDED.next_payment_at,
        updated_at = EXCLUDED.updated_at
    `;
    return;
  }
  memorySubs.set(row.id, row);
}

export async function listMaintenanceSubscriptions(): Promise<MaintenanceSubscription[]> {
  if (isDatabaseConfigured()) {
    await dbReady();
    const sql = getSql();
    const rows = asRows<MaintenanceSubscriptionRow>(await sql`
      SELECT * FROM maintenance_subscriptions ORDER BY created_at DESC
    `);
    return rows.map(rowToMaintenanceSubscription);
  }
  return Array.from(memorySubs.values())
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .map(rowToMaintenanceSubscription);
}

export async function getMaintenanceSubscriptionById(
  id: string,
): Promise<MaintenanceSubscription | null> {
  if (isDatabaseConfigured()) {
    await dbReady();
    const sql = getSql();
    const rows = asRows<MaintenanceSubscriptionRow>(await sql`
      SELECT * FROM maintenance_subscriptions WHERE id = ${id}::uuid LIMIT 1
    `);
    return rows[0] ? rowToMaintenanceSubscription(rows[0]) : null;
  }
  const row = memorySubs.get(id);
  return row ? rowToMaintenanceSubscription(row) : null;
}

export async function getMaintenanceSubscriptionByPaystackReference(
  reference: string,
): Promise<MaintenanceSubscription | null> {
  if (isDatabaseConfigured()) {
    await dbReady();
    const sql = getSql();
    const rows = asRows<MaintenanceSubscriptionRow>(await sql`
      SELECT * FROM maintenance_subscriptions
      WHERE paystack_reference = ${reference}
      LIMIT 1
    `);
    return rows[0] ? rowToMaintenanceSubscription(rows[0]) : null;
  }
  for (const row of memorySubs.values()) {
    if (row.paystack_reference === reference) return rowToMaintenanceSubscription(row);
  }
  return null;
}

export async function getMaintenanceSubscriptionBySlug(
  slug: string,
): Promise<MaintenanceSubscription | null> {
  if (isDatabaseConfigured()) {
    await dbReady();
    const sql = getSql();
    const rows = asRows<MaintenanceSubscriptionRow>(await sql`
      SELECT * FROM maintenance_subscriptions WHERE slug = ${slug} LIMIT 1
    `);
    return rows[0] ? rowToMaintenanceSubscription(rows[0]) : null;
  }
  for (const row of memorySubs.values()) {
    if (row.slug === slug) return rowToMaintenanceSubscription(row);
  }
  return null;
}

export async function saveMaintenanceSubscription(
  sub: MaintenanceSubscription,
): Promise<MaintenanceSubscription> {
  await upsertSubscription(subscriptionToRow(sub));
  return sub;
}

export async function insertSubscriptionChargeEvent(
  event: SubscriptionChargeEvent,
): Promise<boolean> {
  if (isDatabaseConfigured()) {
    await dbReady();
    const sql = getSql();
    const rows = asRows<{ id: string }>(await sql`
      INSERT INTO subscription_charge_events (
        id, subscription_id, paystack_reference, amount_minor, currency, paid_at, created_at
      ) VALUES (
        ${event.id}::uuid,
        ${event.subscriptionId}::uuid,
        ${event.paystackReference},
        ${event.amountMinor},
        ${event.currency},
        ${new Date(event.paidAt).toISOString()},
        ${new Date(event.createdAt).toISOString()}
      )
      ON CONFLICT (paystack_reference) DO NOTHING
      RETURNING id
    `);
    return rows.length > 0;
  }
  if (memoryCharges.has(event.paystackReference)) return false;
  memoryCharges.set(event.paystackReference, event);
  return true;
}

export async function listSubscriptionChargeEvents(
  subscriptionId: string,
): Promise<SubscriptionChargeEvent[]> {
  if (isDatabaseConfigured()) {
    await dbReady();
    const sql = getSql();
    const rows = asRows<{
      id: string;
      subscription_id: string;
      paystack_reference: string;
      amount_minor: number;
      currency: string;
      paid_at: Date | string;
      created_at: Date | string;
    }>(await sql`
      SELECT * FROM subscription_charge_events
      WHERE subscription_id = ${subscriptionId}::uuid
      ORDER BY paid_at DESC
    `);
    return rows.map((row) => ({
      id: row.id,
      subscriptionId: row.subscription_id,
      paystackReference: row.paystack_reference,
      amountMinor: Number(row.amount_minor),
      currency: row.currency,
      paidAt: new Date(row.paid_at).getTime(),
      createdAt: new Date(row.created_at).getTime(),
    }));
  }
  return Array.from(memoryCharges.values())
    .filter((event) => event.subscriptionId === subscriptionId)
    .sort((a, b) => b.paidAt - a.paidAt);
}

export function createSubscriptionId(): string {
  return crypto.randomUUID();
}

export function createSubscriptionSlug(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
