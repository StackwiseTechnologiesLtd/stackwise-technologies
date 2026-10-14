import Link from "next/link";
import { formatMoney } from "@/lib/currency";
import { formatDateTime } from "@/lib/format-datetime";
import {
  formatSubscriptionInterval,
  subscriptionAmountMajor,
  type MaintenanceSubscription,
} from "@/lib/subscriptions/types";
import { ADMIN_TABLE_HEAD, ADMIN_TABLE_SCROLL, ADMIN_TABLE_WRAP } from "@/lib/ui/admin";

export function SubscriptionsTable({
  subscriptions,
}: {
  subscriptions: MaintenanceSubscription[];
}) {
  return (
    <div className={ADMIN_TABLE_WRAP}>
      <ul className="divide-y divide-[var(--admin-border)] md:hidden">
        {subscriptions.map((sub) => (
          <li key={sub.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <Link
                href={`/admin/subscriptions/${sub.id}`}
                className="font-medium text-accent hover:underline"
              >
                {sub.customerName}
              </Link>
              <span className="rounded-md border border-[var(--admin-border)] px-2 py-0.5 text-xs text-muted">
                {sub.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">{sub.customerEmail}</p>
            <p className="mt-3 text-sm">{sub.description}</p>
            <p className="mt-1 text-xs text-muted">
              {formatMoney(subscriptionAmountMajor(sub), sub.currency)} ·{" "}
              {formatSubscriptionInterval(sub.interval)}
            </p>
            <p className="mt-2 text-xs text-muted">
              {formatDateTime(sub.createdAt)}
            </p>
          </li>
        ))}
      </ul>

      <div className={`hidden md:block ${ADMIN_TABLE_SCROLL}`}>
        <table className="w-full min-w-[640px] text-sm">
          <thead className={ADMIN_TABLE_HEAD}>
            <tr>
              <th className="px-4 py-2.5">Customer</th>
              <th className="px-4 py-2.5">Plan</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Created</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => (
              <tr
                key={sub.id}
                className="border-t border-[var(--admin-border)] hover:bg-[var(--admin-nav-hover)]"
              >
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
    </div>
  );
}
