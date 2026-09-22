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
}: {
  logs: AuditRow[];
  showInvoice?: boolean;
}) {
  if (logs.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line bg-panel/40 px-4 py-8 text-center text-sm text-muted">
        No access logs yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-xs">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="pb-2 pr-4 font-medium">When</th>
            {showInvoice && <th className="pb-2 pr-4 font-medium">Invoice</th>}
            <th className="pb-2 pr-4 font-medium">Event</th>
            <th className="pb-2 pr-4 font-medium">IP</th>
            <th className="pb-2 font-medium">User agent</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-line/60 align-top">
              <td className="py-2 pr-4 whitespace-nowrap text-muted">
                {formatAuditTimestamp(log.createdAt)}
              </td>
              {showInvoice && hasLinkContext(log) && (
                <td className="py-2 pr-4 whitespace-nowrap">
                  <Link
                    href={`/admin/payment-links/${log.paymentLinkId}`}
                    className="font-mono text-accent hover:underline"
                  >
                    {log.invoiceNumber}
                  </Link>
                  <p className="text-muted">{log.customerName}</p>
                </td>
              )}
              <td className="py-2 pr-4 whitespace-nowrap">
                {PAYMENT_AUDIT_EVENT_LABELS[log.event] ?? log.event}
              </td>
              <td className="py-2 pr-4 font-mono">{log.ipAddress ?? "—"}</td>
              <td className="py-2 break-all text-muted">
                {log.userAgent ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
