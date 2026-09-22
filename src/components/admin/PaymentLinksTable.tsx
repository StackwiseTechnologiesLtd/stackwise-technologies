"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EnvironmentBadge } from "@/components/admin/EnvironmentBadge";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatMoney } from "@/lib/currency";
import { resolvePaymentEnvironment } from "@/lib/kpay/environment";
import type { PaymentLink, PaymentLinkStatus } from "@/lib/payments/types";

const PAGE_SIZE = 10;

const STATUS_OPTIONS: Array<PaymentLinkStatus | "ALL"> = [
  "ALL",
  "DRAFT",
  "SENT",
  "PENDING",
  "PAID",
  "FAILED",
  "CANCELLED",
  "EXPIRED",
];

function AmountCell({ link }: { link: PaymentLink }) {
  return (
    <div>
      <p className="font-medium tabular-nums">${link.amountUsd.toFixed(2)}</p>
      <p className="text-xs text-muted tabular-nums">
        {formatMoney(link.amountLocal, link.currency)}
      </p>
    </div>
  );
}

function PaymentLinkRow({ link }: { link: PaymentLink }) {
  const environment = resolvePaymentEnvironment(link);

  return (
    <>
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
            {new Date(link.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <tr className="hidden border-t border-line transition hover:bg-panel/50 md:table-row">
        <td className="px-4 py-3">
          <div className="flex flex-col gap-1">
            <Link
              href={`/admin/payment-links/${link.id}`}
              className="font-mono text-accent hover:underline"
            >
              {link.invoiceNumber}
            </Link>
            <EnvironmentBadge environment={environment} compact />
          </div>
        </td>
        <td className="px-4 py-3">
          <p>{link.customerName}</p>
          <p className="text-xs text-muted">{link.customerEmail}</p>
        </td>
        <td className="px-4 py-3">
          <AmountCell link={link} />
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-col gap-1">
            <StatusBadge status={link.status} />
            <p className="text-[11px] text-muted tabular-nums">
              1 USD = {link.exchangeRate.toFixed(4)} {link.currency}
            </p>
          </div>
        </td>
        <td className="px-4 py-3 text-muted">
          {new Date(link.createdAt).toLocaleString()}
        </td>
      </tr>
    </>
  );
}

export function PaymentLinksTable({ links }: { links: PaymentLink[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PaymentLinkStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return links.filter((link) => {
      if (status !== "ALL" && link.status !== status) return false;
      if (!q) return true;
      return (
        link.invoiceNumber.toLowerCase().includes(q) ||
        link.customerName.toLowerCase().includes(q) ||
        link.customerEmail.toLowerCase().includes(q)
      );
    });
  }, [links, query, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageLinks = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function resetPage() {
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1 space-y-1">
          <span className="text-xs text-muted">Search</span>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              resetPage();
            }}
            placeholder="Invoice, customer, email…"
            className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block space-y-1 sm:w-44">
          <span className="text-xs text-muted">Status</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as PaymentLinkStatus | "ALL");
              resetPage();
            }}
            className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "All statuses" : option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-xs text-muted">
        Showing {pageLinks.length} of {filtered.length} link
        {filtered.length === 1 ? "" : "s"}
        {filtered.length !== links.length
          ? ` (filtered from ${links.length})`
          : ""}
      </p>

      {pageLinks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-panel/40 px-4 py-8 text-center text-sm text-muted">
          No payment links match your filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line">
          <div className="md:hidden">
            {pageLinks.map((link) => (
              <PaymentLinkRow key={link.id} link={link} />
            ))}
          </div>
          <table className="hidden w-full text-sm md:table">
            <thead className="bg-panel text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {pageLinks.map((link) => (
                <PaymentLinkRow key={link.id} link={link} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-line px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-muted">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-line px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
