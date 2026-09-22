"use client";

import { useMemo, useState } from "react";
import { PaymentAuditLogTable } from "@/components/admin/PaymentAuditLogTable";
import type {
  PaymentAuditEvent,
  PaymentAuditLog,
  PaymentAuditLogWithLink,
} from "@/lib/db/payment-audit";
import { PAYMENT_AUDIT_EVENT_LABELS } from "@/lib/payments/audit-labels";

const PAGE_SIZE = 10;

const EVENT_OPTIONS: Array<PaymentAuditEvent | "ALL"> = [
  "ALL",
  "PAY_PAGE_VIEW",
  "PAYMENT_INIT",
  "RECEIPT_VIEW",
  "RETURN_CALLBACK",
];

type AuditRow = PaymentAuditLog | PaymentAuditLogWithLink;

export function PaymentAuditLogsPanel({
  logs,
  showInvoice = false,
  totalCount,
}: {
  logs: AuditRow[];
  showInvoice?: boolean;
  totalCount?: number;
}) {
  const [query, setQuery] = useState("");
  const [event, setEvent] = useState<PaymentAuditEvent | "ALL">("ALL");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((log) => {
      if (event !== "ALL" && log.event !== event) return false;
      if (!q) return true;

      const invoice =
        "invoiceNumber" in log ? String(log.invoiceNumber).toLowerCase() : "";
      const customer =
        "customerName" in log ? String(log.customerName).toLowerCase() : "";

      return (
        invoice.includes(q) ||
        customer.includes(q) ||
        (log.ipAddress ?? "").toLowerCase().includes(q) ||
        (log.userAgent ?? "").toLowerCase().includes(q) ||
        (PAYMENT_AUDIT_EVENT_LABELS[log.event] ?? log.event)
          .toLowerCase()
          .includes(q)
      );
    });
  }, [logs, query, event]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageLogs = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function resetPage() {
    setPage(1);
  }

  const loadedCount = totalCount ?? logs.length;

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
            placeholder="Invoice, customer, IP, user agent…"
            className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block space-y-1 sm:w-44">
          <span className="text-xs text-muted">Event</span>
          <select
            value={event}
            onChange={(e) => {
              setEvent(e.target.value as PaymentAuditEvent | "ALL");
              resetPage();
            }}
            className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm"
          >
            {EVENT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "ALL"
                  ? "All events"
                  : PAYMENT_AUDIT_EVENT_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-xs text-muted">
        Showing {pageLogs.length} of {filtered.length} log
        {filtered.length === 1 ? "" : "s"}
        {filtered.length !== loadedCount
          ? ` (filtered from ${loadedCount})`
          : ""}
      </p>

      <div className="overflow-hidden rounded-xl border border-line">
        <PaymentAuditLogTable logs={pageLogs} showInvoice={showInvoice} />
      </div>

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
