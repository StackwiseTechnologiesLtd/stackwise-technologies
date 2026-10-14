import Link from "next/link";
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

export function PaymentAuditLogTable({
  logs,
  showInvoice = false,
  emptyMessage = "No access logs match your filters.",
}: {
  logs: AuditRow[];
  showInvoice?: boolean;
  emptyMessage?: string;
}) {
  const columnCount = showInvoice ? 5 : 4;

  return (
    <div className={ADMIN_TABLE_SCROLL}>
      <table className="w-full min-w-[720px] text-left text-xs sm:text-sm">
        <thead className={ADMIN_TABLE_HEAD}>
          <tr>
            <th className="px-4 py-2.5">When</th>
            {showInvoice && <th className="px-4 py-2.5">Invoice</th>}
            <th className="px-4 py-2.5">Event</th>
            <th className="px-4 py-2.5">IP</th>
            <th className="max-w-[12rem] px-4 py-2.5 sm:max-w-none">User agent</th>
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
                <td className="px-4 py-3 font-mono">{log.ipAddress ?? "—"}</td>
                <td className="px-4 py-3 break-all text-muted">
                  {log.userAgent ?? "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
