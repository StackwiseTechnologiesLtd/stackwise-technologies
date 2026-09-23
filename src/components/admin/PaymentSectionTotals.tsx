import { EnvironmentBadge } from "@/components/admin/EnvironmentBadge";
import { formatMoney } from "@/lib/currency";
import {
  summarizePaymentLinks,
  type PaymentEnvironment,
  type PaymentLinkSummary,
} from "@/lib/kpay/environment";
import type { PaymentLink } from "@/lib/payments/types";

function TotalsGrid({
  environment,
  summary,
}: {
  environment: PaymentEnvironment;
  summary: PaymentLinkSummary;
}) {
  const localEntries = Object.entries(summary.localByCurrency);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-xl border border-line bg-panel p-4">
        <div className="flex items-center gap-2">
          <EnvironmentBadge environment={environment} compact />
          <p className="text-sm text-muted">Invoiced (DB)</p>
        </div>
        <p className="mt-1 text-xl font-semibold tabular-nums">
          ${summary.totalUsd.toFixed(2)}
        </p>
        <p className="mt-1 text-xs text-muted">
          {summary.count} link{summary.count === 1 ? "" : "s"}
        </p>
      </div>

      <div className="rounded-xl border border-line bg-panel p-4">
        <p className="text-sm text-muted">Collected (paid)</p>
        <p className="mt-1 text-xl font-semibold tabular-nums">
          ${summary.paidUsd.toFixed(2)}
        </p>
        <p className="mt-1 text-xs text-muted">
          {summary.paidCount} paid
        </p>
      </div>

      {localEntries.map(([currency, bucket]) => (
        <div
          key={currency}
          className="rounded-xl border border-line bg-panel p-4"
        >
          <p className="text-sm text-muted">{currency} invoiced</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {formatMoney(bucket.total, currency)}
          </p>
          <p className="mt-1 text-xs text-muted tabular-nums">
            {bucket.paidCount > 0
              ? `${formatMoney(bucket.paid, currency)} collected`
              : "No paid links yet"}
          </p>
        </div>
      ))}
    </div>
  );
}

export function PaymentSectionTotals({
  environment,
  links,
}: {
  environment: PaymentEnvironment;
  links: PaymentLink[];
}) {
  if (links.length === 0) return null;
  return (
    <TotalsGrid
      environment={environment}
      summary={summarizePaymentLinks(links)}
    />
  );
}
