import type { PaymentAuditEvent } from "@/lib/db/payment-audit";

export const PAYMENT_AUDIT_EVENT_LABELS: Record<PaymentAuditEvent, string> = {
  PAY_PAGE_VIEW: "Invoice viewed",
  PAYMENT_INIT: "Payment started",
  RECEIPT_VIEW: "Receipt viewed",
  RETURN_CALLBACK: "KPay return",
};

export { formatDateTime as formatAuditTimestamp } from "@/lib/format-datetime";
