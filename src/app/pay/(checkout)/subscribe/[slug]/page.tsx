import { notFound } from "next/navigation";
import Mark from "@/components/Mark";
import { PaymentLegalNotice } from "@/components/payments/PaymentLegalNotice";
import { SubscribeButton } from "@/components/payments/SubscribeButton";
import { formatMoney } from "@/lib/currency";
import { SITE_NAME } from "@/lib/content";
import { getMaintenanceSubscriptionBySlug } from "@/lib/db/maintenance-subscriptions";
import {
  formatSubscriptionInterval,
  subscriptionAmountMajor,
} from "@/lib/subscriptions/types";

export default async function SubscribePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sub = await getMaintenanceSubscriptionBySlug(slug);
  if (!sub) notFound();

  const amount = formatMoney(subscriptionAmountMajor(sub), sub.currency);
  const isActive = sub.status === "ACTIVE";

  return (
    <div className="space-y-8 pb-44 md:pb-0">
      <div className="flex items-center gap-3">
        <Mark className="h-8 w-8" />
        <div>
          <p className="font-semibold">{SITE_NAME}</p>
          <p className="text-sm text-muted">Maintenance subscription</p>
        </div>
      </div>

      <article className="rounded-xl border border-line bg-panel p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Software maintenance
        </p>
        <h1 className="mt-2 text-2xl font-semibold">{sub.description}</h1>
        <p className="mt-4 text-sm text-muted">
          For <span className="text-foreground">{sub.customerName}</span> ·{" "}
          {sub.customerEmail}
        </p>

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Amount</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">{amount}</dd>
          </div>
          <div>
            <dt className="text-muted">Billing</dt>
            <dd className="mt-1 font-medium">
              {formatSubscriptionInterval(sub.interval)}
            </dd>
          </div>
        </dl>

        {isActive ? (
          <div className="mt-8 rounded-lg border border-emerald-900 bg-emerald-950/30 p-4 text-sm text-emerald-200">
            This subscription is active. Future charges will be collected automatically
            on your card via Paystack.
          </div>
        ) : (
          <>
            <div className="hidden md:block mt-8">
              <SubscribeButton slug={slug} />
            </div>
            <div className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-line bg-[#0b0b0b]/95 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md">
              <SubscribeButton slug={slug} />
            </div>
          </>
        )}
      </article>

      <PaymentLegalNotice />
    </div>
  );
}
