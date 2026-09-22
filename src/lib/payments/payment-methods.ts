import type { CheckoutPaymentMethod } from "@/lib/kpay/buildGatewayInit";
import { KPAY_CARD_MAX_USD } from "@/lib/kpay/buildGatewayInit";
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
    description: "Visa / Mastercard via KPay",
  },
  {
    value: "MOBILE_MONEY",
    label: "Mobile Money only",
    description: "M-Pesa, MTN, Orange, etc.",
  },
];

export function resolveCheckoutMethods(
  option: PaymentMethodsOption,
  amountUsd?: number,
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

  if (amountUsd != null && amountUsd > KPAY_CARD_MAX_USD) {
    return methods.filter((method) => method !== "CARD");
  }

  return methods;
}

export function isCheckoutMethodAllowed(
  link: PaymentLink,
  method: CheckoutPaymentMethod,
): boolean {
  return resolveCheckoutMethods(
    link.allowedPaymentMethods,
    link.amountUsd,
  ).includes(method);
}
