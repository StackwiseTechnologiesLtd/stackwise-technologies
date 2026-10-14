import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { listMaintenanceSubscriptions } from "@/lib/db/maintenance-subscriptions";
import { formatMoney } from "@/lib/currency";
import { formatDateTime } from "@/lib/format-datetime";
import { isPaystackConfigured } from "@/lib/paystack/environment";
import {
  formatSubscriptionInterval,
  subscriptionAmountMajor,
} from "@/lib/subscriptions/types";
import { BTN_PRIMARY } from "@/lib/ui/buttons";

export default async function SubscriptionsAdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const paystackEnabled = isPaystackConfigured();
  const subscriptions = paystackEnabled ? await listMaintenanceSubscriptions() : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Maintenance subscriptions</h1>
          <p className="mt-1 text-sm text-muted">
            Recurring software maintenance billed through Paystack (card only).
          </p>
        </div>
        {paystackEnabled && (
          <Link href="/admin/subscriptions/new" className={BTN_PRIMARY}>
            New subscription
          </Link>
        )}
      </div>

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
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-panel text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/subscriptions/${sub.id}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {sub.customerName}
                    </Link>
                    <p className="text-xs text-muted">{sub.customerEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{sub.description}</p>
                    <p className="text-xs text-muted">
                      {formatMoney(subscriptionAmountMajor(sub), sub.currency)} ·{" "}
                      {formatSubscriptionInterval(sub.interval)}
                    </p>
                  </td>
                  <td className="px-4 py-3">{sub.status}</td>
                  <td className="px-4 py-3 text-muted">
                    {formatDateTime(sub.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
