"use client";

import { useMemo, useState } from "react";
import { PaymentAuditLogTable } from "@/components/admin/PaymentAuditLogTable";
import type {
  PaymentAuditEvent,
  PaymentAuditLog,
  PaymentAuditLogWithLink,
} from "@/lib/db/payment-audit";
import { ADMIN_TABLE_PAGE_SIZE, paginate } from "@/lib/admin/pagination";
import { TablePagination } from "@/components/admin/TablePagination";
import { ipGeoSearchText } from "@/lib/ip-geo";
import { PAYMENT_AUDIT_EVENT_LABELS } from "@/lib/payments/audit-labels";
import {
  ADMIN_INPUT,
  ADMIN_SELECT,
  ADMIN_TABLE_WRAP,
} from "@/lib/ui/admin";

const EVENT_OPTIONS: Array<PaymentAuditEvent | "ALL"> = [
  "ALL",
  "PAY_PAGE_VIEW",
  "PAYMENT_INIT",
  "RECEIPT_VIEW",
  "RETURN_CALLBACK",
  "MANUAL_PAYMENT_RECORDED",
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
        ipGeoSearchText(log.ipGeo).toLowerCase().includes(q) ||
        (log.userAgent ?? "").toLowerCase().includes(q) ||
        (PAYMENT_AUDIT_EVENT_LABELS[log.event] ?? log.event)
          .toLowerCase()
          .includes(q)
      );
    });
  }, [logs, query, event]);

  const {
    items: pageLogs,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
  } = paginate(filtered, page, ADMIN_TABLE_PAGE_SIZE);

  function resetPage() {
    setPage(1);
  }

  const loadedCount = totalCount ?? logs.length;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">Search access logs</span>
          <svg
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3-3" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              resetPage();
            }}
            placeholder="Search invoice, IP, location, ISP, or user agent…"
            className={`${ADMIN_INPUT} pl-9`}
          />
        </label>
        <label className="block w-full sm:w-44">
          <span className="sr-only">Filter by event</span>
          <select
            value={event}
            onChange={(e) => {
              setEvent(e.target.value as PaymentAuditEvent | "ALL");
              resetPage();
            }}
            className={ADMIN_SELECT}
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
        {filtered.length} log{filtered.length === 1 ? "" : "s"}
        {filtered.length !== loadedCount
          ? ` (filtered from ${loadedCount})`
          : ""}
      </p>

      <div className={ADMIN_TABLE_WRAP}>
        <PaymentAuditLogTable logs={pageLogs} showInvoice={showInvoice} />
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
}
