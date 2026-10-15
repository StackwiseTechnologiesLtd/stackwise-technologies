import type { PaymentEnvironment } from "@/lib/kpay/environment";
import { isKPayTestMode } from "@/lib/kpay/environment";
import {
  cardCheckoutProcessor,
  type CardProcessor,
} from "@/lib/payments/processor";
import {
  isPaystackConfigured,
  isPaystackTestMode,
} from "@/lib/paystack/environment";

export type AdminCheckoutStatus = {
  cardProcessor: CardProcessor;
  paystackEnabled: boolean;
  cardEnvironment: PaymentEnvironment;
  kpayEnvironment: PaymentEnvironment;
};

/** Whether new links and the admin test section use sandbox checkout. */
export function isCheckoutTestMode(): boolean {
  if (isPaystackConfigured()) return isPaystackTestMode();
  return isKPayTestMode();
}

export function adminCheckoutStatus(): AdminCheckoutStatus {
  const paystackEnabled = isPaystackConfigured();
  const cardProcessor = cardCheckoutProcessor();

  return {
    cardProcessor,
    paystackEnabled,
    cardEnvironment: paystackEnabled
      ? isPaystackTestMode()
        ? "test"
        : "production"
      : isKPayTestMode()
        ? "test"
        : "production",
    kpayEnvironment: isKPayTestMode() ? "test" : "production",
  };
}
