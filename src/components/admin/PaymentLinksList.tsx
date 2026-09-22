import Link from "next/link";
import { EnvironmentBadge } from "@/components/admin/EnvironmentBadge";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatMoney } from "@/lib/currency";
import { resolvePaymentEnvironment } from "@/lib/kpay/environment";
import type { PaymentLink } from "@/lib/payments/types";

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
          <div>
            <p className="font-medium">${link.amountUsd.toFixed(2)}</p>
            <p className="text-xs text-muted">
              {formatMoney(link.amountLocal, link.currency)}
            </p>
          </div>
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
          <p>${link.amountUsd.toFixed(2)}</p>
          <p className="text-xs text-muted">
            {formatMoney(link.amountLocal, link.currency)}
          </p>
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

function PaymentLinkSection({
  title,
  description,
  links,
  emptyMessage,
}: {
  title: string;
  description: string;
  links: PaymentLink[];
  emptyMessage: string;
}) {
  if (links.length === 0) {
    return (
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted">{description}</p>
        </div>
        <div className="rounded-xl border border-dashed border-line bg-panel/40 px-4 py-8 text-center text-sm text-muted">
          {emptyMessage}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted">{description}</p>
        </div>
        <p className="text-sm text-muted">{links.length} link{links.length === 1 ? "" : "s"}</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-line">
        {/* Mobile list */}
        <div className="md:hidden">{links.map((link) => (
          <PaymentLinkRow key={link.id} link={link} />
        ))}</div>

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
        title="Production payments"
        description="Live KPay transactions — real funds."
        links={production}
        emptyMessage="No production payment links yet."
      />
      <PaymentLinkSection
        title="Test payments"
        description="Sandbox KPay transactions — no real charges."
        links={test}
        emptyMessage="No test payment links yet."
      />
    </div>
  );
}
