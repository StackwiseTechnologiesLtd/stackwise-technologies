import type { PaymentAuditEvent } from "@/lib/db/payment-audit";

export const PAYMENT_AUDIT_EVENT_LABELS: Record<PaymentAuditEvent, string> = {
  PAY_PAGE_VIEW: "Invoice viewed",
  PAYMENT_INIT: "Payment started",
  RECEIPT_VIEW: "Receipt viewed",
  RETURN_CALLBACK: "Payment return",
  MANUAL_PAYMENT_RECORDED: "Manual payment recorded",
};

export { formatDateTime as formatAuditTimestamp } from "@/lib/format-datetime";

export function formatPaymentInitAuditDetail(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const { processor, method } = metadata as {
    processor?: string;
    method?: string;
  };
  if (processor === "PAYSTACK") return "Paystack · Card";
  if (method === "MOBILE_MONEY") return "KPay · Mobile Money";
  if (method === "CARD") return "KPay · Card";
  return null;
}
