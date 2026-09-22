import Link from "next/link";
import { EnvironmentBadge } from "@/components/admin/EnvironmentBadge";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { WalletBalancesLoader } from "@/components/admin/WalletBalancesLoader";
import { formatMoney } from "@/lib/currency";
import {
  resolvePaymentEnvironment,
  summarizePaymentLinks,
  type PaymentEnvironment,
} from "@/lib/kpay/environment";
import type { PaymentLink } from "@/lib/payments/types";

function AmountCell({ link }: { link: PaymentLink }) {
  return (
    <div>
      <p className="font-medium tabular-nums">${link.amountUsd.toFixed(2)}</p>
      <p className="text-xs text-muted tabular-nums">
        {formatMoney(link.amountLocal, link.currency)}
      </p>
      <p className="text-[11px] text-muted tabular-nums">
        1 USD = {link.exchangeRate.toFixed(4)} {link.currency}
      </p>
    </div>
  );
}

function PaymentLinkRow({ link }: { link: PaymentLink }) {
  const environment = resolvePaymentEnvironment(link);

  return (
    <>
      {/* Mobile card */}
      <div className="border-t border-line p-4 md:hidden">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Link
            href={`/admin/payment-links/${link.id}`}
            className="font-mono text-sm font-medium text-accent hover:underline"
          >
            {link.invoiceNumber}
          </Link>
          <div className="flex flex-wrap gap-2">
            <EnvironmentBadge environment={environment} compact />
            <StatusBadge status={link.status} />
          </div>
        </div>
        <p className="mt-2 font-medium">{link.customerName}</p>
        <p className="text-xs text-muted">{link.customerEmail}</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <AmountCell link={link} />
          <p className="text-xs text-muted">
            {new Date(link.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Desktop row */}
      <tr className="hidden border-t border-line transition hover:bg-panel/50 md:table-row">
        <td className="px-4 py-3">
          <Link
            href={`/admin/payment-links/${link.id}`}
            className="font-mono text-accent hover:underline"
          >
            {link.invoiceNumber}
          </Link>
        </td>
        <td className="px-4 py-3">
          <EnvironmentBadge environment={environment} compact />
        </td>
        <td className="px-4 py-3">
          <p>{link.customerName}</p>
          <p className="text-xs text-muted">{link.customerEmail}</p>
        </td>
        <td className="px-4 py-3">
          <AmountCell link={link} />
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={link.status} />
        </td>
        <td className="px-4 py-3 text-muted">
          {new Date(link.createdAt).toLocaleDateString()}
        </td>
      </tr>
    </>
  );
}

function invoiceSummaryText(links: PaymentLink[]): string {
  const summary = summarizePaymentLinks(links);
  if (summary.count === 0) return "";
  const parts = [
    `${summary.count} link${summary.count === 1 ? "" : "s"}`,
    `$${summary.totalUsd.toFixed(2)} invoiced`,
  ];
  if (summary.paidCount > 0) {
    parts.push(`$${summary.paidUsd.toFixed(2)} paid`);
  }
  return parts.join(" · ");
}

function PaymentLinkSection({
  title,
  description,
  environment,
  links,
  emptyMessage,
}: {
  title: string;
  description: string;
  environment: PaymentEnvironment;
  links: PaymentLink[];
  emptyMessage: string;
}) {
  const summaryText = invoiceSummaryText(links);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted">{description}</p>
          {summaryText && (
            <p className="mt-1 text-xs text-muted tabular-nums">{summaryText}</p>
          )}
        </div>
      </div>

      <WalletBalancesLoader environment={environment} />

      {links.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-panel/40 px-4 py-8 text-center text-sm text-muted">
          {emptyMessage}
        </div>
      ) : (

        <div className="overflow-hidden rounded-xl border border-line">
          {/* Mobile list */}
          <div className="md:hidden">
            {links.map((link) => (
              <PaymentLinkRow key={link.id} link={link} />
            ))}
          </div>

          {/* Desktop table */}
          <table className="hidden w-full text-sm md:table">
            <thead className="bg-panel text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Env</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <PaymentLinkRow key={link.id} link={link} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function PaymentLinksList({ links }: { links: PaymentLink[] }) {
  const production = links.filter(
    (link) => resolvePaymentEnvironment(link) === "production",
  );
  const test = links.filter((link) => resolvePaymentEnvironment(link) === "test");

  return (
    <div className="space-y-8">
      <PaymentLinkSection
        title="Live payments"
        description="Real KPay wallet and payment links."
        environment="production"
        links={production}
        emptyMessage="No live payment links yet."
      />
      <PaymentLinkSection
        title="Test payments"
        description="Sandbox KPay wallet and payment links."
        environment="test"
        links={test}
        emptyMessage="No test payment links yet."
      />
    </div>
  );
}
