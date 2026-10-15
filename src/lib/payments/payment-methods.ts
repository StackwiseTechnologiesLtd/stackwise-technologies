import type { CheckoutPaymentMethod } from "@/lib/kpay/buildGatewayInit";
import { KPAY_CARD_MAX_USD } from "@/lib/kpay/buildGatewayInit";
import type { CardProcessor } from "@/lib/payments/processor";
import type { PaymentLink } from "@/lib/payments/types";

export type PaymentMethodsOption = "CARD" | "MOBILE_MONEY" | "BOTH";

export const PAYMENT_METHODS_OPTIONS: Array<{
  value: PaymentMethodsOption;
  label: string;
  description: string;
}> = [
  {
    value: "BOTH",
    label: "Card and Mobile Money",
    description: "Customer chooses at checkout",
  },
  {
    value: "CARD",
    label: "Card only",
    description: "Visa / Mastercard",
  },
  {
    value: "MOBILE_MONEY",
    label: "Mobile Money only",
    description: "M-Pesa, MTN, Orange, etc.",
  },
];

export function paymentMethodOptionDescription(
  option: PaymentMethodsOption,
  cardProcessor: CardProcessor = "KPAY",
): string {
  if (option === "CARD") {
    return cardProcessor === "PAYSTACK"
      ? "Visa / Mastercard via Paystack"
      : "Visa / Mastercard via KPay";
  }
  return (
    PAYMENT_METHODS_OPTIONS.find((item) => item.value === option)?.description ?? ""
  );
}

export function resolveCheckoutMethods(
  option: PaymentMethodsOption,
  amountUsd?: number,
  cardProcessor: CardProcessor = "KPAY",
): CheckoutPaymentMethod[] {
  let methods: CheckoutPaymentMethod[];
  switch (option) {
    case "CARD":
      methods = ["CARD"];
      break;
    case "MOBILE_MONEY":
      methods = ["MOBILE_MONEY"];
      break;
    default:
      methods = ["CARD", "MOBILE_MONEY"];
  }

  if (
    cardProcessor === "KPAY" &&
    amountUsd != null &&
    amountUsd > KPAY_CARD_MAX_USD
  ) {
    return methods.filter((method) => method !== "CARD");
  }

  return methods;
}

export function isCheckoutMethodAllowed(
  link: PaymentLink,
  method: CheckoutPaymentMethod,
  cardProcessor: CardProcessor = "KPAY",
): boolean {
  return resolveCheckoutMethods(
    link.allowedPaymentMethods,
    link.amountUsd,
    cardProcessor,
  ).includes(method);
}
