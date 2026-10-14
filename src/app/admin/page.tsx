import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminCheckoutStatus } from "@/components/admin/AdminCheckoutStatus";
import { PaymentLinksList } from "@/components/admin/PaymentLinksList";
import { getAdminSession } from "@/lib/auth/session";
import { listPaymentLinks } from "@/lib/db/payment-links";
import { isCheckoutTestMode } from "@/lib/payments/admin-checkout";
import { cardCheckoutProcessor } from "@/lib/payments/processor";
import { BTN_PRIMARY } from "@/lib/ui/buttons";

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="text-2xl font-semibold">Payment links</h1>
          <p className="text-sm text-muted">Signed in as {session.email}</p>
          <AdminCheckoutStatus />
        </div>
        <Link
          href="/admin/payment-links/new"
          className={`inline-flex shrink-0 items-center justify-center py-2.5 text-sm ${BTN_PRIMARY}`}
        >
          New payment link
        </Link>
      </div>

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
