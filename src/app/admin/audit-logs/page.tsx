import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PaymentAuditLogsPanel } from "@/components/admin/PaymentAuditLogsPanel";
import { getAdminSession } from "@/lib/auth/session";
import { listRecentPaymentAuditLogs } from "@/lib/db/payment-audit";

export const metadata = {
  title: "Access logs | Admin",
};

export default async function AuditLogsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const logs = await listRecentPaymentAuditLogs();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Payment access logs"
        description={`IP address and browser user agent captured on pay pages for internal auditing. Showing ${logs.length} most recent events.`}
      />

      <section className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
        <PaymentAuditLogsPanel logs={logs} showInvoice totalCount={logs.length} />
      </section>
    </div>
  );
}
