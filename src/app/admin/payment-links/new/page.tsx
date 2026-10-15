import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { PaymentLinkBuilder } from "@/components/admin/PaymentLinkBuilder";
import { cardCheckoutProcessor } from "@/lib/payments/processor";
import { getPaystackChargeCurrencies } from "@/lib/paystack/currencies";
import { isPaystackConfigured } from "@/lib/paystack/environment";

export default async function NewPaymentLinkPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <PaymentLinkBuilder
      cardProcessor={cardCheckoutProcessor()}
      paystackCurrencies={
        isPaystackConfigured() ? getPaystackChargeCurrencies() : []
      }
    />
  );
}
