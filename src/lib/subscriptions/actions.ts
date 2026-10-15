import { convertUsdToCurrency } from "@/lib/currency";
import {
  createSubscriptionId,
  createSubscriptionSlug,
  getMaintenanceSubscriptionById,
  getMaintenanceSubscriptionByPaystackReference,
  getMaintenanceSubscriptionBySlug,
  insertSubscriptionChargeEvent,
  saveMaintenanceSubscription,
} from "@/lib/db/maintenance-subscriptions";
import { toPaystackSubunit } from "@/lib/paystack/checkout";
import { getPaystackChargeCurrencies } from "@/lib/paystack/currencies";
import {
  createPaystackPlan,
  initializePaystackTransaction,
  type PaystackTransaction,
} from "@/lib/paystack/client";
import { isPaystackConfigured } from "@/lib/paystack/environment";
import { readSubscriptionId } from "@/lib/subscriptions/metadata";
import type {
  MaintenanceSubscription,
  SubscriptionInterval,
} from "@/lib/subscriptions/types";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function createPaystackReference(slug: string): string {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  return `sub-${slug}-${suffix}`;
}

export type CreateMaintenanceSubscriptionInput = {
  customerName: string;
  customerEmail: string;
  currency: string;
  amountMajor: number;
  interval: SubscriptionInterval;
  description: string;
  amountUsd?: number;
  exchangeRate?: number;
};

export async function createMaintenanceSubscription(
  input: CreateMaintenanceSubscriptionInput,
): Promise<MaintenanceSubscription> {
  if (!isPaystackConfigured()) {
    throw new Error("Paystack must be configured for maintenance subscriptions");
  }

  const currency = input.currency.toUpperCase();
  const allowed = getPaystackChargeCurrencies();
  if (!allowed.includes(currency)) {
    throw new Error(
      `Subscriptions must use a Paystack currency (${allowed.join(", ")}).`,
    );
  }
  if (!Number.isFinite(input.amountMajor) || input.amountMajor <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const amountMinor = toPaystackSubunit(input.amountMajor, currency);
  const planName = `${input.description.trim().slice(0, 60)} — ${input.customerName.trim()}`.slice(
    0,
    100,
  );
  const plan = await createPaystackPlan({
    name: planName,
    interval: input.interval,
    amount: amountMinor,
    currency,
    description: input.description.trim(),
  });

  const now = Date.now();
  const sub: MaintenanceSubscription = {
    id: createSubscriptionId(),
    slug: createSubscriptionSlug(),
    customerName: input.customerName.trim(),
    customerEmail: input.customerEmail.trim().toLowerCase(),
    currency,
    amountMinor,
    amountUsd: input.amountUsd ?? null,
    exchangeRate: input.exchangeRate ?? null,
    interval: input.interval,
    description: input.description.trim(),
    status: "DRAFT",
    paystackPlanCode: plan.plan_code,
    paystackSubscriptionCode: null,
    paystackCustomerCode: null,
    paystackReference: null,
    gatewayUrl: null,
    sentAt: null,
    activatedAt: null,
    cancelledAt: null,
    nextPaymentAt: null,
    createdAt: now,
    updatedAt: now,
  };

  return saveMaintenanceSubscription(sub);
}

export async function initiateMaintenanceSubscriptionCheckout(
  slug: string,
): Promise<{ subscription: MaintenanceSubscription; gatewayUrl: string }> {
  const sub = await getMaintenanceSubscriptionBySlug(slug);
  if (!sub) throw new Error("Subscription not found");
  if (sub.status === "ACTIVE") {
    throw new Error("This subscription is already active");
  }
  if (!sub.paystackPlanCode) {
    throw new Error("Subscription is missing a Paystack plan");
  }

  const reference = createPaystackReference(sub.slug);
  const payment = await initializePaystackTransaction({
    email: sub.customerEmail,
    plan: sub.paystackPlanCode,
    reference,
    callback_url: `${siteUrl()}/pay/subscribe/${slug}/return`,
    channels: ["card"],
    metadata: {
      kind: "maintenance_subscription",
      subscriptionId: sub.id,
      slug: sub.slug,
    },
  });

  if (!payment.authorization_url) {
    throw new Error("Paystack did not return a checkout URL");
  }

  const updated = await saveMaintenanceSubscription({
    ...sub,
    status: "PENDING",
    paystackReference: payment.reference || reference,
    gatewayUrl: payment.authorization_url,
    updatedAt: Date.now(),
  });

  return { subscription: updated, gatewayUrl: payment.authorization_url };
}

function parsePaidAt(value: string | null | undefined): number {
  if (!value) return Date.now();
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

export async function applySubscriptionCharge(
  subscriptionId: string,
  charge: PaystackTransaction,
): Promise<MaintenanceSubscription | null> {
  const sub = await getMaintenanceSubscriptionById(subscriptionId);
  if (!sub) return null;

  if (charge.currency.toUpperCase() !== sub.currency.toUpperCase()) return sub;
  if (Number(charge.amount) !== sub.amountMinor) return sub;

  const inserted = await insertSubscriptionChargeEvent({
    id: crypto.randomUUID(),
    subscriptionId: sub.id,
    paystackReference: charge.reference,
    amountMinor: Number(charge.amount),
    currency: charge.currency,
    paidAt: parsePaidAt(charge.paid_at),
    createdAt: Date.now(),
  });

  if (!inserted) return sub;

  const chargeRecord = charge as PaystackTransaction & {
    customer?: { customer_code?: string };
    subscription_code?: string;
  };
  const customerCode =
    typeof chargeRecord.customer?.customer_code === "string"
      ? chargeRecord.customer.customer_code
      : sub.paystackCustomerCode;

  const subscriptionCode =
    typeof chargeRecord.subscription_code === "string"
      ? chargeRecord.subscription_code
      : sub.paystackSubscriptionCode;

  const paidAt = parsePaidAt(charge.paid_at);
  return saveMaintenanceSubscription({
    ...sub,
    status: "ACTIVE",
    paystackCustomerCode: customerCode,
    paystackSubscriptionCode: subscriptionCode,
    activatedAt: sub.activatedAt ?? paidAt,
    updatedAt: Date.now(),
  });
}

export async function applySubscriptionWebhookEvent(
  event: string,
  data: Record<string, unknown>,
): Promise<void> {
  const subscriptionCode =
    typeof data.subscription_code === "string" ? data.subscription_code : null;
  const customerCode =
    typeof data.customer === "object" &&
    data.customer &&
    typeof (data.customer as { customer_code?: string }).customer_code === "string"
      ? (data.customer as { customer_code: string }).customer_code
      : null;

  if (!subscriptionCode) return;

  const planCode =
    typeof data.plan === "object" &&
    data.plan &&
    typeof (data.plan as { plan_code?: string }).plan_code === "string"
      ? (data.plan as { plan_code: string }).plan_code
      : typeof data.plan === "string"
        ? data.plan
        : null;

  const subs = await import("@/lib/db/maintenance-subscriptions").then((m) =>
    m.listMaintenanceSubscriptions(),
  );
  const sub =
    subs.find((item) => item.paystackSubscriptionCode === subscriptionCode) ??
    (planCode
      ? subs.find((item) => item.paystackPlanCode === planCode)
      : undefined);

  if (!sub) return;

  if (event === "subscription.create") {
    await saveMaintenanceSubscription({
      ...sub,
      status: "ACTIVE",
      paystackSubscriptionCode: subscriptionCode,
      paystackCustomerCode: customerCode ?? sub.paystackCustomerCode,
      activatedAt: sub.activatedAt ?? Date.now(),
      updatedAt: Date.now(),
    });
    return;
  }

  if (event === "subscription.disable" || event === "subscription.not_renew") {
    await saveMaintenanceSubscription({
      ...sub,
      status: "CANCELLED",
      cancelledAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
}

export async function resolveSubscriptionFromCharge(
  charge: PaystackTransaction,
): Promise<string | null> {
  const fromMetadata = readSubscriptionId(charge.metadata);
  if (fromMetadata) return fromMetadata;

  const sub = await getMaintenanceSubscriptionByPaystackReference(charge.reference);
  return sub?.id ?? null;
}

export async function enrichSubscriptionUsd(
  input: CreateMaintenanceSubscriptionInput,
): Promise<CreateMaintenanceSubscriptionInput> {
  if (input.currency === "USD" || input.amountUsd != null) return input;
  const { rate } = await convertUsdToCurrency(1, input.currency);
  const amountUsd = input.amountMajor / rate;
  return { ...input, amountUsd, exchangeRate: rate };
}
