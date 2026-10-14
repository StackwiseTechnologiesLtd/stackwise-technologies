export const MANUAL_PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
  { value: "CARD", label: "Card (off-gateway)" },
  { value: "CHECK", label: "Check" },
  { value: "OTHER", label: "Other" },
] as const;

export type ManualPaymentMethod =
  (typeof MANUAL_PAYMENT_METHODS)[number]["value"];

const LABELS = Object.fromEntries(
  MANUAL_PAYMENT_METHODS.map(({ value, label }) => [value, label]),
) as Record<ManualPaymentMethod, string>;

export function isManualPaymentMethod(value: string): value is ManualPaymentMethod {
  return value in LABELS;
}

const GATEWAY_LABELS: Record<string, string> = {
  PAYSTACK_CARD: "Card (Paystack)",
  KPAY_CARD: "Card (KPay)",
  KPAY_MOBILE_MONEY: "Mobile Money (KPay)",
};

export function formatPaymentMethodLabel(method: string | null | undefined): string {
  if (!method) return "—";
  return GATEWAY_LABELS[method] ?? LABELS[method as ManualPaymentMethod] ?? method;
}
