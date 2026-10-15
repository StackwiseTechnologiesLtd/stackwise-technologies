export type SubscriptionInterval = "monthly" | "quarterly" | "annually";

export type MaintenanceSubscriptionStatus =
  | "DRAFT"
  | "SENT"
  | "PENDING"
  | "ACTIVE"
  | "CANCELLED"
  | "PAST_DUE";

export type MaintenanceSubscription = {
  id: string;
  slug: string;
  customerName: string;
  customerEmail: string;
  currency: string;
  amountMinor: number;
  amountUsd: number | null;
  exchangeRate: number | null;
  interval: SubscriptionInterval;
  description: string;
  status: MaintenanceSubscriptionStatus;
  paystackPlanCode: string | null;
  paystackSubscriptionCode: string | null;
  paystackCustomerCode: string | null;
  paystackReference: string | null;
  gatewayUrl: string | null;
  sentAt: number | null;
  activatedAt: number | null;
  cancelledAt: number | null;
  nextPaymentAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export type SubscriptionChargeEvent = {
  id: string;
  subscriptionId: string;
  paystackReference: string;
  amountMinor: number;
  currency: string;
  paidAt: number;
  createdAt: number;
};

export type MaintenanceSubscriptionRow = {
  id: string;
  slug: string;
  customer_name: string;
  customer_email: string;
  currency: string;
  amount_minor: number;
  amount_usd: string | number | null;
  exchange_rate: string | number | null;
  interval: string;
  description: string;
  status: string;
  paystack_plan_code: string | null;
  paystack_subscription_code: string | null;
  paystack_customer_code: string | null;
  paystack_reference: string | null;
  gateway_url: string | null;
  sent_at: Date | string | null;
  activated_at: Date | string | null;
  cancelled_at: Date | string | null;
  next_payment_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export const SUBSCRIPTION_INTERVALS: Array<{
  value: SubscriptionInterval;
  label: string;
}> = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
];

function toMs(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  return new Date(value).getTime();
}

export function rowToMaintenanceSubscription(
  row: MaintenanceSubscriptionRow,
): MaintenanceSubscription {
  return {
    id: row.id,
    slug: row.slug,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    currency: row.currency,
    amountMinor: Number(row.amount_minor),
    amountUsd: row.amount_usd != null ? Number(row.amount_usd) : null,
    exchangeRate: row.exchange_rate != null ? Number(row.exchange_rate) : null,
    interval: row.interval as SubscriptionInterval,
    description: row.description,
    status: row.status as MaintenanceSubscriptionStatus,
    paystackPlanCode: row.paystack_plan_code,
    paystackSubscriptionCode: row.paystack_subscription_code,
    paystackCustomerCode: row.paystack_customer_code,
    paystackReference: row.paystack_reference,
    gatewayUrl: row.gateway_url,
    sentAt: toMs(row.sent_at),
    activatedAt: toMs(row.activated_at),
    cancelledAt: toMs(row.cancelled_at),
    nextPaymentAt: toMs(row.next_payment_at),
    createdAt: toMs(row.created_at) ?? Date.now(),
    updatedAt: toMs(row.updated_at) ?? Date.now(),
  };
}

export function subscriptionAmountMajor(sub: MaintenanceSubscription): number {
  return sub.amountMinor / 100;
}

export function formatSubscriptionInterval(interval: SubscriptionInterval): string {
  return SUBSCRIPTION_INTERVALS.find((item) => item.value === interval)?.label ?? interval;
}
