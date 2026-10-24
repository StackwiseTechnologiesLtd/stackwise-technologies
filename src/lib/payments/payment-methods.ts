import type { CheckoutPaymentMethod } from "@/lib/kpay/buildGatewayInit";
import { KPAY_CARD_MAX_USD } from "@/lib/kpay/buildGatewayInit";
import type { CardProcessor } from "@/lib/payments/processor";
import type { PaymentLink } from "@/lib/payments/types";

export type PaymentMethodsOption = "CARD" | "MOBILE_MONEY" | "BOTH";

/** KPay card + Mobile Money checkout. Set true to re-enable admin + pay-page KPay rails. */
export const KPAY_CHECKOUT_ENABLED = false;

const ALL_PAYMENT_METHODS_OPTIONS: Array<{
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

export const PAYMENT_METHODS_OPTIONS = KPAY_CHECKOUT_ENABLED
  ? ALL_PAYMENT_METHODS_OPTIONS
  : ALL_PAYMENT_METHODS_OPTIONS.filter((item) => item.value === "CARD");

export const DEFAULT_PAYMENT_METHODS_OPTION: PaymentMethodsOption =
  KPAY_CHECKOUT_ENABLED ? "BOTH" : "CARD";

function effectivePaymentMethodsOption(
  option: PaymentMethodsOption,
): PaymentMethodsOption {
  if (KPAY_CHECKOUT_ENABLED) return option;
  if (option === "CARD") return "CARD";
  return "CARD";
}

export function paymentMethodOptionDescription(
  option: PaymentMethodsOption,
  cardProcessor: CardProcessor = "KPAY",
): string {
  const effective = effectivePaymentMethodsOption(option);
  if (effective === "CARD") {
    return cardProcessor === "PAYSTACK"
      ? "Visa / Mastercard via Paystack"
      : "Visa / Mastercard via KPay";
  }
  return (
    ALL_PAYMENT_METHODS_OPTIONS.find((item) => item.value === effective)
      ?.description ?? ""
  );
}

export function resolveCheckoutMethods(
  option: PaymentMethodsOption,
  amountUsd?: number,
  cardProcessor: CardProcessor = "KPAY",
): CheckoutPaymentMethod[] {
  const effective = effectivePaymentMethodsOption(option);

  let methods: CheckoutPaymentMethod[];
  switch (effective) {
    case "CARD":
      methods = ["CARD"];
      break;
    case "MOBILE_MONEY":
      methods = ["MOBILE_MONEY"];
      break;
    default:
      methods = ["CARD", "MOBILE_MONEY"];
  }

  if (!KPAY_CHECKOUT_ENABLED) {
    methods = methods.filter((method) => method !== "MOBILE_MONEY");
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
