import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SendSubscriptionButton } from "@/components/admin/SendSubscriptionButton";
import { getAdminSession } from "@/lib/auth/session";
import { formatMoney } from "@/lib/currency";
import { formatDateTime } from "@/lib/format-datetime";
import {
  getMaintenanceSubscriptionById,
  listSubscriptionChargeEvents,
} from "@/lib/db/maintenance-subscriptions";
import {
  formatSubscriptionInterval,
  subscriptionAmountMajor,
} from "@/lib/subscriptions/types";
import { BTN_SECONDARY } from "@/lib/ui/buttons";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export default async function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const sub = await getMaintenanceSubscriptionById(id);
  if (!sub) notFound();

  const charges = await listSubscriptionChargeEvents(sub.id);
  const subscribeUrl = `${siteUrl()}/pay/subscribe/${sub.slug}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/subscriptions" className="text-sm text-muted hover:text-foreground">
            ← Subscriptions
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{sub.description}</h1>
          <p className="mt-1 text-sm text-muted">
            {sub.customerName} · {sub.customerEmail}
          </p>
        </div>
        {sub.status !== "ACTIVE" && <SendSubscriptionButton id={sub.id} />}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-background p-4 text-sm">
          <p className="text-muted">Billing</p>
          <p className="mt-1 font-medium">
            {formatMoney(subscriptionAmountMajor(sub), sub.currency)} ·{" "}
            {formatSubscriptionInterval(sub.interval)}
          </p>
          <p className="mt-2 text-muted">Status: {sub.status}</p>
          {sub.paystackPlanCode && (
            <p className="mt-1 font-mono text-xs">Plan {sub.paystackPlanCode}</p>
          )}
        </div>
        <div className="rounded-xl border border-line bg-background p-4 text-sm">
          <p className="text-muted">Customer link</p>
          <a href={subscribeUrl} className="mt-1 block break-all text-accent hover:underline">
            {subscribeUrl}
          </a>
          <a href={subscribeUrl} className={`mt-3 inline-block text-sm ${BTN_SECONDARY}`}>
            Open subscribe page
          </a>
        </div>
      </div>

      <section className="rounded-xl border border-line bg-panel p-4">
        <h2 className="text-sm font-semibold">Successful charges</h2>
        {charges.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No charges recorded yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {charges.map((charge) => (
              <li key={charge.id} className="flex flex-wrap justify-between gap-2 border-t border-line/60 pt-2">
                <span className="font-mono text-xs">{charge.paystackReference}</span>
                <span className="text-muted">
                  {formatMoney(charge.amountMinor / 100, charge.currency)} ·{" "}
                  {formatDateTime(charge.paidAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-muted">
        Cancel or change payout settings in the Paystack dashboard. KPay withdrawals remain
        under Admin → Withdraw.
      </p>
    </div>
  );
}
