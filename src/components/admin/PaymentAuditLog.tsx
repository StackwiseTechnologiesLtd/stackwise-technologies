import { listPaymentAuditLogs, type PaymentAuditEvent } from "@/lib/db/payment-audit";

const EVENT_LABELS: Record<PaymentAuditEvent, string> = {
  PAY_PAGE_VIEW: "Invoice viewed",
  PAYMENT_INIT: "Payment started",
  RECEIPT_VIEW: "Receipt viewed",
  RETURN_CALLBACK: "KPay return",
};

function formatWhen(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export async function PaymentAuditLog({ paymentLinkId }: { paymentLinkId: string }) {
  const logs = await listPaymentAuditLogs(paymentLinkId, 25);
  if (logs.length === 0) return null;

  return (
    <section className="rounded-xl border border-line bg-background p-4">
      <h2 className="text-sm font-semibold">Access log</h2>
      <p className="mt-1 text-xs text-muted">
        IP address and browser info for internal auditing.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="pb-2 pr-4 font-medium">When</th>
              <th className="pb-2 pr-4 font-medium">Event</th>
              <th className="pb-2 pr-4 font-medium">IP</th>
              <th className="pb-2 font-medium">User agent</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-line/60 align-top">
                <td className="py-2 pr-4 whitespace-nowrap text-muted">
                  {formatWhen(log.createdAt)}
                </td>
                <td className="py-2 pr-4 whitespace-nowrap">
                  {EVENT_LABELS[log.event] ?? log.event}
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
    </section>
  );
}
