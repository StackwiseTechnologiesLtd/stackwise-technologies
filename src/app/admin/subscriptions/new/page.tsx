import { redirect } from "next/navigation";
import { MaintenanceSubscriptionBuilder } from "@/components/admin/MaintenanceSubscriptionBuilder";
import { getAdminSession } from "@/lib/auth/session";
import { SUPPORTED_CURRENCIES } from "@/lib/payments/types";
import { getPaystackChargeCurrencies } from "@/lib/paystack/currencies";
import { isPaystackConfigured } from "@/lib/paystack/environment";

export default async function NewSubscriptionPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!isPaystackConfigured()) redirect("/admin/subscriptions");

  const allowed = new Set(getPaystackChargeCurrencies());
  const currencies = SUPPORTED_CURRENCIES.filter((c) => allowed.has(c.code));

  return (
    <MaintenanceSubscriptionBuilder
      currencies={currencies}
      defaultCurrency={currencies[0]?.code ?? "KES"}
    />
  );
}
