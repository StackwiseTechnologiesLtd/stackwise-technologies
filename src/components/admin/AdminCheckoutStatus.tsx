import { EnvironmentBadge } from "@/components/admin/EnvironmentBadge";
import { adminCheckoutStatus } from "@/lib/payments/admin-checkout";
import { KPAY_CHECKOUT_ENABLED } from "@/lib/payments/payment-methods";

export function AdminCheckoutStatus() {
  const status = adminCheckoutStatus();

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
      <div className="flex flex-wrap items-center gap-2">
        <span>Card checkout:</span>
        <span className="font-medium text-foreground">
          {status.cardProcessor === "PAYSTACK" ? "Paystack" : "KPay"}
        </span>
        <EnvironmentBadge environment={status.cardEnvironment} compact />
      </div>
      {KPAY_CHECKOUT_ENABLED ? (
        <div className="flex flex-wrap items-center gap-2">
          <span>Mobile Money:</span>
          <span className="font-medium text-foreground">KPay</span>
          <EnvironmentBadge environment={status.kpayEnvironment} compact />
        </div>
      ) : null}
    </div>
  );
}
