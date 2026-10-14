"use client";

import Link from "next/link";
import { useState } from "react";
import { AuditLogDetailDialog } from "@/components/admin/AuditLogDetailDialog";
import type { PaymentAuditLog, PaymentAuditLogWithLink } from "@/lib/db/payment-audit";
import { ADMIN_TABLE_HEAD, ADMIN_TABLE_SCROLL } from "@/lib/ui/admin";
import {
  formatAuditTimestamp,
  formatPaymentInitAuditDetail,
  PAYMENT_AUDIT_EVENT_LABELS,
} from "@/lib/payments/audit-labels";

type AuditRow = PaymentAuditLog | PaymentAuditLogWithLink;

function hasLinkContext(log: AuditRow): log is PaymentAuditLogWithLink {
  return "invoiceNumber" in log && "customerName" in log;
}

function UserAgentPreview({
  userAgent,
  onOpen,
}: {
  userAgent: string | null;
  onOpen: () => void;
}) {
  if (!userAgent) {
    return <span className="text-muted">—</span>;
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="max-w-[11rem] text-left text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent sm:max-w-[14rem]"
      aria-label="View full access log details"
    >
      <span className="line-clamp-2 text-xs leading-snug break-all">{userAgent}</span>
    </button>
  );
}

export function PaymentAuditLogTable({
  logs,
  showInvoice = false,
  emptyMessage = "No access logs match your filters.",
}: {
  logs: AuditRow[];
  showInvoice?: boolean;
  emptyMessage?: string;
}) {
  const [selectedLog, setSelectedLog] = useState<AuditRow | null>(null);
  const columnCount = showInvoice ? 5 : 4;

  return (
    <>
      <div className={ADMIN_TABLE_SCROLL}>
        <table className="w-full min-w-[720px] text-left text-xs sm:text-sm">
          <thead className={ADMIN_TABLE_HEAD}>
            <tr>
              <th className="px-4 py-2.5">When</th>
              {showInvoice && <th className="px-4 py-2.5">Invoice</th>}
              <th className="px-4 py-2.5">Event</th>
              <th className="px-4 py-2.5">IP</th>
              <th className="w-[11rem] px-4 py-2.5 sm:w-[14rem]">User agent</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan={columnCount}
                  className="px-4 py-8 text-center text-sm text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-t border-[var(--admin-border)] align-top hover:bg-[var(--admin-nav-hover)]"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-muted">
                    {formatAuditTimestamp(log.createdAt)}
                  </td>
                  {showInvoice && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      {hasLinkContext(log) ? (
                        <>
                          <Link
                            href={`/admin/payment-links/${log.paymentLinkId}`}
                            className="font-mono text-accent hover:underline"
                          >
                            {log.invoiceNumber}
                          </Link>
                          <p className="text-muted">{log.customerName}</p>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p>{PAYMENT_AUDIT_EVENT_LABELS[log.event] ?? log.event}</p>
                    {log.event === "PAYMENT_INIT" &&
                      formatPaymentInitAuditDetail(log.metadata) && (
                        <p className="mt-0.5 text-[11px] text-muted">
                          {formatPaymentInitAuditDetail(log.metadata)}
                        </p>
                      )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs sm:text-sm">
                    {log.ipAddress ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <UserAgentPreview
                      userAgent={log.userAgent}
                      onOpen={() => setSelectedLog(log)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AuditLogDetailDialog log={selectedLog} onClose={() => setSelectedLog(null)} />
    </>
  );
}
