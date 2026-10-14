import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { listMaintenanceSubscriptions } from "@/lib/db/maintenance-subscriptions";
import { isPaystackConfigured } from "@/lib/paystack/environment";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SubscriptionsTable } from "@/components/admin/SubscriptionsTable";
import { ADMIN_BTN_PRIMARY_BLOCK } from "@/lib/ui/admin";

export default async function SubscriptionsAdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const paystackEnabled = isPaystackConfigured();
  const subscriptions = paystackEnabled ? await listMaintenanceSubscriptions() : [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Maintenance subscriptions"
        description="Recurring software maintenance billed through Paystack (card only)."
        actions={
          paystackEnabled ? (
            <Link href="/admin/subscriptions/new" className={ADMIN_BTN_PRIMARY_BLOCK}>
              New subscription
            </Link>
          ) : undefined
        }
      />

      {!paystackEnabled && (
        <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4 text-sm text-amber-100">
          Add <code className="text-amber-50">PAYSTACK_SECRET_KEY</code> to enable
          recurring subscriptions.
        </div>
      )}

      {paystackEnabled && subscriptions.length === 0 && (
        <p className="text-sm text-muted">No subscriptions yet.</p>
      )}

      {subscriptions.length > 0 && (
        <SubscriptionsTable subscriptions={subscriptions} />
      )}
    </div>
  );
}
