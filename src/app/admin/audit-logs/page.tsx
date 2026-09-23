import Link from "next/link";
import { redirect } from "next/navigation";
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
      <div>
        <Link href="/admin" className="text-sm text-muted hover:text-foreground">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Payment access logs</h1>
        <p className="mt-1 text-sm text-muted">
          IP address and browser user agent captured on pay pages for internal
          auditing. Loaded {logs.length} most recent events.
        </p>
      </div>

      <section className="rounded-xl border border-line bg-background p-4">
        <PaymentAuditLogsPanel logs={logs} showInvoice totalCount={logs.length} />
      </section>
    </div>
  );
}
