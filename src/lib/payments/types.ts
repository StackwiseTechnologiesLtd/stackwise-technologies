import { localAmountFromUsd } from "@/lib/currency";

export type PaymentLinkStatus =
  | "DRAFT"
  | "SENT"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

export type LineItem = {
  serviceId: string;
  name: string;
  description?: string;
  quantity: number;
  unitPriceUsd: number;
};

export type PaymentLink = {
  id: string;
  slug: string;
  customerName: string;
  customerEmail: string;
  currency: string;
  amountUsd: number;
  amountLocal: number;
  exchangeRate: number;
  status: PaymentLinkStatus;
  lineItems: LineItem[];
  notes: string | null;
  kpayPaymentId: string | null;
  kpayReference: string | null;
  kpayIsTest: boolean | null;
  gatewayUrl: string | null;
  invoiceNumber: string;
  sentAt: number | null;
  paidAt: number | null;
  receiptSentAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export type PaymentLinkRow = {
  id: string;
  slug: string;
  customer_name: string;
  customer_email: string;
  currency: string;
  amount_usd: string | number;
  amount_local: string | number;
  exchange_rate: string | number;
  status: string;
  line_items: LineItem[] | string;
  notes: string | null;
  kpay_payment_id: string | null;
  kpay_reference: string | null;
  kpay_is_test: boolean | null;
  gateway_url: string | null;
  invoice_number: string;
  sent_at: Date | string | null;
  paid_at: Date | string | null;
  receipt_sent_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export const SUPPORTED_CURRENCIES = [
  { code: "XAF", label: "Central African CFA (XAF)", country: "CMR" },
  { code: "XOF", label: "West African CFA (XOF)", country: "SEN" },
  { code: "KES", label: "Kenyan Shilling (KES)", country: "KEN" },
  { code: "UGX", label: "Ugandan Shilling (UGX)", country: "UGA" },
  { code: "RWF", label: "Rwandan Franc (RWF)", country: "RWA" },
  { code: "ZMW", label: "Zambian Kwacha (ZMW)", country: "ZMB" },
  { code: "CDF", label: "Congolese Franc (CDF)", country: "COD" },
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]["code"];

function toMs(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  return new Date(value).getTime();
}

export function rowToPaymentLink(row: PaymentLinkRow): PaymentLink {
  const lineItems =
    typeof row.line_items === "string"
      ? (JSON.parse(row.line_items) as LineItem[])
      : row.line_items;

  const amountUsd = Number(row.amount_usd);
  const exchangeRate = Number(row.exchange_rate);
  const currency = row.currency;

  return {
    id: row.id,
    slug: row.slug,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    currency,
    amountUsd,
    amountLocal: localAmountFromUsd(amountUsd, exchangeRate, currency),
    exchangeRate,
    status: row.status as PaymentLinkStatus,
    lineItems,
    notes: row.notes,
    kpayPaymentId: row.kpay_payment_id,
    kpayReference: row.kpay_reference,
    kpayIsTest: row.kpay_is_test,
    gatewayUrl: row.gateway_url,
    invoiceNumber: row.invoice_number,
    sentAt: toMs(row.sent_at),
    paidAt: toMs(row.paid_at),
    receiptSentAt: toMs(row.receipt_sent_at),
    createdAt: toMs(row.created_at) ?? Date.now(),
    updatedAt: toMs(row.updated_at) ?? Date.now(),
  };
}
