import { PaymentAuditLogsPanel } from "@/components/admin/PaymentAuditLogsPanel";
import { listPaymentAuditLogs } from "@/lib/db/payment-audit";

export async function PaymentAuditLog({ paymentLinkId }: { paymentLinkId: string }) {
  const logs = await listPaymentAuditLogs(paymentLinkId, 500);

  return (
    <section className="rounded-xl border border-line bg-background p-4">
      <h2 className="text-sm font-semibold">Access log</h2>
      <p className="mt-1 text-xs text-muted">
        IP address and browser info for internal auditing.
      </p>
      <div className="mt-4">
        <PaymentAuditLogsPanel logs={logs} totalCount={logs.length} />
      </div>
    </section>
  );
}
