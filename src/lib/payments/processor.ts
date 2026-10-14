import { isPaystackConfigured } from "@/lib/paystack/environment";

export type CardProcessor = "PAYSTACK" | "KPAY";

/** Paystack is the primary card rail when its secret key is set. */
export function cardCheckoutProcessor(): CardProcessor {
  return isPaystackConfigured() ? "PAYSTACK" : "KPAY";
}
