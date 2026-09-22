import Link from "next/link";
import type { PaymentAuditLog, PaymentAuditLogWithLink } from "@/lib/db/payment-audit";
import {
  formatAuditTimestamp,
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
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-xs">
        <thead>
          <tr className="border-b border-line bg-panel text-muted">
            <th className="px-4 py-3 font-medium">When</th>
            {showInvoice && <th className="px-4 py-3 font-medium">Invoice</th>}
            <th className="px-4 py-3 font-medium">Event</th>
            <th className="px-4 py-3 font-medium">IP</th>
            <th className="px-4 py-3 font-medium">User agent</th>
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
              <tr key={log.id} className="border-t border-line/60 align-top">
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
                  {PAYMENT_AUDIT_EVENT_LABELS[log.event] ?? log.event}
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
