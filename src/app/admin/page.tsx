import Link from "next/link";
import { redirect } from "next/navigation";
import { EnvironmentBadge } from "@/components/admin/EnvironmentBadge";
import { PaymentLinksList } from "@/components/admin/PaymentLinksList";
import { getAdminSession } from "@/lib/auth/session";
import { listPaymentLinks } from "@/lib/db/payment-links";
import { isKPayTestMode } from "@/lib/kpay/environment";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const links = await listPaymentLinks();
  const kpayMode = isKPayTestMode() ? "test" : "production";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="text-2xl font-semibold">Payment links</h1>
          <p className="text-sm text-muted">Signed in as {session.email}</p>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>KPay mode:</span>
            <EnvironmentBadge environment={kpayMode} />
          </div>
        </div>
        <Link
          href="/admin/payment-links/new"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          New payment link
        </Link>
      </div>

      {links.length === 0 ? (
        <div className="rounded-xl border border-line bg-panel p-8 text-center sm:p-12">
          <p className="text-muted">No payment links yet.</p>
          <Link
            href="/admin/payment-links/new"
            className="mt-4 inline-block text-accent hover:underline"
          >
            Create your first link
          </Link>
        </div>
      ) : (
        <PaymentLinksList links={links} />
      )}
    </div>
  );
}
