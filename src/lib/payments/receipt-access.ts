import type { PaymentLink } from "@/lib/payments/types";

export function canAccessReceipt(link: PaymentLink): boolean {
  return link.status === "PAID";
}
