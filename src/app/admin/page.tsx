import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminCheckoutStatus } from "@/components/admin/AdminCheckoutStatus";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PaymentLinksList } from "@/components/admin/PaymentLinksList";
import { getAdminSession } from "@/lib/auth/session";
import { listPaymentLinks } from "@/lib/db/payment-links";
import { isCheckoutTestMode } from "@/lib/payments/admin-checkout";
import { cardCheckoutProcessor } from "@/lib/payments/processor";
import { ADMIN_BTN_PRIMARY_BLOCK } from "@/lib/ui/admin";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const showTestSection = isCheckoutTestMode();
  const [liveLinks, testLinks] = showTestSection
    ? await Promise.all([
        listPaymentLinks("production"),
        listPaymentLinks("test"),
      ])
    : [await listPaymentLinks("production"), []];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Payment links"
        description="Create invoices, send checkout links, and track card and Mobile Money payments."
        meta={
          <div className="space-y-2 pt-1">
            <p className="text-xs text-muted">Signed in as {session.email}</p>
            <AdminCheckoutStatus />
          </div>
        }
        actions={
          <Link href="/admin/payment-links/new" className={ADMIN_BTN_PRIMARY_BLOCK}>
            New payment link
          </Link>
        }
      />

      <PaymentLinksList
        liveLinks={liveLinks}
        testLinks={testLinks}
        showTestSection={showTestSection}
        cardProcessor={cardCheckoutProcessor()}
      />

      {liveLinks.length === 0 && !showTestSection && (
        <div className="rounded-xl border border-line bg-panel p-8 text-center sm:p-12">
          <p className="text-muted">No payment links yet.</p>
          <Link
            href="/admin/payment-links/new"
            className="mt-4 inline-block text-accent hover:underline"
          >
            Create your first link
          </Link>
        </div>
      )}
    </div>
  );
}
